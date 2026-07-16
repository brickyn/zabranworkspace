'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Loader2, ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CRMDailyReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    branchId: '', date: '', star5: 0, star4: 0, star3: 0, star2: 0, star1: 0, problemNotes: '' 
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Filters
  const [filterPeriod, setFilterPeriod] = useState('month'); 

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const bRes = await apiClient.get('/branches');
      setBranches(bRes.data.data || []);
    } catch (e) {}
  };

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
      const res = await apiClient.get(`/crm/daily-reviews${query}`);
      setReviews(res.data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data review');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/crm/daily-reviews', form);
      toast.success('Review Harian berhasil dicatat');
      setShowModal(false);
      setForm({ branchId: '', date: '', star5: 0, star4: 0, star3: 0, star2: 0, star1: 0, problemNotes: '' });
      fetchData();
    } catch (error) {
      toast.error('Gagal mencatat review');
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
              <h1 className="text-2xl font-bold text-foreground">Review Harian Cabang</h1>
            </div>
            <p className="text-muted text-sm ml-10">Pantau kepuasan pelanggan dan rating cabang setiap hari.</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full transition-all text-sm font-medium shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Input Review
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
                    <th className="px-6 py-4 font-semibold">Cabang</th>
                    <th className="px-6 py-4 font-semibold text-center">Bintang 5</th>
                    <th className="px-6 py-4 font-semibold text-center">Bintang 4</th>
                    <th className="px-6 py-4 font-semibold text-center">Bintang 3-1</th>
                    <th className="px-6 py-4 font-semibold">Total Review</th>
                    <th className="px-6 py-4 font-semibold">Avg Rating</th>
                    <th className="px-6 py-4 font-semibold">Catatan Kendala</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {reviews.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada laporan review di periode ini</td></tr>
                  ) : (
                    reviews.map((r) => {
                      const total = r.star5 + r.star4 + r.star3 + r.star2 + r.star1;
                      const avg = total > 0 ? ((r.star5*5 + r.star4*4 + r.star3*3 + r.star2*2 + r.star1*1) / total).toFixed(1) : '0';
                      return (
                        <tr key={r.id} className="hover:bg-nav-hover transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">{new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td className="px-6 py-4 font-medium text-foreground">{r.branch?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-center text-green-500 font-bold">{r.star5}</td>
                          <td className="px-6 py-4 text-center text-blue-500 font-bold">{r.star4}</td>
                          <td className="px-6 py-4 text-center text-red-500 font-bold">{r.star3 + r.star2 + r.star1}</td>
                          <td className="px-6 py-4 text-foreground font-bold">{total}</td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1 font-bold text-yellow-500">
                              <Star className="w-3 h-3 fill-yellow-500" /> {avg}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs max-w-[200px] truncate" title={r.problemNotes || '-'}>
                            {r.problemNotes || '-'}
                          </td>
                        </tr>
                      );
                    })
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
              <h2 className="text-xl font-bold text-white">Input Review Harian</h2>
              <p className="text-sm text-muted mt-1">Masukkan kompilasi review pelanggan dari Google Maps/Sosmed</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Pilih Cabang</label>
                  <select required value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                    <option value="" disabled>Pilih Cabang...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Tanggal Review</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 [color-scheme:dark]" />
                </div>
              </div>

              <div className="bg-glass-bg p-4 rounded-xl border border-glass-border space-y-4">
                <p className="text-sm font-semibold text-white mb-2">Jumlah Bintang (Total per hari)</p>
                <div className="grid grid-cols-5 gap-3">
                  {[5,4,3,2,1].map(star => (
                    <div key={star} className="space-y-1">
                      <label className="text-xs text-center block text-muted flex items-center justify-center gap-1">
                        {star}<Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        required
                        value={(form as any)[`star${star}`]} 
                        onChange={e => setForm({...form, [`star${star}`]: Number(e.target.value)})} 
                        className="w-full px-2 py-2 bg-glass-bg border border-glass-border rounded-lg text-center text-foreground outline-none focus:border-blue-500" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Catatan Masalah (Opsional)
                </label>
                <textarea 
                  value={form.problemNotes} 
                  onChange={e => setForm({...form, problemNotes: e.target.value})} 
                  className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 min-h-[80px]" 
                  placeholder="Misal: Pelanggan complain soal lambatnya antrian..."
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
