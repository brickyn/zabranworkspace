import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as xlsx from 'xlsx';

// 1. Get SO List per branch (or all)
export const getOpnames = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.query;
    const where: any = {};
    if (branchId && branchId !== 'all') {
      where.branchId = String(branchId);
    }
    
    // For non-superadmins, force their own branch
    if (req.user?.role !== 'Super Admin' && req.user?.role !== 'Management' && req.user?.role !== 'Finance') {
      if (req.user?.branchId) {
        where.branchId = req.user.branchId;
      }
    }

    const opnames = await prisma.stockOpname.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { name: true } },
        _count: { select: { items: true } }
      }
    });

    res.json({ success: true, data: opnames });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal mengambil data SO' });
  }
};

// 2. Get Single SO Detail
export const getOpnameDetail = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const opname = await prisma.stockOpname.findUnique({
      where: { id },
      include: {
        branch: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, category: true, status: true } }
          }
        }
      }
    });
    if (!opname) {
      res.status(404).json({ success: false, error: 'SO tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: opname });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal mengambil detail SO' });
  }
};

// 3. Init SO
export const initOpname = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId, notes } = req.body;
    if (!branchId) {
      res.status(400).json({ success: false, error: 'branchId diperlukan' });
      return;
    }

    // Check if there is an active SO for this branch
    const activeSO = await prisma.stockOpname.findFirst({
      where: { branchId, status: { in: ['In Progress', 'Review'] } }
    });
    if (activeSO) {
      res.status(400).json({ success: false, error: 'Ada proses SO yang belum selesai untuk cabang ini' });
      return;
    }

    const opname = await prisma.stockOpname.create({
      data: {
        branchId,
        notes,
        status: 'In Progress',
        startTime: new Date()
      }
    });

    res.status(201).json({ success: true, data: opname });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal memulai SO' });
  }
};

// 4. Download Template
export const downloadTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.params;
    
    // In Blind Count, we just give an empty Excel with "Serial Number" column
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([
      ['Serial Number (Scan Barcode di Sini)']
    ]);
    
    // Set column width
    ws['!cols'] = [{ wch: 40 }];
    
    xlsx.utils.book_append_sheet(wb, ws, 'SO_Template');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', `attachment; filename="SO_Template_${branchId}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal mengunduh template' });
  }
};

// 5. Upload & Process Excel
export const uploadOpname = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const opname = await prisma.stockOpname.findUnique({ where: { id } });
    
    if (!opname) {
      res.status(404).json({ success: false, error: 'SO tidak ditemukan' });
      return;
    }
    if (opname.status !== 'In Progress') {
      res.status(400).json({ success: false, error: 'SO sudah diproses / diverifikasi' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'File Excel tidak ditemukan' });
      return;
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    
    // Extact scanned SNs (assuming column A)
    const scannedSNs = new Set<string>();
    for (let i = 1; i < data.length; i++) {
      const sn = String(data[i][0] || '').trim();
      if (sn) scannedSNs.add(sn);
    }

    // Get all expected products for this branch (Available or Booked)
    const expectedProducts = await prisma.product.findMany({
      where: { 
        branchId: opname.branchId,
        status: { in: ['Available', 'Booked'] }
      }
    });

    const expectedMap = new Map(expectedProducts.map(p => [p.id, p]));

    const opnameItems: any[] = [];

    // 1. Check MATCH and MISSING
    for (const product of expectedProducts) {
      if (scannedSNs.has(product.id)) {
        opnameItems.push({
          productId: product.id,
          serialNumber: product.id,
          expectedQty: 1,
          actualQty: 1,
          diffStatus: 'MATCH'
        });
        scannedSNs.delete(product.id);
      } else {
        opnameItems.push({
          productId: product.id,
          serialNumber: product.id,
          expectedQty: 1,
          actualQty: 0,
          diffStatus: 'MISSING'
        });
      }
    }

    // 2. Check UNEXPECTED (scanned but not in expected products)
    for (const sn of scannedSNs) {
      // Check if it exists in DB at all (maybe another branch)
      const existingProduct = await prisma.product.findUnique({ where: { id: sn } });
      opnameItems.push({
        productId: existingProduct ? existingProduct.id : null,
        serialNumber: sn,
        expectedQty: 0,
        actualQty: 1,
        diffStatus: 'UNEXPECTED'
      });
    }

    // Run transaction: Create items and update SO status
    await prisma.$transaction(async (tx) => {
      // delete old items if they uploaded again
      await tx.stockOpnameItem.deleteMany({ where: { opnameId: id } });
      
      if (opnameItems.length > 0) {
        await tx.stockOpnameItem.createMany({
          data: opnameItems.map(item => ({
            opnameId: id,
            ...item
          }))
        });
      }

      await tx.stockOpname.update({
        where: { id },
        data: {
          status: 'Review',
          uploadTime: new Date()
        }
      });
    });

    res.json({ success: true, message: 'File SO berhasil diproses' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Gagal memproses file SO' });
  }
};

// 6. Update Notes for Items
export const updateItemNotes = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const itemId = String(req.params.itemId);
    const { notes } = req.body;
    
    await prisma.stockOpnameItem.update({
      where: { id: itemId, opnameId: id },
      data: { notes }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal menyimpan catatan' });
  }
};

// 7. Verify SO
export const verifyOpname = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    
    await prisma.stockOpname.update({
      where: { id },
      data: {
        status: 'Verified',
        verifiedAt: new Date()
      }
    });

    res.json({ success: true, message: 'SO berhasil diverifikasi' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal memverifikasi SO' });
  }
};

// 8. Cancel SO
export const cancelOpname = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, error: 'Alasan pembatalan harus diisi' });
      return;
    }

    const opname = await prisma.stockOpname.findUnique({ where: { id } });
    if (!opname) {
      res.status(404).json({ success: false, error: 'SO tidak ditemukan' });
      return;
    }
    
    if (opname.status === 'Verified') {
      res.status(400).json({ success: false, error: 'SO yang sudah diverifikasi tidak dapat dibatalkan' });
      return;
    }

    const updatedNotes = opname.notes 
      ? `${opname.notes}\n\nDIBATALKAN: ${reason}` 
      : `DIBATALKAN: ${reason}`;

    await prisma.stockOpname.update({
      where: { id },
      data: {
        status: 'Cancelled',
        notes: updatedNotes
      }
    });

    res.json({ success: true, message: 'SO berhasil dibatalkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Gagal membatalkan SO' });
  }
};
