import { Request, Response } from 'express';
import prisma from '../prisma';

export const processInbound = async (req: Request, res: Response) => {
  try {
    const { supplierId, branchId, receivedById, items } = req.body;

    // Validate Input
    if (!supplierId || !branchId || !receivedById || !items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    // Find Supplier
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Generate Date String YYYYMMDD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`; // e.g., '20260719'

    // Perform inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Inbound Batch
      const batch = await tx.inboundBatch.create({
        data: {
          inboundDate: today,
          supplierId,
          receivedById,
          branchId
        }
      });

      // 2. Query the latest SN sequence for this supplier and date to avoid duplicates
      // Format: SUP01-20260719-001
      const prefix = `${supplier.code}-${dateStr}-`;
      const latestItem = await tx.productItem.findFirst({
        where: { sn: { startsWith: prefix } },
        orderBy: { sn: 'desc' }
      });

      let currentSequence = 0;
      if (latestItem) {
        const parts = latestItem.sn.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          currentSequence = lastSeq;
        }
      }

      // 3. Generate SNs and prepare data
      const productItemsData = [];
      const generatedSNs = [];

      for (const item of items) {
        for (let i = 0; i < item.qty; i++) {
          currentSequence++;
          const seqStr = String(currentSequence).padStart(3, '0');
          const sn = `${prefix}${seqStr}`;
          
          productItemsData.push({
            sn,
            status: 'AVAILABLE',
            productId: item.productId,
            inboundBatchId: batch.id,
            branchId
          });
          generatedSNs.push(sn);
        }
      }

      // 4. Bulk Insert Product Items
      if (productItemsData.length > 0) {
        await tx.productItem.createMany({
          data: productItemsData
        });
      }

      return {
        batchId: batch.id,
        generatedSNs
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Inbound processed successfully',
      data: result
    });

  } catch (error: any) {
    console.error('Error processing inbound:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
