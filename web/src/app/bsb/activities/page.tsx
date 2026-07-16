'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({ 
    type: 'Live Streaming', description: '', date: '', title: '', platform: 'Tiktok' 
  });
  const [formLoading, setFormLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
      const res = await apiClient.get(`/bsb/activities${query}`);
      setActivities(res.data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data aktivitas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/bsb/activities', {
        ...activityForm,
        picName: currentUser?.name || 'Admin',
      });
      toast.success('Aktivitas berhasil disimpan');
      setShowActivityModal(false);
      setActivityForm({ type: 'Live Streaming', description: '', date: '', title: '', platform: 'Tiktok' });
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan aktivitas');
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
              <Link href="/bsb" className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Laporan Aktivitas Harian</h1>
            </div>
            <p className="text-muted text-sm ml-10">Catat dan pantau kegiatan operasional harian tim BSB.</p>
          </div>
          
          <button 
            onClick={() => setShowActivityModal(true)}
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
                    <th className="px-6 py-4 font-semibold">Jenis Kegiatan</th>
                    <th className="px-6 py-4 font-semibold">Deskripsi</th>
                    <th className="px-6 py-4 font-semibold">PIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {activities.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada aktivitas di periode ini</td></tr>
                  ) : (
                    activities.map((a) => (
                      <tr key={a.id} className="hover:bg-nav-hover transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4 font-medium text-foreground">{a.type}</td>
                        <td className="px-6 py-4 text-muted max-w-md">{a.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{a.picName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-glass-bg border border-glass-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-glass-border">
              <h2 className="text-xl font-bold text-foreground">Lapor Aktivitas BSB</h2>
              <p className="text-sm text-muted mt-1">Catat kegiatan harian tim</p>
            </div>
            
            <form onSubmit={handleCreateActivity} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Jenis Kegiatan</label>
                  <select required value={activityForm.type} onChange={e => setActivityForm({...activityForm, type: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                    <option value="Live Streaming">Live Streaming</option>
                    <option value="Konten Sosmed">Pembuatan Konten Sosmed</option>
                    <option value="Pembuatan Konten">Pembuatan Konten (Spesifik)</option>
                    <option value="Optimasi Iklan">Optimasi Iklan</option>
                    <option value="Follow-up Leads">Follow-up Leads</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Tanggal</label>
                  <input type="date" value={activityForm.date} onChange={e => setActivityForm({...activityForm, date: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 [color-scheme:dark]" />
                </div>
              </div>
              
              {activityForm.type === 'Pembuatan Konten' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted">Judul Konten</label>
                    <input type="text" required value={activityForm.title} onChange={e => setActivityForm({...activityForm, title: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="Judul konten..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted">Platform Upload</label>
                    <select required value={activityForm.platform} onChange={e => setActivityForm({...activityForm, platform: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                      <option value="Tiktok">Tiktok</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Ads">Ads</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm text-muted">Detail Keterangan</label>
                <textarea 
                  required 
                  value={activityForm.description} 
                  onChange={e => setActivityForm({...activityForm, description: e.target.value})} 
                  className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 min-h-[120px]" 
                  placeholder="Ceritakan detail yang dilakukan..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-glass-border">
                <button type="button" onClick={() => setShowActivityModal(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-muted hover:text-foreground hover:bg-nav-hover transition-colors">Batal</button>
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
