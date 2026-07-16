'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Loader2, DollarSign, TrendingUp, TrendingDown, Wallet, Activity, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function FinancePage() {
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterBranch, setFilterBranch] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resFinance, resBranches] = await Promise.all([
        apiClient.get('/finance', { params: { month: filterMonth, year: filterYear, branchId: filterBranch } }),
        apiClient.get('/branches')
      ]);
      if (resFinance.data.success) setData(resFinance.data.data);
      if (resBranches.data.success) setBranches(resBranches.data.data);
    } catch (error) {
      toast.error('Gagal memuat laporan keuangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear, filterBranch]);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header & Filter */}
        <div className="bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Finance & Akunting</h1>
            <p className="text-muted text-sm">Laporan Laba Rugi (P&L) dan Arus Kas Bulanan.</p>
          </div>
          
          <div className="flex gap-3">
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>Bulan {i+1}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              <option value="all">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {loading || !data ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pb-6">
            
            {/* Laba Rugi (P&L) Summary */}
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" /> Ringkasan Laba Rugi (Profit & Loss)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-glass-bg border border-glass-border p-5 rounded-2xl relative overflow-hidden">
                <p className="text-muted text-sm mb-1">Total Pendapatan</p>
                <h3 className="text-2xl font-bold text-blue-400">{formatRupiah(data.revenue.total)}</h3>
                <TrendingUp className="w-16 h-16 text-blue-500/10 absolute -right-2 -bottom-2" />
              </div>
              <div className="bg-glass-bg border border-glass-border p-5 rounded-2xl">
                <p className="text-muted text-sm mb-1">HPP (Modal Barang)</p>
                <h3 className="text-2xl font-bold text-muted">{formatRupiah(data.cogs)}</h3>
              </div>
              <div className="bg-glass-bg border border-glass-border p-5 rounded-2xl">
                <p className="text-muted text-sm mb-1">Laba Kotor (Gross Profit)</p>
                <h3 className="text-2xl font-bold text-green-400">{formatRupiah(data.grossProfit)}</h3>
              </div>
              <div className="bg-glass-bg border border-glass-border p-5 rounded-2xl relative group">
                <p className="text-muted text-sm mb-1">Total Biaya Operasional</p>
                <h3 className="text-2xl font-bold text-red-400">{formatRupiah(data.expenses)}</h3>
                
                {/* Breakdown Tooltip/Dropdown on Hover */}
                <div className="hidden group-hover:block absolute top-full left-0 w-full mt-2 bg-glass-bg border border-glass-border rounded-xl p-3 z-20 shadow-xl shadow-black/50">
                  <p className="text-xs text-gray-500 font-medium mb-2 border-b border-glass-border pb-1">Kategorisasi Pengeluaran</p>
                  {Object.entries(data.expensesByCategory || {}).length === 0 ? (
                    <p className="text-xs text-muted">Belum ada pengeluaran</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(data.expensesByCategory).map(([cat, amount]: any) => (
                        <div key={cat} className="flex justify-between items-center text-xs">
                          <span className="text-muted">{cat}</span>
                          <span className="text-red-400 font-medium">{formatRupiah(amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Net Profit Banner */}
            <div className={`p-8 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${data.netProfit >= 0 ? 'bg-green-900/20 border-green-500/20' : 'bg-red-900/20 border-red-500/20'}`}>
              <div className="relative z-10">
                <h2 className="text-muted font-medium mb-1 flex items-center gap-2">
                  <DollarSign className={`w-5 h-5 ${data.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}/> Laba Bersih (Net Profit)
                </h2>
                <div className="text-4xl font-bold text-white">
                  {formatRupiah(data.netProfit)}
                </div>
                <p className={`text-sm mt-2 ${data.netProfit >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
                  {data.netProfit >= 0 ? 'Profitabilitas positif.' : 'Perusahaan mengalami kerugian bulan ini.'}
                </p>
              </div>
              
              <div className="relative z-10 grid grid-cols-3 gap-6 bg-black/20 p-4 rounded-2xl border border-glass-border w-full md:w-auto">
                <div className="text-center">
                  <p className="text-xs text-muted mb-1">Dari Barang</p>
                  <p className="font-bold text-white text-sm">{formatRupiah(data.revenue.product)}</p>
                </div>
                <div className="text-center border-l border-glass-border pl-6">
                  <p className="text-xs text-muted mb-1">Dari Service</p>
                  <p className="font-bold text-yellow-400 text-sm">{formatRupiah(data.revenue.service)}</p>
                </div>
                <div className="text-center border-l border-glass-border pl-6">
                  <p className="text-xs text-muted mb-1">Dari Sewa</p>
                  <p className="font-bold text-purple-400 text-sm">{formatRupiah(data.revenue.rental)}</p>
                </div>
              </div>

              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 ${data.netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}></div>
            </div>

            {/* Cash Flow */}
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-8"><Wallet className="w-5 h-5 text-blue-400" /> Arus Kas (Cash Flow)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-glass-bg border border-glass-border p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-muted mb-1">Kas Masuk (Cash In)</h3>
                  <p className="text-3xl font-bold text-white">{formatRupiah(data.cashFlow.in)}</p>
                </div>
                <p className="text-xs text-gray-500 mt-4">Total semua pendapatan yang dibayar pelanggan.</p>
              </div>

              <div className="bg-glass-bg border border-glass-border p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-muted mb-1">Kas Keluar (Cash Out)</h3>
                  <p className="text-3xl font-bold text-white">{formatRupiah(data.cashFlow.out)}</p>
                </div>
                <p className="text-xs text-gray-500 mt-4">Termasuk belanja barang (PO) dan Biaya Operasional (Opex).</p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/20 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-blue-300 font-medium mb-1">Net Cash Flow</h3>
                  <p className="text-4xl font-bold text-white">{formatRupiah(data.cashFlow.net)}</p>
                  <p className={`text-sm mt-3 ${data.cashFlow.net >= 0 ? 'text-blue-300' : 'text-red-300'}`}>
                    {data.cashFlow.net >= 0 ? 'Surplus Kas' : 'Defisit Kas'}
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
