'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  TrendingUp, 
  TrendingDown,
  Download, 
  RefreshCcw, 
  ShoppingCart,
  Wrench,
  Headphones,
  Key,
  Trophy,
  Activity,
  Building,
  BookOpen
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import * as xlsx from 'xlsx';

export default function OwnerDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [historical, setHistorical] = useState<any[]>([]);
  const [topBranches, setTopBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [includeSewa, setIncludeSewa] = useState(true);

  // Compare multi year
  const [yearFrom, setYearFrom] = useState((new Date().getFullYear() - 1).toString());

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch current metrics
      const resMetrics = await apiClient.get('/dashboard/metrics', {
        params: { month, year, branchId: 'all', includeSewa }
      });
      if (resMetrics.data.success) {
        setMetrics(resMetrics.data.data);
      }

      // Fetch historical data
      const resHist = await apiClient.get('/dashboard/historical', {
        params: { yearFrom, yearTo: year, branchId: 'all' }
      });
      if (resHist.data.success) {
        // Format for Recharts
        const raw = resHist.data.data.monthly;
        const formattedData: any = {};
        
        raw.forEach((item: any) => {
          const m = item.month;
          const y = item.year;
          if (!formattedData[m]) {
            formattedData[m] = { name: months[m - 1].label };
          }
          formattedData[m][`Tahun ${y}`] = item.omzet;
        });

        const chartData = Object.values(formattedData);
        setHistorical(chartData);
        setTopBranches(resHist.data.data.branchPerformance);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year, includeSewa, yearFrom]);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const handleExport = () => {
    try {
      const wb = xlsx.utils.book_new();
      
      // Sheet 1: Historical Data
      if (historical.length > 0) {
        const wsHist = xlsx.utils.json_to_sheet(historical);
        xlsx.utils.book_append_sheet(wb, wsHist, 'Data_Historis');
      }

      // Sheet 2: Top Branches
      if (topBranches.length > 0) {
        const wsBranches = xlsx.utils.json_to_sheet(topBranches.map(b => ({
          Cabang: b.name,
          Omzet: b.omzet,
          'Total Transaksi': b.transaksi
        })));
        xlsx.utils.book_append_sheet(wb, wsBranches, 'Performa_Cabang');
      }

      // Generate file
      const fileName = `Dashboard_Nasional_${month}_${year}.xlsx`;
      xlsx.writeFile(wb, fileName);
    } catch (error) {
      console.error('Failed to export', error);
    }
  };

  const months = [
    { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' }, { value: '8', label: 'Agt' }, { value: '9', label: 'Sep' },
    { value: '10', label: 'Okt' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Des' }
  ];

  return (
    <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        
        {/* Header Title */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mb-2">
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Center Nasional</h1>
          <p className="text-muted">Dashboard performa operasional seluruh cabang Zabran Workspaces. Data disajikan terpusat tanpa filter cabang.</p>
        </motion.div>

        {/* Tools & Date Filter */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-glass-bg p-4 rounded-2xl border border-glass-border">
          <div className="flex gap-4">
            <select value={month} onChange={e => setMonth(e.target.value)} className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-glass-border rounded-full text-gray-900 dark:text-white outline-none">
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={year} onChange={e => setYear(e.target.value)} className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-glass-border rounded-full text-gray-900 dark:text-white outline-none">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted bg-white/5 px-4 py-2 rounded-full">
              <input type="checkbox" checked={includeSewa} onChange={e => setIncludeSewa(e.target.checked)} className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-transparent" />
              Include Sewa
            </label>
            <button onClick={fetchData} className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground rounded-full transition-colors">
              <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleExport} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </motion.div>

        {/* 1. Bagian Atas: Omzet Keseluruhan, Penjualan Laptop, Service, Aksesoris, Sewa */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay: 0.15}} className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-900/40 to-blue-600/20 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-blue-300 font-medium mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Omzet Keseluruhan</h3>
            <div className="text-4xl font-bold text-white dark:text-white my-3">
              {metrics ? formatRupiah(metrics.totalOmzet) : 'Rp 0'}
            </div>
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 w-fit px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3" /> +12.5% vs Bulan Lalu
            </div>
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
          </motion.div>

          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay: 0.2}} className="bg-glass-bg border border-glass-border rounded-3xl p-5 flex flex-col justify-between hover:bg-nav-hover transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-purple-500/20 rounded-xl"><ShoppingCart className="w-5 h-5 text-purple-400" /></div>
              <span className="text-xs font-bold text-green-400">+5%</span>
            </div>
            <div>
              <p className="text-muted text-sm mt-4">Laptop</p>
              <h4 className="text-xl font-bold text-foreground">{formatRupiah(metrics?.laptop?.omzet || 0)}</h4>
              <p className="text-xs text-muted">{metrics?.laptop?.unit || 0} Unit</p>
            </div>
          </motion.div>

          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay: 0.25}} className="bg-glass-bg border border-glass-border rounded-3xl p-5 flex flex-col justify-between hover:bg-nav-hover transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-orange-500/20 rounded-xl"><Wrench className="w-5 h-5 text-orange-400" /></div>
              <span className="text-xs font-bold text-red-400">-2%</span>
            </div>
            <div>
              <p className="text-muted text-sm mt-4">Service</p>
              <h4 className="text-xl font-bold text-foreground">{formatRupiah(metrics?.service?.omzet || 0)}</h4>
              <p className="text-xs text-muted">{metrics?.service?.unit || 0} Unit</p>
            </div>
          </motion.div>

          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay: 0.3}} className="bg-glass-bg border border-glass-border rounded-3xl p-5 flex flex-col justify-between hover:bg-nav-hover transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-pink-500/20 rounded-xl"><Headphones className="w-5 h-5 text-pink-400" /></div>
              <span className="text-xs font-bold text-green-400">+18%</span>
            </div>
            <div>
              <p className="text-muted text-sm mt-4">Aksesoris</p>
              <h4 className="text-xl font-bold text-foreground">{formatRupiah(metrics?.aksesoris?.omzet || 0)}</h4>
              <p className="text-xs text-muted">{metrics?.aksesoris?.unit || 0} Unit</p>
            </div>
          </motion.div>
        </div>

        {/* 1b. Divisi Lainnya: B2B, BSB, CRM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay: 0.35}} className="bg-glass-bg border border-glass-border rounded-3xl p-5 flex justify-between items-center hover:bg-nav-hover transition-colors">
            <div>
              <p className="text-muted text-sm">Divisi B2B & Partnership</p>
              <h4 className="text-xl font-bold text-foreground mt-1">{formatRupiah(metrics?.b2b?.omzet || 0)}</h4>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-2xl"><Building className="w-6 h-6 text-blue-400" /></div>
          </motion.div>

          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay: 0.4}} className="bg-glass-bg border border-glass-border rounded-3xl p-5 flex justify-between items-center hover:bg-nav-hover transition-colors">
            <div>
              <p className="text-muted text-sm">Buku Sekolah Bisnis (BSB)</p>
              <h4 className="text-xl font-bold text-foreground mt-1">{formatRupiah(metrics?.bsb?.omzet || 0)}</h4>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-2xl"><BookOpen className="w-6 h-6 text-orange-400" /></div>
          </motion.div>
          
          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay: 0.45}} className="bg-glass-bg border border-glass-border rounded-3xl p-5 flex justify-between items-center hover:bg-nav-hover transition-colors shadow-lg shadow-purple-500/10">
            <div>
              <p className="text-muted text-sm">Divisi CRM (Repeat Order)</p>
              <div className="flex items-end gap-2 mt-1">
                <h4 className="text-xl font-bold text-purple-400">{metrics?.crm?.repeatOrder || 0}</h4>
                <span className="text-xs text-gray-500 mb-1">Pelanggan</span>
              </div>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-2xl"><Activity className="w-6 h-6 text-purple-400" /></div>
          </motion.div>
        </div>

        {/* 2. Grafik Komparasi & Performa Cabang Terbaik */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: 0.4}} className="col-span-1 lg:col-span-2 bg-glass-bg border border-glass-border rounded-3xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" /> Grafik Komparasi Performa</h3>
                <p className="text-sm text-muted">Perbandingan Omzet Nasional Multi-Tahun</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Dari Tahun:</span>
                <select value={yearFrom} onChange={e => setYearFrom(e.target.value)} className="bg-white dark:bg-gray-800 border border-glass-border text-gray-900 dark:text-white text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500">
                  <option value={new Date().getFullYear().toString()}>Tahun Ini Saja</option>
                  <option value={(new Date().getFullYear() - 1).toString()}>1 Tahun Lalu</option>
                  <option value={(new Date().getFullYear() - 2).toString()}>2 Tahun Lalu</option>
                  <option value={(new Date().getFullYear() - 3).toString()}>3 Tahun Lalu</option>
                </select>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historical}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} />
                  <Tooltip contentStyle={{backgroundColor: '#0B0C10', borderColor: '#ffffff20', color: '#fff'}} formatter={(val: any) => formatRupiah(val as number)} />
                  <Legend />
                  {historical.length > 0 && Object.keys(historical[0]).filter(k => k !== 'name').map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} name={key} stroke={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i%4]} strokeWidth={3} dot={{r: 4, strokeWidth: 0}} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay: 0.45}} className="bg-glass-bg border border-glass-border rounded-3xl p-6 flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" /> Top Performa Cabang</h3>
            <p className="text-sm text-muted mb-6">Berdasarkan pencapaian omzet periode ini.</p>
            
            <div className="flex-1 flex flex-col gap-4">
              {topBranches.slice(0, 5).map((b, i) => (
                <div key={i} className="bg-black/20 border border-glass-border rounded-2xl p-4 flex items-center gap-4 hover:bg-nav-hover transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : i === 1 ? 'bg-gray-300/20 text-muted border border-gray-300/50' : 'bg-orange-700/20 text-orange-400 border border-orange-700/50'}`}>
                    #{i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-foreground font-medium truncate">{b.name}</h4>
                    <p className="text-sm text-muted">{formatRupiah(b.omzet)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-blue-400 font-bold mb-1">{b.transaksi} TX</div>
                  </div>
                </div>
              ))}
              {topBranches.length === 0 && !loading && (
                <div className="text-center text-gray-500 my-auto py-10">Belum ada data</div>
              )}
            </div>
          </motion.div>

        </div>
    </div>
  );
}
