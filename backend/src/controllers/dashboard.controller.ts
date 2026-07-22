import { Request, Response } from 'express';
import prisma from '../prisma';

export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year, branchId, includeSewa } = req.query;
    
    // Build where clause for date filtering
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      };
    }

    // Base transaction where clause
    const txWhere: any = {
      status: 'completed',
      ...dateFilter,
    };

    if (branchId && branchId !== 'all') {
      txWhere.branchId = String(branchId);
    }

    // Fetch transactions with items and products
    const transactions = await prisma.transaction.findMany({
      where: txWhere,
      include: {
        items: {
          include: {
            productItem: { include: { product: true } }
          }
        }
      }
    });

    // Initialize metrics
    const metrics = {
      totalOmzet: 0,
      totalHpp: 0,
      totalProfit: 0,
      margin: 0,
      totalTransaksi: 0,
      laptop: { unit: 0, transaksi: 0, omzet: 0, aov: 0 },
      service: { unit: 0, transaksi: 0, omzet: 0, aov: 0 },
      aksesoris: { unit: 0, transaksi: 0, omzet: 0, aov: 0 },
      sewa: { unit: 0, transaksi: 0, omzet: 0, aov: 0 },
      b2b: { omzet: 0 },
      bsb: { omzet: 0 },
      crm: { repeatOrder: 0 },
    };

    // Calculate metrics
    const isIncludeSewa = includeSewa === 'true';

    transactions.forEach((tx: any) => {
      let txHasLaptop = false;
      let txHasService = false;
      let txHasAksesoris = false;
      let txHasSewa = false;
      
      let txSewaOmzet = 0;
      let txHpp = 0;

      tx.items.forEach((item: any) => {
        const cat = (item.product?.category || 'Laptop').toLowerCase();
        const buyPrice = item.product?.buyPrice || 0;
        txHpp += buyPrice;
        
        // Accumulate based on category
        if (cat === 'laptop' || cat === 'unit') {
          metrics.laptop.unit += 1;
          metrics.laptop.omzet += item.subtotal;
          txHasLaptop = true;
        } else if (cat === 'service') {
          metrics.service.unit += 1;
          metrics.service.omzet += item.subtotal;
          txHasService = true;
        } else if (cat === 'aksesoris' || cat === 'accessories') {
          metrics.aksesoris.unit += 1;
          metrics.aksesoris.omzet += item.subtotal;
          txHasAksesoris = true;
        } else if (cat === 'sewa' || cat === 'rental') {
          metrics.sewa.unit += 1;
          metrics.sewa.omzet += item.subtotal;
          txSewaOmzet += item.subtotal;
          txHasSewa = true;
        }
      });

      // Count transactions per category
      if (txHasLaptop) metrics.laptop.transaksi += 1;
      if (txHasService) metrics.service.transaksi += 1;
      if (txHasAksesoris) metrics.aksesoris.transaksi += 1;
      if (txHasSewa) metrics.sewa.transaksi += 1;

      // Add to global totals
      let txTotalToAdd = tx.totalAmount;
      if (!isIncludeSewa && txHasSewa) {
         txTotalToAdd -= txSewaOmzet;
      }
      
      if (txTotalToAdd > 0) {
        metrics.totalOmzet += txTotalToAdd;
        metrics.totalHpp += txHpp;
        metrics.totalTransaksi += 1;
      }
    });

    metrics.totalProfit = metrics.totalOmzet - metrics.totalHpp;
    metrics.margin = metrics.totalOmzet > 0 ? (metrics.totalProfit / metrics.totalOmzet) * 100 : 0;

    // Fetch B2B & BSB
    const b2bWhere: any = {};
    const bsbWhere: any = {};
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      b2bWhere.date = { gte: startDate, lte: endDate };
      bsbWhere.date = { gte: startDate, lte: endDate };
    }

    const b2bTxs = await prisma.b2BTransaction.findMany({ where: b2bWhere });
    const bsbTxs = await prisma.bSBTransaction.findMany({ where: bsbWhere });
    
    metrics.b2b.omzet = b2bTxs.reduce((sum, t) => sum + t.amount, 0);
    metrics.bsb.omzet = bsbTxs.reduce((sum, t) => sum + t.amount, 0);

    // Calculate AOV
    if (metrics.laptop.transaksi > 0) metrics.laptop.aov = metrics.laptop.omzet / metrics.laptop.transaksi;
    if (metrics.service.transaksi > 0) metrics.service.aov = metrics.service.omzet / metrics.service.transaksi;
    if (metrics.aksesoris.transaksi > 0) metrics.aksesoris.aov = metrics.aksesoris.omzet / metrics.aksesoris.transaksi;
    if (metrics.sewa.transaksi > 0) metrics.sewa.aov = metrics.sewa.omzet / metrics.sewa.transaksi;

    // Fetch CRM Repeat Order
    const crmBranchFilter = (branchId && branchId !== 'all') ? { branchId: String(branchId) } : {};
    const allCrmData = await prisma.cRMCustomerData.findMany({ where: crmBranchFilter });
    
    const phoneCountMap: Record<string, { total: number, inPeriod: number }> = {};
    allCrmData.forEach(c => {
      const isPhoneValid = c.phone && c.phone.length > 5 && c.phone !== '-';
      if (!isPhoneValid) return;
      
      if (!phoneCountMap[c.phone]) {
        phoneCountMap[c.phone] = { total: 0, inPeriod: 0 };
      }
      phoneCountMap[c.phone].total += 1;
      
      let insidePeriod = false;
      if (month && year) {
         const pd = new Date(c.purchaseDate);
         const start = new Date(Number(year), Number(month) - 1, 1);
         const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
         if (pd >= start && pd <= end) insidePeriod = true;
      } else {
         insidePeriod = true;
      }
      if (insidePeriod) phoneCountMap[c.phone].inPeriod += 1;
    });

    let repeatOrders = 0;
    Object.values(phoneCountMap).forEach(val => {
      if (val.inPeriod > 0 && val.total > 1) {
        repeatOrders += 1;
      }
    });
    metrics.crm.repeatOrder = repeatOrders;

    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
};

export const getCashierDashboard = async (req: any, res: Response): Promise<void> => {
  try {
    const cashierId = req.user?.id;
    if (!cashierId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        cashierId,
        status: 'completed',
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        id: true,
        totalAmount: true,
        createdAt: true
      }
    });

    let todaySales = 0;
    let todayTransactions = 0;
    const history: any[] = [];
    
    // Initialize 7 days history
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      history.push({
        date: d.toISOString().split('T')[0],
        omzet: 0,
        transactions: 0
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    transactions.forEach(tx => {
      const txDateStr = tx.createdAt.toISOString().split('T')[0];
      if (txDateStr === todayStr) {
        todaySales += tx.totalAmount;
        todayTransactions++;
      }
      const historyItem = history.find(h => h.date === txDateStr);
      if (historyItem) {
        historyItem.omzet += tx.totalAmount;
        historyItem.transactions++;
      }
    });

    res.json({
      success: true,
      data: {
        todaySales,
        todayTransactions,
        history
      }
    });
  } catch (error) {
    console.error('[CASHIER DASHBOARD ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cashier dashboard' });
  }
};
