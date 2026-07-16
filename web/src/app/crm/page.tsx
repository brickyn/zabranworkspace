'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  Users, TrendingUp, TrendingDown,
  MessageSquare, Loader2, Star, Eye, Database, Crown, Medal, ListChecks, Heart, RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import KPITargetCard from '@/components/KPITargetCard';

export default function CRMHub() {
  const [metrics, setMetrics] = useState<any>({});
  const [leaderboardStats, setLeaderboardStats] = useState({ badgeOwnersCount: 0, loyalCount: 0 });
  const [topSpenders, setTopSpenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPeriod, setFilterPeriod] = useState('month'); 
  const [spendersLimit, setSpendersLimit] = useState(10);

  const getDateRange = (period: string) => {
    const now = new Date();
    if (period === 'today') {
      return { startDate: new Date(now.setHours(0,0,0,0)).toISOString(), endDate: new Date(now.setHours(23,59,59,999)).toISOString() };
    } else if (period === 'month') {
      return { month: now.getMonth() + 1, year: now.getFullYear() };
    } else if (period === 'year') {
      return { year: now.getFullYear() };
    }
    return {};
  };

  useEffect(() => {
    fetchData();
  }, [filterPeriod, spendersLimit]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dates = getDateRange(filterPeriod);
      const params = new URLSearchParams();
      if ((dates as any).startDate) params.append('startDate', (dates as any).startDate);
      if ((dates as any).endDate) params.append('endDate', (dates as any).endDate);
      if ((dates as any).month) params.append('month', (dates as any).month.toString());
      if ((dates as any).year) params.append('year', (dates as any).year.toString());
      
      const query = params.toString() ? `?${params.toString()}` : '';

      const [res, leaderRes] = await Promise.all([
        apiClient.get(`/crm/metrics${query}`),
        apiClient.get(`/crm/leaderboard${query}`)
      ]);
      setMetrics(res.data.data || {});
      setLeaderboardStats({
        badgeOwnersCount: leaderRes.data.data?.badgeOwnersCount || 0,
        loyalCount: leaderRes.data.data?.loyalCount || 0
      });
      setTopSpenders(leaderRes.data.data?.topSpenders?.slice(0, spendersLimit) || []);
    } catch (error) {
      console.error('Gagal mengambil data CRM', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTrend = (trend: number | undefined) => {
    if (trend === undefined || trend === 0) return null;
    const isUp = trend > 0;
    return (
      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${isUp ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(trend).toFixed(1)}%
      </div>
    );
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const modules = [
    {
      title: 'Review Harian',
      description: 'Laporan bintang & kepuasan pelanggan harian.',
      icon: Star,
      href: '/crm/daily-reviews',
      color: 'bg-yellow-500/20 text-yellow-500',
      border: 'border-yellow-500/30'
    },
    {
      title: 'Aktivitas CRM',
      description: 'Log follow-up leads dan response time.',
      icon: ListChecks,
      href: '/crm/activities',
      color: 'bg-blue-500/20 text-blue-500',
      border: 'border-blue-500/30'
    },
    {
      title: 'Mystery Guest',
      description: 'Laporan audit standar operasional & pelayanan.',
      icon: Eye,
      href: '/crm/mystery-guest',
      color: 'bg-purple-500/20 text-purple-500',
      border: 'border-purple-500/30'
    },
    {
      title: 'Loyal Customers',
      description: 'Daftar pelanggan setia dengan badge.',
      icon: Heart,
      href: '/crm/loyal-customers',
      color: 'bg-pink-500/20 text-pink-500',
      border: 'border-pink-500/30'
    },
    {
      title: 'Repeat Orders',
      description: 'Analisis pelanggan lama belanja kembali.',
      icon: RefreshCw,
      href: '/crm/repeat-orders',
      color: 'bg-green-500/20 text-green-500',
      border: 'border-green-500/30'
    }
  ];

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
          <h1 className="text-3xl font-bold text-foreground mb-2">CRM Hub</h1>
          <p className="text-muted">Pusat Customer Relationship Management, Review, dan Loyalitas.</p>
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
            
            {/* KPI Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 text-muted">
                    <Medal className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    <h3 className="text-sm font-medium">Pemilik Badge</h3>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-foreground">{leaderboardStats.badgeOwnersCount || 0}</p>
                </div>
              </GlassCard>

              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 text-muted">
                    <Crown className="w-5 h-5 text-green-500 dark:text-green-400" />
                    <h3 className="text-sm font-medium">Loyal Customers</h3>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-foreground">{leaderboardStats.loyalCount || 0}</p>
                </div>
              </GlassCard>

              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 text-muted">
                    <Database className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <h3 className="text-sm font-medium">Total Database Baru</h3>
                  </div>
                  {renderTrend(metrics.customersTrend)}
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-foreground">{metrics.totalCustomers || 0}</p>
                </div>
              </GlassCard>
            </div>

            {/* KPI Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 text-muted">
                    <Users className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    <h3 className="text-sm font-medium">Database Aktif</h3>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-foreground">{metrics.totalActiveCustomers || 0}</p>
                </div>
                <p className="text-xs text-muted mt-1">{metrics.activePercentage?.toFixed(1) || 0}% dari total database</p>
              </GlassCard>
              
              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 text-muted">
                    <Users className="w-5 h-5 text-red-500 dark:text-red-400" />
                    <h3 className="text-sm font-medium">Database Tidak Aktif</h3>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-foreground">{metrics.totalInactiveCustomers || 0}</p>
                </div>
                <p className="text-xs text-muted mt-1">{metrics.inactivePercentage?.toFixed(1) || 0}% dari total database</p>
              </GlassCard>

              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 text-muted">
                    <MessageSquare className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <h3 className="text-sm font-medium">Response Time CS</h3>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-foreground">{metrics.avgResponseTime?.toFixed(1) || 0} <span className="text-sm font-normal text-muted">Menit</span></p>
                </div>
                <p className="text-xs text-muted mt-1">Rata-rata waktu balas chat</p>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 mt-6">
              
              {/* Modul Navigasi */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {modules.map((mod, i) => (
                  <Link href={mod.href} key={i}>
                    <GlassCard interactive className={`p-5 border h-full flex flex-col justify-between ${mod.border} hover:bg-nav-hover transition-all`}>
                      <div>
                        <div className={`p-3 rounded-2xl w-fit mb-3 ${mod.color}`}>
                          <mod.icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-md font-bold text-foreground mb-1">{mod.title}</h3>
                        <p className="text-xs text-muted leading-relaxed">{mod.description}</p>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>

              {/* Top Spenders Sidebar */}
              <GlassCard className="p-0 overflow-hidden flex flex-col h-full rounded-3xl">
                <div className="p-5 border-b border-glass-border flex justify-between items-center bg-black/5 dark:bg-white/5">
                  <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                    <Medal className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                    Top Spenders
                  </h3>
                  <select 
                    value={spendersLimit} 
                    onChange={(e) => setSpendersLimit(Number(e.target.value))}
                    className="bg-white dark:bg-gray-800 border border-glass-border text-gray-900 dark:text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                  >
                    <option value={10}>Top 10</option>
                    <option value={50}>Top 50</option>
                  </select>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[400px]">
                  {topSpenders.length === 0 ? (
                    <div className="p-6 text-center text-muted text-sm">Tidak ada data.</div>
                  ) : (
                    <div className="divide-y divide-glass-border">
                      {topSpenders.map((cust, idx) => (
                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-nav-hover transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-black/5 dark:bg-white/5 text-muted'}`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground truncate max-w-[120px]">{cust.name}</p>
                              <p className="text-[10px] text-muted">{cust.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatRupiah(cust.totalSpent)}</p>
                            <p className="text-[10px] text-muted">{cust.transactionCount} Transaksi</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>

            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
