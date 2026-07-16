'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Loader2, ArrowLeft, Eye, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CRMMysteryGuestPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    branchId: '', score: 100, notes: '', date: '' 
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
      const res = await apiClient.get(`/crm/mystery-guests${query}`);
      setGuests(res.data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data Mystery Guest');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/crm/mystery-guests', form);
      toast.success('Laporan Mystery Guest berhasil disimpan');
      setShowModal(false);
      setForm({ branchId: '', score: 100, notes: '', date: '' });
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan laporan');
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
              <h1 className="text-2xl font-bold text-foreground">Mystery Guest</h1>
            </div>
            <p className="text-muted text-sm ml-10">Hasil audit pelayanan dan standar operasional cabang.</p>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full transition-all text-sm font-medium shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            Input Laporan MG
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
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guests.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted">Belum ada laporan Mystery Guest di periode ini</div>
            ) : (
              guests.map((g) => (
                <GlassCard key={g.id} className="p-6 flex flex-col hover:bg-nav-hover transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{g.branch?.name || 'Unknown Branch'}</h3>
                      <p className="text-xs text-muted">{new Date(g.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 font-bold text-lg
                      ${g.score >= 80 ? 'border-green-500 text-green-500 bg-green-500/10' : 
                        g.score >= 60 ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' : 
                        'border-red-500 text-red-500 bg-red-500/10'}`}
                    >
                      {g.score}
                    </div>
                  </div>
                  
                  <div className="bg-black/10 dark:bg-white/5 p-4 rounded-xl flex-1 mt-2 border border-glass-border">
                    <p className="text-xs font-semibold text-muted mb-2 flex items-center gap-2">
                      <Eye className="w-3 h-3 text-purple-400" /> Catatan Temuan & Evaluasi
                    </p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{g.notes}</p>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        )}
      </div>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Input Hasil Mystery Guest</h2>
              <p className="text-sm text-muted mt-1">Formulir evaluasi pelayanan cabang dari kunjungan rahasia</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Cabang yang Dievaluasi</label>
                  <select required value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500">
                    <option value="" disabled>Pilih Cabang...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Tanggal Kunjungan</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500 [color-scheme:dark]" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Total Skor (0 - 100)
                </label>
                <input 
                  type="number" 
                  min="0" max="100"
                  required
                  value={form.score} 
                  onChange={e => setForm({...form, score: Number(e.target.value)})} 
                  className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground text-xl font-bold text-center outline-none focus:border-purple-500" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Catatan Evaluasi / Temuan Lapangan</label>
                <textarea 
                  required
                  value={form.notes} 
                  onChange={e => setForm({...form, notes: e.target.value})} 
                  className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500 min-h-[150px]" 
                  placeholder="Ceritakan detail pelayanan yang diterima, kecepatan respon CS, kebersihan lokasi, kesesuaian SOP, dll..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-glass-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-muted hover:text-white hover:bg-nav-hover transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-6 py-2.5 rounded-full text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-2">
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
