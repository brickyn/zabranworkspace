import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// List all promos
export const getPromos = async (req: Request, res: Response) => {
  try {
    const promos = await prisma.promoCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        freeAccessory: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } }
      },
    });
    res.json({ success: true, data: promos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch promos' });
  }
};

// Create promo
export const createPromo = async (req: AuthRequest, res: Response) => {
  try {
    const { name, startDate, endDate, discountRp, discountPct, voucherCode, minPurchase, maxDiscount, maxUsage, freeAccessoryId, branchId } = req.body;
    const promo = await prisma.promoCampaign.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        discountRp: Number(discountRp) || 0,
        discountPct: Number(discountPct) || 0,
        voucherCode: voucherCode || null,
        minPurchase: Number(minPurchase) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        maxUsage: maxUsage ? Number(maxUsage) : null,
        freeAccessoryId: freeAccessoryId || null,
        branchId: branchId || null,
      },
    });
    res.status(201).json({ success: true, data: promo });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, error: 'Kode voucher sudah digunakan' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create promo' });
  }
};

// Update promo
export const updatePromo = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const promo = await prisma.promoCampaign.update({ where: { id }, data: req.body });
    res.json({ success: true, data: promo });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update promo' });
  }
};

// Delete promo
export const deletePromo = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.promoCampaign.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete promo' });
  }
};

// Validate voucher code (used from POS)
export const validateVoucher = async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: 'Kode voucher diperlukan' });
      return;
    }

    const promo = await prisma.promoCampaign.findUnique({ where: { voucherCode: String(code).toUpperCase() } });
    if (!promo) {
      res.status(404).json({ success: false, error: 'Kode voucher tidak ditemukan' });
      return;
    }
    if (!promo.isActive) {
      res.status(400).json({ success: false, error: 'Promo sudah tidak aktif' });
      return;
    }
    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      res.status(400).json({ success: false, error: 'Promo sudah kedaluwarsa atau belum dimulai' });
      return;
    }
    if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
      res.status(400).json({ success: false, error: 'Kuota pemakaian voucher habis' });
      return;
    }
    const sub = Number(subtotal) || 0;
    if (sub < promo.minPurchase) {
      res.status(400).json({ success: false, error: `Minimum pembelian Rp ${promo.minPurchase.toLocaleString('id-ID')}` });
      return;
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountRp > 0) {
      discount = promo.discountRp;
    } else if (promo.discountPct > 0) {
      discount = sub * (promo.discountPct / 100);
      if (promo.maxDiscount && discount > promo.maxDiscount) {
        discount = promo.maxDiscount;
      }
    }

    res.json({
      success: true,
      data: {
        promoId: promo.id,
        promoName: promo.name,
        discount,
        voucherCode: promo.voucherCode,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to validate voucher' });
  }
};
