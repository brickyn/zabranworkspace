'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  Briefcase, Users, TrendingUp, Calendar, 
  Building, Activity, CreditCard, Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import KPITargetCard from '@/components/KPITargetCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function B2BHub() {
  const [metrics, setMetrics] = useState<any>({});
  const [schedules, setSchedules] = useState<any[]>([]);
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

      const res = await apiClient.get(`/b2b/metrics${query}`);
      setMetrics(res.data.data || {});
      const schedRes = await apiClient.get('/b2b/schedules');
      setSchedules(schedRes.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data B2B', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const modules = [
    {
      title: 'Transaksi B2B',
      description: 'Kelola transaksi dengan instansi.',
      icon: CreditCard,
      href: '/b2b/transactions',
      color: 'bg-blue-500/20 text-blue-500',
      border: 'border-blue-500/30'
    },
    {
      title: 'Jadwal Kunjungan',
      description: 'Atur agenda visit dan presentasi.',
      icon: Calendar,
      href: '/b2b/schedules',
      color: 'bg-purple-500/20 text-purple-500',
      border: 'border-purple-500/30'
    },
    {
      title: 'Aktivitas B2B',
      description: 'Catat log meeting & follow-up.',
      icon: Activity,
      href: '/b2b/activities',
      color: 'bg-emerald-500/20 text-emerald-500',
      border: 'border-emerald-500/30'
    },
    {
      title: 'Partnership Aktif',
      description: 'Daftar klien dan instansi kerjasama.',
      icon: Building,
      href: '/b2b/partners',
      color: 'bg-orange-500/20 text-orange-500',
      border: 'border-orange-500/30'
    }
  ];

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Divisi B2B Hub</h1>
          <p className="text-muted">Pusat kontrol dan metrik operasional Business to Business.</p>
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
              division="B2B"
              actualValue={schedules.filter(s => new Date(s.startDate).getMonth() === new Date().getMonth() && new Date(s.startDate).getFullYear() === new Date().getFullYear()).length}
              month={new Date().getMonth() + 1}
              year={new Date().getFullYear()}
              title="Target Visit Bulanan"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 text-muted">
                    <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
                    <h3 className="text-sm font-medium">Omzet B2B</h3>
                  </div>
                  {metrics.omzetTrend !== undefined && metrics.omzetTrend !== 0 && (
                    <div className={`text-xs font-semibold px-2 py-1 rounded-md ${metrics.omzetTrend > 0 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                      {metrics.omzetTrend > 0 ? '+' : ''}{metrics.omzetTrend.toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">{formatRupiah(metrics.omzetB2B)}</p>
              </GlassCard>
              
              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-3 mb-2 text-muted">
                  <Building className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <h3 className="text-sm font-medium">Total Klien</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{metrics.totalPartners || 0}</p>
              </GlassCard>

              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-3 mb-2 text-muted">
                  <Users className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  <h3 className="text-sm font-medium">Klien Aktif</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{metrics.activePartners || 0}</p>
              </GlassCard>

              <GlassCard className="p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 text-muted">
                    <Activity className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                    <h3 className="text-sm font-medium">Total Aktivitas</h3>
                  </div>
                  {metrics.activitiesTrend !== undefined && metrics.activitiesTrend !== 0 && (
                    <div className={`text-xs font-semibold px-2 py-1 rounded-md ${metrics.activitiesTrend > 0 ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                      {metrics.activitiesTrend > 0 ? '+' : ''}{metrics.activitiesTrend.toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">{metrics.totalActivities || 0}</p>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Segment 1: Jadwal Hari Ini */}
              <GlassCard className="p-6 rounded-3xl flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" /> Kunjungan Hari Ini
                  </h3>
                  <Link href="/b2b/schedules" className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-semibold">Selengkapnya →</Link>
                </div>
                <div className="flex-1 space-y-3">
                  {(() => {
                    const todayStr = new Date().toDateString();
                    const todayScheds = schedules.filter(s => new Date(s.startDate).toDateString() === todayStr);
                    if (todayScheds.length === 0) return <p className="text-sm text-muted">Tidak ada jadwal hari ini</p>;
                    return todayScheds.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-glass-border">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.title}</p>
                          <p className="text-xs text-muted">{s.targetName || s.partner?.company}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${s.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                          {s.status}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </GlassCard>

              {/* Segment 2: Modul Navigasi (Master Hub Style) */}
              <div className="grid grid-cols-2 gap-4">
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
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
