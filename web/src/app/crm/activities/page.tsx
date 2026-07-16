'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Loader2, ArrowLeft, MessageSquare, Clock } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CRMActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    type: 'Follow-up Leads', description: '', date: '', responseTime: '' 
  });
  const [formLoading, setFormLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Filters
  const [filterPeriod, setFilterPeriod] = useState('month'); 

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch(e) {}
    }
  }, []);

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
      const res = await apiClient.get(`/crm/activities${query}`);
      setActivities(res.data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data aktivitas CRM');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/crm/activities', {
        ...form,
        picName: currentUser?.name || 'Admin'
      });
      toast.success('Aktivitas CRM berhasil dicatat');
      setShowModal(false);
      setForm({ type: 'Follow-up Leads', description: '', date: '', responseTime: '' });
      fetchData();
    } catch (error) {
      toast.error('Gagal mencatat aktivitas');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="flex justify-between items-center bg-glass-bg p-6 rounded-2xl border border-glass-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/crm" className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Aktivitas CRM & CS</h1>
            </div>
            <p className="text-muted text-sm ml-10">Catat histori broadcast, follow-up leads, dan handling komplain.</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full transition-all text-sm font-medium shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Lapor Aktivitas
          </button>
        </motion.div>

        {/* Filter Period */}
        <div className="flex justify-end px-2">
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
          <GlassCard className="rounded-2xl overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-muted">
                <thead className="text-xs text-muted-foreground uppercase bg-black/5 dark:bg-white/5 border-b border-glass-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Tanggal</th>
                    <th className="px-6 py-4 font-semibold">Jenis Aktivitas</th>
                    <th className="px-6 py-4 font-semibold">PIC / CS</th>
                    <th className="px-6 py-4 font-semibold">Response Time</th>
                    <th className="px-6 py-4 font-semibold">Detail Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {activities.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada laporan aktivitas di periode ini</td></tr>
                  ) : (
                    activities.map((a) => (
                      <tr key={a.id} className="hover:bg-nav-hover transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                            a.type === 'Broadcast Promo' ? 'bg-purple-500/20 text-purple-500' :
                            a.type === 'Follow-up Leads' ? 'bg-green-500/20 text-green-500' :
                            a.type === 'Handle Complain' ? 'bg-red-500/20 text-red-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>
                            {a.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{a.picName || '-'}</td>
                        <td className="px-6 py-4">
                          {a.responseTime ? (
                            <span className="flex items-center gap-1.5 text-orange-500 font-semibold">
                              <Clock className="w-3.5 h-3.5" /> {a.responseTime} Menit
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-muted max-w-sm">
                          <p className="line-clamp-2" title={a.description}>{a.description}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Lapor Aktivitas CRM</h2>
              <p className="text-sm text-muted mt-1">Catat histori kegiatan Customer Service & CRM harian</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Jenis Aktivitas</label>
                  <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                    <option value="Follow-up Leads">Follow-up Leads / Prospek</option>
                    <option value="Handle Complain">Handling Complain</option>
                    <option value="Broadcast Promo">Broadcast Promo (WA/Email)</option>
                    <option value="Customer Greeting">Customer Greeting (Ultah dll)</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Tanggal</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 [color-scheme:dark]" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Response Time CS (Menit) - Opsional
                </label>
                <input 
                  type="number" 
                  value={form.responseTime} 
                  onChange={e => setForm({...form, responseTime: e.target.value})} 
                  className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" 
                  placeholder="Misal: 5"
                />
                <p className="text-[10px] text-muted">Berapa menit rata-rata membalas chat pelanggan untuk sesi ini?</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Detail Keterangan Lengkap
                </label>
                <textarea 
                  required
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 min-h-[120px]" 
                  placeholder="Contoh: Mengirimkan broadcast promo 10.10 ke 500 pelanggan aktif wilayah Jatim..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-glass-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-muted hover:text-white hover:bg-nav-hover transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-6 py-2.5 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
