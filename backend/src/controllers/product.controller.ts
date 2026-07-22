import { Request, Response } from 'express';
import prisma from '../prisma';
import { createProductSchema, updateProductSchema } from '../validations/product.validation';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { status, brand, search, page, pageSize, branchId } = req.query;
    
    const pageNum = Math.max(1, parseInt(String(page || '1')));
    const limit = Math.min(200, Math.max(1, parseInt(String(pageSize || '100')))); // Max 200 per page
    const skip = (pageNum - 1) * limit;

    const user = req.user;
    let whereClause: any = {
      deletedAt: null // Exclude soft-deleted products
    };
    
    // In Master-Detail architecture, Product is universal master data.
    // We remove branchId filters from the main product where clause because branchId is on ProductItem.
    // But we filter the included items so totalStock reflects the selected branch.
    const itemsWhere: any = { status: 'AVAILABLE' };
    if (branchId && branchId !== 'all') {
      itemsWhere.branchId = String(branchId);
    }

    const [products, total, categoryCounts] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          category: true,
          items: {
            where: itemsWhere,
            include: { branch: true }
          }
        }
      }),
      prisma.product.count({ where: whereClause }),
      prisma.product.groupBy({
        by: ['categoryId'],
        where: whereClause,
        _count: { id: true }
      })
    ]);
    
    const summary = categoryCounts.reduce((acc, curr) => {
      const cat = curr.categoryId || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const mappedProducts = products.map(p => ({
      ...p,
      categoryName: p.category?.name || 'Uncategorized',
      totalStock: p.items.reduce((sum, item) => sum + (item.qty || 1), 0)
    }));
    
    res.json({ 
      success: true, 
      data: mappedProducts,
      summary,
      pagination: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};


export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { branch: true }
    });
    
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    // Branch Isolation
    if (req.user && ['Cashier', 'Leader'].includes(req.user.role) && req.user.branchId) {
      if (product.branchId !== req.user.branchId) {
        res.status(403).json({ success: false, error: 'Forbidden: Product belongs to another branch' });
        return;
      }
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = createProductSchema.parse(req.body);
    
    if (req.user && req.user.role === 'Cashier') {
      res.status(403).json({ success: false, error: 'Cashier cannot add master products' });
      return;
    }

    const { category, serialNumber, sku, status, ...restData } = validatedData as any;
    const skuId = req.body.sku || req.body.id || `PROD-${Date.now()}`;

    // Resolve Category ID from Category Name
    let categoryId: string | undefined = undefined;
    if (category) {
      let catObj = await prisma.category.findFirst({ where: { name: category } });
      if (!catObj) {
        catObj = await prisma.category.create({ data: { name: category } });
      }
      categoryId = catObj.id;
    }

    // Create Master Product
    const product = await prisma.product.create({
      data: {
        ...restData,
        id: skuId,
        sku: skuId,
        categoryId: categoryId || undefined,
      },
    });

    // Find or Create InboundBatch for physical stock tracking
    let initSupplier = await prisma.supplier.findFirst({ where: { code: 'INIT' } });
    if (!initSupplier) {
      initSupplier = await prisma.supplier.create({
        data: { code: 'INIT', name: 'Stock Initialization' }
      });
    }

    const receivedById = req.user?.id || '200001';
    const inboundBatch = await prisma.inboundBatch.create({
      data: {
        supplierId: initSupplier.id,
        receivedById: receivedById,
        branchId: restData.branchId,
        inboundDate: new Date()
      }
    });

    // Create physical ProductItem stock
    const sn = serialNumber || `${skuId}-SN-${Date.now()}`;
    await prisma.productItem.create({
      data: {
        sn,
        qty: 1,
        status: status || 'AVAILABLE',
        product: { connect: { id: product.id } },
        branch: { connect: { id: restData.branchId } },
        inboundBatch: { connect: { id: inboundBatch.id } }
      }
    });

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: (error as any).errors });
      return;
    }
    if ((error as any).code === 'P2002') {
      res.status(400).json({ success: false, error: 'ID Produk sudah terdaftar (Duplicate)' });
      return;
    }
    if ((error as any).code === 'P2003') {
      res.status(400).json({ success: false, error: 'Invalid Branch ID' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const validatedData = updateProductSchema.parse(req.body);
    
    const product = await prisma.product.update({
      where: { id },
      data: validatedData,
    });
    res.json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: (error as any).errors });
      return;
    }
    if ((error as any).code === 'P2025') {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // Enforce role
    if (req.user && req.user.role === 'Cashier') {
      res.status(403).json({ success: false, error: 'Cashier cannot delete products' });
      return;
    }

    // Check if product has transaction history — prevent orphan data
    const hasHistory = await prisma.transactionItem.findFirst({ where: { productId: id } });
    if (hasHistory) {
      // Soft delete — keep record for audit trail
      await prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
      res.status(200).json({ success: true, message: 'Product archived (has transaction history)' });
      return;
    }

    // Hard delete only if no transaction history
    await prisma.product.delete({ where: { id } });

    // Audit log
    await prisma.log.create({
      data: {
        userId: req.user?.id,
        action: 'DELETE_PRODUCT',
        entityType: 'Product',
        entityId: id,
        details: `Product ${id} deleted`,
        ipAddress: req.ip || null
      }
    });

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
};

export const importBulkProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = req.body.products;
    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ success: false, error: 'Invalid or empty products array' });
      return;
    }

    if (req.user && req.user.role === 'Cashier') {
      res.status(403).json({ success: false, error: 'Cashier cannot import products' });
      return;
    }

    // 1. Find or Create Dummy Supplier for Initialization
    let initSupplier = await prisma.supplier.findFirst({ where: { code: 'INIT' } });
    if (!initSupplier) {
      initSupplier = await prisma.supplier.create({
        data: { code: 'INIT', name: 'Stock Initialization' }
      });
    }

    const branchId = products[0]?.branchId || req.user?.branchId || 'branch-001';
    const receivedById = req.user?.id || '200001';

    // 2. Create Inbound Batch
    const inboundBatch = await prisma.inboundBatch.create({
      data: {
        supplierId: initSupplier.id,
        receivedById: receivedById,
        branchId: branchId,
        inboundDate: new Date()
      }
    });

    // 3. Group by SKU
    const skuGroups: Record<string, any[]> = {};
    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const sku = String(row.sku || row.id || '').trim() || `PROD-AUTO-${Date.now()}-${i}`;
      if (!skuGroups[sku]) skuGroups[sku] = [];
      skuGroups[sku].push(row);
    }

    let itemsCreated = 0;
    let productsUpserted = 0;

    // 4. Process each SKU Group
    for (const [sku, rows] of Object.entries(skuGroups)) {
      const masterRow = rows[0]; // Take master data from the first row

      // Find or Create Category
      const catName = masterRow.category || 'Uncategorized';
      let category = await prisma.category.findFirst({ where: { name: catName } });
      if (!category) {
        category = await prisma.category.create({ data: { name: catName } });
      }

      // Upsert Product (Master Data)
      const product = await prisma.product.upsert({
        where: { sku: sku },
        update: {
          name: String(masterRow.name || 'Produk Noname'),
          buyPrice: Number(masterRow.buyPrice || masterRow.basePrice || 0),
          developmentCost: Number(masterRow.developmentCost || masterRow.modalPengembang || 0),
          sellPrice: Number(masterRow.sellPrice || masterRow.retailPrice || 0),
          categoryId: category.id,
          brand: masterRow.brand || undefined,
          model: masterRow.model || undefined,
          processor: masterRow.processor || undefined,
          ram: masterRow.ram || undefined,
          storage: masterRow.storage || undefined,
          gpu: masterRow.gpu || undefined,
          screenSize: masterRow.screenSize || undefined,
          color: masterRow.color || undefined,
          deletedAt: null,
        },
        create: {
          sku: sku,
          name: String(masterRow.name || 'Produk Noname'),
          buyPrice: Number(masterRow.buyPrice || masterRow.basePrice || 0),
          developmentCost: Number(masterRow.developmentCost || masterRow.modalPengembang || 0),
          sellPrice: Number(masterRow.sellPrice || masterRow.retailPrice || 0),
          categoryId: category.id,
          branchId: masterRow.branchId || branchId,
          brand: masterRow.brand || undefined,
          model: masterRow.model || undefined,
          processor: masterRow.processor || undefined,
          ram: masterRow.ram || undefined,
          storage: masterRow.storage || undefined,
          gpu: masterRow.gpu || undefined,
          screenSize: masterRow.screenSize || undefined,
          color: masterRow.color || undefined,
        }
      });
      productsUpserted++;

      // Create Product Items (Physical Stock)
      const itemData = rows.map((row, idx) => ({
        sn: row.serialNumber || `${sku}-BATCH-${Date.now()}-${idx}`,
        qty: Number(row.qty || 1),
        status: 'AVAILABLE',
        productId: product.id,
        inboundBatchId: inboundBatch.id,
        branchId: row.branchId || branchId
      }));

      // Insert ignoring duplicates (if SN already exists)
      const createdItems = await prisma.productItem.createMany({
        data: itemData,
        skipDuplicates: true
      });
      itemsCreated += createdItems.count;
    }

    res.status(200).json({ 
      success: true, 
      message: `Berhasil mengimpor ${productsUpserted} Produk Master dan ${itemsCreated} Stok Fisik.` 
    });
  } catch (error: any) {
    console.error("Bulk Import Error:", error);
    let detailsStr = error?.message || String(error);
    if (error?.errors && Array.isArray(error.errors)) {
      detailsStr = error.errors.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(', ');
    }
    res.status(400).json({ success: false, error: 'Failed to import products', details: detailsStr });
  }
};

export const bulkUpdateProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ids, updateData } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: 'No product IDs provided' });
      return;
    }

    if (req.user && req.user.role === 'Cashier') {
      res.status(403).json({ success: false, error: 'Cashier cannot update products' });
      return;
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: updateData
    });

    res.status(200).json({ success: true, message: `${result.count} products updated successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to bulk update products' });
  }
};

export const bulkDeleteProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: 'No product IDs provided' });
      return;
    }

    if (req.user && req.user.role === 'Cashier') {
      res.status(403).json({ success: false, error: 'Cashier cannot delete products' });
      return;
    }

    // Soft delete all — safest approach for bulk ops to preserve history
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() }
    });

    // Audit log
    await prisma.log.create({
      data: {
        userId: req.user?.id,
        action: 'BULK_DELETE_PRODUCT',
        entityType: 'Product',
        details: `Bulk soft-deleted ${result.count} products: [${ids.join(', ')}]`,
        ipAddress: req.ip || null
      }
    });

    res.status(200).json({ success: true, message: `${result.count} products archived successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to bulk delete products' });
  }
};

