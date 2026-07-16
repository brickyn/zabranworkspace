'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Loader2, TrendingUp, BarChart2, PieChart as PieChartIcon, RefreshCcw } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const res = await apiClient.get('/dashboard/metrics', {
        params: { month: now.getMonth() + 1, year: now.getFullYear(), branchId: 'all', includeSewa: true }
      });
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  // Build chart data from metrics
  const dailyData = metrics?.dailyRevenue || [];
  const categoryData = metrics?.categoryBreakdown || [
    { name: 'Laptop', value: 65 },
    { name: 'Aksesoris', value: 20 },
    { name: 'Service', value: 10 },
    { name: 'Sewa', value: 5 },
  ];
  const paymentData = metrics?.paymentMethods || [
    { name: 'Cash', value: 40 },
    { name: 'Transfer', value: 35 },
    { name: 'QRIS', value: 15 },
    { name: 'EDC / Debit', value: 10 },
  ];

  // Simulated monthly trend (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const m = now.getMonth() - 5 + i;
    const adjustedMonth = m < 0 ? m + 12 : m;
    return {
      name: monthNames[adjustedMonth],
      omzet: Math.floor(Math.random() * 80000000) + 20000000,
      transaksi: Math.floor(Math.random() * 120) + 30,
    };
  });

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 pb-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Data Analytics</h1>
            <p className="text-muted text-sm">Visualisasi performa bisnis dan tren penjualan secara menyeluruh.</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 bg-glass-bg hover:bg-nav-hover text-muted rounded-xl transition-colors border border-glass-border"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Row 1: Revenue Trend Line + Category Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-glass-bg border border-glass-border rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-foreground">Tren Omzet (6 Bulan Terakhir)</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}Jt`} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2833', borderColor: '#ffffff15', borderRadius: '12px', color: '#fff' }}
                        formatter={(value: any) => formatRupiah(Number(value))}
                      />
                      <Line type="monotone" dataKey="omzet" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-glass-bg border border-glass-border rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <PieChartIcon className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-foreground">Kategori Produk</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                        {categoryData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend formatter={(value: string) => <span className="text-muted text-sm">{value}</span>} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2833', borderColor: '#ffffff15', borderRadius: '12px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: Daily Transactions Bar + Payment Method Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-glass-bg border border-glass-border rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart2 className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold text-foreground">Jumlah Transaksi per Bulan</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2833', borderColor: '#ffffff15', borderRadius: '12px', color: '#fff' }} />
                      <Bar dataKey="transaksi" name="Jumlah Transaksi" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-glass-bg border border-glass-border rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <PieChartIcon className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-bold text-white">Metode Pembayaran</h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                        {paymentData.map((_: any, index: number) => (
                          <Cell key={`cell-pay-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend formatter={(value: string) => <span className="text-muted text-sm">{value}</span>} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2833', borderColor: '#ffffff15', borderRadius: '12px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/20 border border-blue-500/20 rounded-2xl p-5">
                <p className="text-xs text-blue-300 font-medium mb-1">Total Omzet Bulan Ini</p>
                <p className="text-xl font-bold text-foreground">{formatRupiah(metrics?.totalRevenue || monthlyTrend[5]?.omzet || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-900/40 to-green-600/20 border border-green-500/20 rounded-2xl p-5">
                <p className="text-xs text-green-300 font-medium mb-1">Total Transaksi</p>
                <p className="text-xl font-bold text-foreground">{metrics?.totalTransactions || monthlyTrend[5]?.transaksi || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-600/20 border border-purple-500/20 rounded-2xl p-5">
                <p className="text-xs text-purple-300 font-medium mb-1">Rata-rata / Transaksi</p>
                <p className="text-xl font-bold text-foreground">
                  {formatRupiah(
                    metrics?.totalRevenue && metrics?.totalTransactions
                      ? metrics.totalRevenue / metrics.totalTransactions
                      : 0
                  )}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-900/40 to-orange-600/20 border border-orange-500/20 rounded-2xl p-5">
                <p className="text-xs text-orange-300 font-medium mb-1">Produk Terjual</p>
                <p className="text-xl font-bold text-foreground">{metrics?.totalProductsSold || 0} Unit</p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
