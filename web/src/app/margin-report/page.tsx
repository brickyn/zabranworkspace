'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Loader2, Calendar, DollarSign, TrendingUp, Download } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import * as xlsx from 'xlsx';

export default function MarginReportPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branchId, setBranchId] = useState('all');
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);

    apiClient.get('/branches').then(res => {
      if(res.data.success) setBranches(res.data.data);
    }).catch(console.error);
  }, []);

  const fetchReports = async () => {
    if(!startDate || !endDate) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/reports`, {
        params: { branchId, startDate, endDate }
      });
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (error) {
      toast.error('Gagal mengambil data laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, branchId]);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  // Flatten items for margin analysis
  const flatItems = reports.flatMap(tx => {
    return tx.items.map((item: any) => ({
      txId: tx.id,
      date: tx.createdAt,
      productId: item.product.id,
      productName: item.product.name,
      buyPrice: item.product.buyPrice,
      sellPrice: item.sellingPrice,
      discount: item.discount,
      profit: item.sellingPrice - item.product.buyPrice,
      marginPercent: item.product.buyPrice > 0 ? ((item.sellingPrice - item.product.buyPrice) / item.sellingPrice) * 100 : 100
    }));
  });

  const totalOmzet = flatItems.reduce((acc, curr) => acc + curr.sellPrice, 0);
  const totalHPP = flatItems.reduce((acc, curr) => acc + curr.buyPrice, 0);
  const totalProfit = flatItems.reduce((acc, curr) => acc + curr.profit, 0);
  const avgMargin = totalOmzet > 0 ? (totalProfit / totalOmzet) * 100 : 0;

  const exportExcel = () => {
    const dataToExport = flatItems.map(item => ({
      "Tanggal": new Date(item.date).toLocaleDateString('id-ID'),
      "No Nota": item.txId,
      "Kode Barang": item.productId,
      "Nama Barang": item.productName,
      "HPP (Harga Modal)": item.buyPrice,
      "Harga Jual": item.sellPrice,
      "Diskon": item.discount,
      "Net Profit": item.profit,
      "Margin (%)": item.marginPercent.toFixed(2) + '%'
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Laporan Margin");
    xlsx.writeFile(workbook, `Laporan_Margin_${startDate}_${endDate}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header & Filter */}
        <div className="bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Laporan Margin & Profit</h1>
              <p className="text-muted text-sm">Analisis detail keuntungan per item yang terjual.</p>
            </div>
            <button 
              onClick={exportExcel}
              disabled={flatItems.length === 0}
              className="px-5 py-2.5 bg-glass-bg border border-glass-border hover:bg-nav-hover disabled:opacity-50 text-foreground rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
            <select value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              <option value="all">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-glass-bg border border-glass-border p-5 rounded-2xl">
            <p className="text-muted text-sm mb-1">Total Penjualan (Omzet)</p>
            <h3 className="text-2xl font-bold text-white">{formatRupiah(totalOmzet)}</h3>
          </div>
          <div className="bg-glass-bg border border-glass-border p-5 rounded-2xl">
            <p className="text-muted text-sm mb-1">Total HPP</p>
            <h3 className="text-2xl font-bold text-muted">{formatRupiah(totalHPP)}</h3>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl">
            <p className="text-green-400/80 text-sm mb-1">Net Profit</p>
            <h3 className="text-2xl font-bold text-green-400">{formatRupiah(totalProfit)}</h3>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl">
            <p className="text-blue-400/80 text-sm mb-1">Rata-rata Margin</p>
            <h3 className="text-2xl font-bold text-blue-400">{avgMargin.toFixed(1)}%</h3>
          </div>
        </div>

        {/* Detail Table */}
        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">No Nota</th>
                  <th className="px-6 py-4 font-medium">Barang (SN)</th>
                  <th className="px-6 py-4 font-medium text-right">HPP</th>
                  <th className="px-6 py-4 font-medium text-right">Harga Jual</th>
                  <th className="px-6 py-4 font-medium text-right">Net Profit</th>
                  <th className="px-6 py-4 font-medium text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" /> Memuat data...</td></tr>
                ) : flatItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Tidak ada data di rentang waktu ini</td></tr>
                ) : (
                  flatItems.map((item, i) => (
                    <tr key={i} className="hover:bg-nav-hover transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{item.txId}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.productId}</p>
                      </td>
                      <td className="px-6 py-4 text-right">{formatRupiah(item.buyPrice)}</td>
                      <td className="px-6 py-4 text-right text-white">{formatRupiah(item.sellPrice)}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-400">{formatRupiah(item.profit)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${item.marginPercent < 5 ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {item.marginPercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
