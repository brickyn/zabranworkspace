'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Download, Loader2, Calendar, FileSpreadsheet, Building2, BarChart3, Receipt, TrendingDown } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function LaporanPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
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

  const handleExport = async (type: 'full' | 'sales' | 'expense') => {
    setExporting(true);
    const labelMap = {
      full: 'Laporan Lengkap (Multi-Sheet)',
      sales: 'Laporan Penjualan',
      expense: 'Laporan Beban',
    };
    try {
      const res = await apiClient.get('/reports/export', {
        params: { branchId, startDate, endDate, type },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = type === 'expense'
        ? `Laporan_Beban_${startDate}_sd_${endDate}.xlsx`
        : `Laporan_Keuangan_${startDate}_sd_${endDate}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Berhasil mengekspor ${labelMap[type]}!`);
    } catch (error) {
      toast.error('Gagal mengekspor laporan');
    } finally {
      setExporting(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const totalAmount = reports.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalItems = reports.reduce((acc, curr) => acc + (curr.items?.length || 0), 0);

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header & Filter */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Laporan Keuangan</h1>
              <p className="text-muted text-sm">Export laporan penjualan lengkap, divisi, dan beban operasional ke format Excel.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted font-medium flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Tanggal Mulai</label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted font-medium flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Tanggal Akhir</label>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted font-medium flex items-center gap-2"><Building2 className="w-3.5 h-3.5"/> Cabang / Divisi</label>
              <select 
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none appearance-none"
              >
                <option value="all">Semua Cabang (Pusat)</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Export Buttons */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleExport('full')}
            disabled={exporting}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/40 hover:border-blue-400/60 text-white rounded-2xl transition-all disabled:opacity-50 group"
          >
            <div className="p-2.5 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
              {exporting ? <Loader2 className="w-5 h-5 animate-spin"/> : <BarChart3 className="w-5 h-5 text-blue-400"/>}
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Laporan Lengkap</p>
              <p className="text-xs text-muted">Penjualan + B2B + BSB + P&L</p>
            </div>
          </button>

          <button
            onClick={() => handleExport('sales')}
            disabled={exporting}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-600/30 to-emerald-600/30 border border-green-500/40 hover:border-green-400/60 text-white rounded-2xl transition-all disabled:opacity-50 group"
          >
            <div className="p-2.5 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
              {exporting ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileSpreadsheet className="w-5 h-5 text-green-400"/>}
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Laporan Penjualan</p>
              <p className="text-xs text-muted">Toko, B2B & BSB saja</p>
            </div>
          </button>

          <button
            onClick={() => handleExport('expense')}
            disabled={exporting}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-red-600/30 to-orange-600/30 border border-red-500/40 hover:border-red-400/60 text-white rounded-2xl transition-all disabled:opacity-50 group"
          >
            <div className="p-2.5 bg-red-500/20 rounded-xl group-hover:scale-110 transition-transform">
              {exporting ? <Loader2 className="w-5 h-5 animate-spin"/> : <TrendingDown className="w-5 h-5 text-red-400"/>}
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Laporan Beban</p>
              <p className="text-xs text-muted">Seluruh pengeluaran operasional</p>
            </div>
          </button>
        </motion.div>

        {/* Mini Dashboard */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.15}} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-5 rounded-2xl">
            <p className="text-muted text-sm font-medium mb-1">Total Penjualan Toko</p>
            <h3 className="text-2xl font-bold text-white">{formatRupiah(totalAmount)}</h3>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 p-5 rounded-2xl">
            <p className="text-muted text-sm font-medium mb-1">Total Transaksi</p>
            <h3 className="text-2xl font-bold text-white">{reports.length} Transaksi</h3>
          </div>
          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 p-5 rounded-2xl">
            <p className="text-muted text-sm font-medium mb-1">Item Terjual</p>
            <h3 className="text-2xl font-bold text-white">{totalItems} Unit</h3>
          </div>
        </motion.div>

        {/* Preview Table */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-glass-border bg-black/20 flex justify-between items-center">
            <h3 className="text-white font-medium text-sm flex items-center gap-2"><Receipt className="w-4 h-4 text-blue-400"/>Preview Transaksi Toko ({reports.length})</h3>
            <span className="text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
              Gunakan tombol Export di atas untuk data lengkap (termasuk B2B & BSB)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Kode Transaksi</th>
                  <th className="px-6 py-4 font-medium">Pelanggan</th>
                  <th className="px-6 py-4 font-medium">Kasir</th>
                  <th className="px-6 py-4 font-medium">Item</th>
                  <th className="px-6 py-4 font-medium text-right">Total Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                      Memuat laporan...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">Tidak ada transaksi di rentang tanggal ini.</p>
                      <p className="text-sm mt-1">Coba ubah filter tanggal atau cabang.</p>
                    </td>
                  </tr>
                ) : (
                  reports.map((tx) => (
                    <tr key={tx.id} className="hover:bg-nav-hover transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 font-mono text-muted text-xs">{tx.id}</td>
                      <td className="px-6 py-4 text-white font-medium">{tx.customer?.name || 'Umum'}</td>
                      <td className="px-6 py-4">{tx.cashier?.name || '-'}</td>
                      <td className="px-6 py-4">{tx.items?.length || 0} unit</td>
                      <td className="px-6 py-4 text-right font-bold text-green-400">
                        {formatRupiah(tx.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
