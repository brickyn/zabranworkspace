import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as xlsx from 'xlsx';

export const getLaporan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const whereClause: any = {};
    if (branchId && branchId !== 'all') {
      whereClause.branchId = branchId as string;
    }
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        cashier: true,
        customer: true,
        items: {
          include: {
            productItem: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
};

export const exportLaporan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, startDate, endDate, type } = req.query;
    const exportType = (type as string) || 'full'; // 'full' | 'sales' | 'expense'

    const dateFilter: any = {};
    const whereBranch: any = {};
    if (branchId && branchId !== 'all') {
      whereBranch.branchId = branchId as string;
    }
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate as string);
      dateFilter.lte = new Date(endDate as string);
    }

    const workbook = xlsx.utils.book_new();

    // ─── SHEET 1: Penjualan Toko (Laptop, Service, Aksesoris, Sewa) ───
    if (exportType === 'full' || exportType === 'sales') {
      const txWhereClause: any = { ...whereBranch };
      if (startDate && endDate) {
        txWhereClause.createdAt = dateFilter;
      }

      const transactions = await prisma.transaction.findMany({
        where: txWhereClause,
        include: {
          cashier: true,
          customer: true,
          branch: true,
          items: { include: { productItem: { include: { product: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const salesData: any[] = [];
      let sumHargaBeli = 0, sumHargaJual = 0, sumTotal = 0, sumDiskon = 0;

      (transactions as any[]).forEach(tx => {
        (tx.items || []).forEach((item: any) => {
          const product = item.productItem?.product || item.product || {};
          const buyPrice = product.buyPrice || 0;
          sumHargaBeli += buyPrice;
          sumHargaJual += item.sellingPrice || 0;
          sumTotal += item.subtotal || 0;
          sumDiskon += item.discount || 0;

          salesData.push({
            'Tanggal': new Date(tx.createdAt).toLocaleDateString('id-ID'),
            'Kode Transaksi': tx.id,
            'Cabang': tx.branch?.name || '-',
            'Kategori': product.category || 'Laptop',
            'Kode Barang': product.id || '-',
            'Nama Barang': product.name || 'Produk',
            'Harga Beli': buyPrice,
            'Harga Jual': item.sellingPrice || 0,
            'Diskon': item.discount || 0,
            'Total': item.subtotal || 0,
            'Metode Bayar': tx.paymentMethod,
            'Kasir': tx.cashier?.name || '-',
            'Pelanggan': tx.customer?.name || 'Umum',
          });
        });
      });

      salesData.push({
        'Tanggal': '══ TOTAL ══',
        'Kode Transaksi': '', 'Cabang': '', 'Kategori': '', 'Kode Barang': '', 'Nama Barang': '',
        'Harga Beli': sumHargaBeli, 'Harga Jual': sumHargaJual, 'Diskon': sumDiskon, 'Total': sumTotal,
        'Metode Bayar': '', 'Kasir': '', 'Pelanggan': ''
      });

      const ws1 = xlsx.utils.json_to_sheet(salesData);
      xlsx.utils.book_append_sheet(workbook, ws1, 'Penjualan Toko');
    }

    // ─── SHEET 2: Divisi B2B ───
    if (exportType === 'full' || exportType === 'sales') {
      const b2bWhere: any = {};
      if (startDate && endDate) b2bWhere.date = dateFilter;

      const b2bTxs = await prisma.b2BTransaction.findMany({
        where: b2bWhere,
        include: { partner: true },
        orderBy: { date: 'desc' }
      });

      const b2bData: any[] = b2bTxs.map(tx => ({
        'Tanggal': new Date(tx.date).toLocaleDateString('id-ID'),
        'Client / Perusahaan': (tx as any).partner?.name || '-',
        'Jenis': tx.type || '-',
        'Item': tx.itemName || '-',
        'Jumlah': tx.qty,
        'Nominal': tx.amount,
        'PIC': tx.picName || '-',
      }));

      if (b2bData.length > 0) {
        const totalB2B = b2bTxs.reduce((acc, tx) => acc + tx.amount, 0);
        b2bData.push({ 'Tanggal': '══ TOTAL ══', 'Client / Perusahaan': '', 'Jenis': '', 'Item': '', 'Jumlah': '', 'Nominal': totalB2B, 'PIC': '' });
      }

      const ws2 = xlsx.utils.json_to_sheet(b2bData.length ? b2bData : [{ 'Info': 'Tidak ada data B2B di periode ini' }]);
      xlsx.utils.book_append_sheet(workbook, ws2, 'Divisi B2B');
    }

    // ─── SHEET 3: Divisi BSB ───
    if (exportType === 'full' || exportType === 'sales') {
      const bsbWhere: any = {};
      if (startDate && endDate) bsbWhere.date = dateFilter;

      const bsbTxs = await prisma.bSBTransaction.findMany({
        where: bsbWhere,
        orderBy: { date: 'desc' }
      });

      const bsbData: any[] = bsbTxs.map(tx => ({
        'Tanggal': new Date(tx.date).toLocaleDateString('id-ID'),
        'Jenis': tx.type,
        'Platform': tx.platform,
        'Jumlah': tx.qty,
        'Nominal': tx.amount,
        'Status Pengiriman': tx.shippingStatus,
        'PIC': tx.picName || '-',
      }));

      if (bsbData.length > 0) {
        const totalBSB = bsbTxs.reduce((acc, tx) => acc + tx.amount, 0);
        bsbData.push({ 'Tanggal': '══ TOTAL ══', 'Jenis': '', 'Platform': '', 'Jumlah': '', 'Nominal': totalBSB, 'Status Pengiriman': '', 'PIC': '' });
      }

      const ws3 = xlsx.utils.json_to_sheet(bsbData.length ? bsbData : [{ 'Info': 'Tidak ada data BSB di periode ini' }]);
      xlsx.utils.book_append_sheet(workbook, ws3, 'Divisi BSB');
    }

    // ─── SHEET 4: Beban (Expenses) ───
    if (exportType === 'full' || exportType === 'expense') {
      const expWhere: any = { ...whereBranch };
      if (startDate && endDate) expWhere.date = dateFilter;

      const expenses = await prisma.expense.findMany({
        where: expWhere,
        include: { branch: true },
        orderBy: { date: 'desc' }
      });

      const expenseData: any[] = expenses.map(exp => ({
        'Tanggal': new Date(exp.date).toLocaleDateString('id-ID'),
        'Divisi / Cabang': (exp as any).branch?.name || '-',
        'Kategori': exp.category,
        'Keterangan': exp.description || '-',
        'Nominal': exp.amount,
      }));

      if (expenseData.length > 0) {
        const totalExp = expenses.reduce((acc, exp) => acc + exp.amount, 0);
        expenseData.push({ 'Tanggal': '══ TOTAL ══', 'Divisi / Cabang': '', 'Kategori': '', 'Keterangan': '', 'Nominal': totalExp });
      }

      const ws4 = xlsx.utils.json_to_sheet(expenseData.length ? expenseData : [{ 'Info': 'Tidak ada data beban di periode ini' }]);
      xlsx.utils.book_append_sheet(workbook, ws4, 'Beban Operasional');
    }

    // ─── SHEET 5: Ringkasan P&L ───
    if (exportType === 'full') {
      const txWhereClause: any = { ...whereBranch, status: 'completed' };
      if (startDate && endDate) txWhereClause.createdAt = dateFilter;

      const [allTx, allRentals, allB2B, allBSB, allExp] = await Promise.all([
        prisma.transaction.findMany({ where: txWhereClause, include: { items: { include: { productItem: { include: { product: true } } } } } }),
        prisma.rental.findMany({ where: { ...whereBranch, ...(startDate && endDate ? { createdAt: dateFilter } : {}) } }),
        prisma.b2BTransaction.findMany({ where: { ...(startDate && endDate ? { date: dateFilter } : {}) } }),
        prisma.bSBTransaction.findMany({ where: { ...(startDate && endDate ? { date: dateFilter } : {}) } }),
        prisma.expense.findMany({ where: { ...whereBranch, ...(startDate && endDate ? { date: dateFilter } : {}) } })
      ]);

      let incLaptop = 0, incService = 0, incAksesoris = 0, cogs = 0;
      (allTx as any[]).forEach(tx => {
        (tx.items || []).forEach((item: any) => {
          const product = item.productItem?.product || item.product || {};
          const cat = (product.category || '').toLowerCase();
          if (cat.includes('service')) incService += item.subtotal || 0;
          else if (cat.includes('aksesoris') || cat.includes('accessories')) incAksesoris += item.subtotal || 0;
          else incLaptop += item.subtotal || 0;
          cogs += product.buyPrice || 0;
        });
      });

      const incSewa = allRentals.reduce((acc, r) => acc + r.totalFee, 0);
      const incB2B = allB2B.reduce((acc, b) => acc + b.amount, 0);
      const incBSB = allBSB.reduce((acc, b) => acc + b.amount, 0);
      const totalIncome = incLaptop + incService + incAksesoris + incSewa + incB2B + incBSB;
      const grossProfit = totalIncome - cogs;
      const totalExpense = allExp.reduce((acc, e) => acc + e.amount, 0);
      const netProfit = grossProfit - totalExpense;

      const summaryData = [
        { 'Keterangan': '═══ PENDAPATAN ═══', 'Nominal': '' },
        { 'Keterangan': 'Penjualan Laptop', 'Nominal': incLaptop },
        { 'Keterangan': 'Penjualan Service', 'Nominal': incService },
        { 'Keterangan': 'Penjualan Aksesoris', 'Nominal': incAksesoris },
        { 'Keterangan': 'Pendapatan Sewa', 'Nominal': incSewa },
        { 'Keterangan': 'Divisi B2B', 'Nominal': incB2B },
        { 'Keterangan': 'Divisi BSB', 'Nominal': incBSB },
        { 'Keterangan': 'TOTAL PENDAPATAN', 'Nominal': totalIncome },
        { 'Keterangan': '', 'Nominal': '' },
        { 'Keterangan': '═══ HARGA POKOK ═══', 'Nominal': '' },
        { 'Keterangan': 'COGS (Harga Beli)', 'Nominal': cogs },
        { 'Keterangan': 'LABA KOTOR', 'Nominal': grossProfit },
        { 'Keterangan': '', 'Nominal': '' },
        { 'Keterangan': '═══ BEBAN OPERASIONAL ═══', 'Nominal': '' },
        { 'Keterangan': 'Total Beban', 'Nominal': totalExpense },
        { 'Keterangan': '', 'Nominal': '' },
        { 'Keterangan': '══ LABA BERSIH ══', 'Nominal': netProfit },
      ];

      const ws5 = xlsx.utils.json_to_sheet(summaryData);
      xlsx.utils.book_append_sheet(workbook, ws5, 'Ringkasan P&L');
    }

    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const fileName = exportType === 'expense'
      ? `Laporan_Beban_${startDate}_sd_${endDate}.xlsx`
      : `Laporan_Keuangan_Lengkap_${startDate}_sd_${endDate}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(excelBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to export reports' });
  }
};
