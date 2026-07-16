'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  BookOpen, TrendingUp, ShoppingBag, 
  Smartphone, Loader2, Activity, CheckCircle2, TrendingDown, DollarSign,
  CreditCard, FileText, BarChart
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import KPITargetCard from '@/components/KPITargetCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BSBHub() {
  const [metrics, setMetrics] = useState<any>({});
  const [adsData, setAdsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPeriod, setFilterPeriod] = useState('month'); 

  const getDateRange = (period: string) => {
    const now = new Date();
    if (period === 'today') {
      return { startDate: new Date(now.setHours(0,0,0,0)).toISOString(), endDate: new Date(now.setHours(23,59,59,999)).toISOString() };
    } else if (period === 'month') {
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString() };
    } else if (period === 'year') {
      return { startDate: new Date(now.getFullYear(), 0, 1).toISOString(), endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString() };
    }
    return { startDate: '', endDate: '' };
  };

  useEffect(() => {
    fetchData();
  }, [filterPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(filterPeriod);
      const query = startDate ? `?startDate=${startDate}&endDate=${endDate}` : '';

      const [res, scalevRes] = await Promise.all([
        apiClient.get(`/bsb/metrics${query}`),
        apiClient.get('/scalev/dashboard-stats')
      ]);
      setMetrics(res.data.data || {});
      setAdsData(scalevRes.data);
    } catch (error) {
      console.error('Gagal mengambil data BSB', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const modules = [
    {
      title: 'Data Penjualan',
      description: 'Kelola dan pantau transaksi BSB.',
      icon: CreditCard,
      href: '/bsb/transactions',
      color: 'bg-blue-500/20 text-blue-500',
      border: 'border-blue-500/30'
    },
    {
      title: 'Laporan Aktivitas',
      description: 'Catat kegiatan harian tim.',
      icon: Activity,
      href: '/bsb/activities',
      color: 'bg-emerald-500/20 text-emerald-500',
      border: 'border-emerald-500/30'
    },
    {
      title: 'Beban Operasional',
      description: 'Pencatatan pengeluaran & beban.',
      icon: DollarSign,
      href: '/bsb/expenses',
      color: 'bg-orange-500/20 text-orange-500',
      border: 'border-orange-500/30'
    },
    {
      title: 'Iklan (Scalev)',
      description: 'Integrasi penjualan & iklan Scalev.',
      icon: BarChart,
      href: '/bsb/scalev',
      color: 'bg-purple-500/20 text-purple-500',
      border: 'border-purple-500/30'
    }
  ];

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Divisi BSB Hub</h1>
          <p className="text-muted">Pusat kontrol metrik dan navigasi Buku Sekolah Bisnis.</p>
        </motion.div>

        {/* Filter Period */}
        <div className="flex justify-between items-center bg-glass-bg p-4 rounded-2xl border border-glass-border">
          <h2 className="font-semibold text-foreground">Metrik Overview</h2>
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-glass-border text-gray-900 dark:text-white text-sm rounded-full px-4 py-2 outline-none focus:border-indigo-500"
          >
            <option value="today">Hari Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
            <option value="all">Semua Waktu</option>
          </select>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* KPI Target */}
            <KPITargetCard 
              division="BSB"
              actualValue={metrics.omzetBsb || 0}
              month={new Date().getMonth() + 1}
              year={new Date().getFullYear()}
              title="Pencapaian Target Omzet BSB"
              formatValue={(val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)}
            />

            {/* Scalev Quick Stats */}
            {adsData?.configured && (
              <Link href="/bsb/scalev">
                <GlassCard interactive className="border border-[#2B52FF]/30 p-5 flex justify-between items-center transition-all hover:bg-nav-hover">
                  <div>
                    <h3 className="text-sm font-medium text-muted mb-1 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#2B52FF]" /> Scalev Realtime Sales
                    </h3>
                    <p className="text-xl font-bold text-foreground">{formatRupiah(adsData.data.totalRevenue)} <span className="text-sm text-muted font-normal">({adsData.data.totalOrders} Pesanan)</span></p>
                  </div>
                  <div className="text-xs text-[#2B52FF] font-semibold px-3 py-1.5 rounded-lg bg-[#2B52FF]/10">Lihat Data Penjualan →</div>
                </GlassCard>
              </Link>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-5 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-3 text-muted mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="text-sm font-medium">Omzet Kotor</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatRupiah(metrics.omzetBsb)}</p>
              </GlassCard>
              
              <GlassCard className="p-5 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-3 text-muted mb-2">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-medium">Laba Bersih</h3>
                </div>
                <p className={`text-2xl font-bold ${metrics.netProfit < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {formatRupiah(metrics.netProfit)}
                </p>
              </GlassCard>

              <GlassCard className="p-5 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-3 text-muted mb-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-medium">Total Beban</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatRupiah(metrics.totalExpense)}</p>
              </GlassCard>

              <GlassCard className="p-5 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-3 text-muted mb-2">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                  <h3 className="text-sm font-medium">Buku Terjual</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{metrics.bukuTerjual || 0} Item</p>
              </GlassCard>
            </div>
            
            {/* Navigasi Modul (Master Hub Style) */}
            <h2 className="font-semibold text-foreground mt-8 mb-4">Modul BSB</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modules.map((mod, i) => (
                <Link href={mod.href} key={i}>
                  <GlassCard interactive className={`p-6 border h-full flex flex-col justify-between ${mod.border} hover:bg-nav-hover transition-all`}>
                    <div>
                      <div className={`p-3 rounded-2xl w-fit mb-4 ${mod.color}`}>
                        <mod.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{mod.title}</h3>
                      <p className="text-sm text-muted">{mod.description}</p>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
