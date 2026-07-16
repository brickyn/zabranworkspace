'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { ShoppingBag, Loader2, ArrowLeft, AlertCircle, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ScalevPage() {
  const [adsData, setAdsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/scalev/dashboard-stats');
      setAdsData(res.data);
    } catch (error) {
      console.error('Gagal mengambil data Scalev', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const getOrderStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'completed' || s === 'success' || s === 'berhasil') return 'bg-green-500/20 text-green-500';
    if (s === 'pending' || s === 'unpaid') return 'bg-yellow-500/20 text-yellow-500';
    if (s === 'cancelled' || s === 'failed' || s === 'batal') return 'bg-red-500/20 text-red-500';
    return 'bg-blue-500/20 text-blue-500';
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="flex justify-between items-center bg-glass-bg p-6 rounded-2xl border border-glass-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/bsb" className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Data Penjualan Scalev</h1>
            </div>
            <p className="text-muted text-sm ml-10">Menampilkan pesanan dan pendapatan real-time dari Scalev API (100 Pesanan Terakhir).</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {!adsData?.configured ? (
              <GlassCard className="p-6 text-center mt-4">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <h3 className="text-foreground font-medium mb-1">Scalev API Belum Dikonfigurasi</h3>
                <p className="text-muted text-sm">{adsData?.message || 'Silakan tambahkan SCALEV_API_KEY di file .env backend'}</p>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <GlassCard className="p-5 overflow-hidden">
                    <div className="flex items-center gap-3 text-muted mb-2">
                      <ShoppingBag className="w-5 h-5 text-purple-500" />
                      <h3 className="text-sm font-medium">Total Pesanan Scalev</h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{adsData?.data?.totalOrders || 0}</p>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  </GlassCard>
                  
                  <GlassCard className="p-5 overflow-hidden">
                    <div className="flex items-center gap-3 text-muted mb-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <h3 className="text-sm font-medium">Total Pendapatan</h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{formatRupiah(adsData?.data?.totalRevenue || 0)}</p>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  </GlassCard>
                </div>

                <GlassCard className="rounded-2xl overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-muted">
                      <thead className="text-xs text-muted-foreground uppercase bg-black/5 dark:bg-white/5 border-b border-glass-border">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Tanggal</th>
                          <th className="px-6 py-4 font-semibold">ID Pesanan</th>
                          <th className="px-6 py-4 font-semibold">Nama Pembeli</th>
                          <th className="px-6 py-4 font-semibold text-right">Total (Rp)</th>
                          <th className="px-6 py-4 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border">
                        {(!adsData?.data?.orders || adsData.data.orders.length === 0) ? (
                          <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada pesanan terbaru dari Scalev</td></tr>
                        ) : (
                          adsData.data.orders.map((order: any) => (
                            <tr key={order.id || order.order_id} className="hover:bg-nav-hover transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td className="px-6 py-4 font-medium text-foreground">{order.order_id || order.id || 'N/A'}</td>
                              <td className="px-6 py-4 text-muted">{order.customer?.name || 'Unknown'}</td>
                              <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-medium">{formatRupiah(order.total_price || 0)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${getOrderStatusColor(order.status)}`}>
                                  {order.status || 'Berhasil'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
