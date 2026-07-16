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
    
    // Automatically restrict to user's branch if they are not higher management
    if (user && !['Super Admin', 'Management', 'Manager', 'Finance'].includes(user.role)) {
      whereClause.branchId = user.branchId;
    } else if (branchId && branchId !== 'all') {
      whereClause.branchId = branchId as string;
    }
    
    if (status) whereClause.status = status as string;
    if (brand) whereClause.brand = brand as string;
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { id: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
        { model: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Branch Isolation Logic
    if (req.user && ['Cashier', 'Leader'].includes(req.user.role) && req.user.branchId) {
      whereClause.branchId = req.user.branchId;
    }

    const [products, total, categoryCounts] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: { branch: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
      prisma.product.groupBy({
        by: ['category'],
        where: whereClause,
        _count: { id: true }
      })
    ]);
    
    const summary = categoryCounts.reduce((acc, curr) => {
      const cat = curr.category || 'Laptop';
      acc[cat] = (acc[cat] || 0) + curr._count.id;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({ 
      success: true, 
      data: products,
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
    
    // Only Admin or Super Admin can create products (or if you want to allow leaders)
    // You can enforce this via Role Middleware in routes, but here is an extra check:
    if (req.user && req.user.role === 'Cashier') {
      res.status(403).json({ success: false, error: 'Cashier cannot add master products' });
      return;
    }

    const product = await prisma.product.create({
      data: validatedData,
    });
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
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

    // Process and validate all products
    const validProducts = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      try {
        const validated = createProductSchema.parse(products[i]);
        validProducts.push(validated);
      } catch (err) {
        errors.push({ row: i + 1, error: err });
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, error: 'Validation failed for some rows', details: errors });
      return;
    }

    // Check for duplicate IDs in the incoming array itself
    const idsInArray = validProducts.map(p => p.id);
    const uniqueIds = new Set(idsInArray);
    if (uniqueIds.size !== idsInArray.length) {
      const duplicatesInArray = idsInArray.filter((item, index) => idsInArray.indexOf(item) !== index);
      res.status(400).json({ 
        success: false, 
        error: 'Terdapat ID Produk ganda di dalam file yang diunggah.', 
        details: Array.from(new Set(duplicatesInArray)) 
      });
      return;
    }

    // Check for duplicate IDs in the database
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: idsInArray } },
      select: { id: true }
    });

    if (existingProducts.length > 0) {
      res.status(400).json({
        success: false,
        error: 'ID Produk berikut sudah terdaftar di database (Duplicate ID).',
        details: existingProducts.map(p => p.id)
      });
      return;
    }

    // Insert all products since there are no duplicates
    const results = await prisma.product.createMany({
      data: validProducts,
      skipDuplicates: false, // We already checked for duplicates
    });

    res.status(200).json({ success: true, message: `${results.count} products imported successfully` });
  } catch (error) {
    console.error("Bulk Import Error:", error);
    res.status(500).json({ success: false, error: 'Failed to import products', details: (error as Error).message || error });
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

