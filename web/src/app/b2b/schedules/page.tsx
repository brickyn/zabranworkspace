'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Loader2, ArrowLeft, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function B2BSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ partnerId: '', targetName: '', title: '', startDate: '', endDate: '', notes: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Filters
  const [scheduleFilter, setScheduleFilter] = useState('all'); 
  const [viewMode, setViewMode] = useState<'list'|'calendar'>('list');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch(e) {}
    }
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await apiClient.get('/b2b/partners');
      setPartners(res.data.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
  }, [scheduleFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = '';
      if (scheduleFilter === 'hari-ini') {
        const today = new Date();
        const start = new Date(today.setHours(0,0,0,0)).toISOString();
        const end = new Date(today.setHours(23,59,59,999)).toISOString();
        query = `?startDate=${start}&endDate=${end}`;
      } else if (scheduleFilter === 'minggu-ini') {
        const today = new Date();
        const first = today.getDate() - today.getDay();
        const start = new Date(new Date().setDate(first)).toISOString();
        const end = new Date(new Date().setDate(first + 6)).toISOString();
        query = `?startDate=${start}&endDate=${end}`;
      }
      const res = await apiClient.get(`/b2b/schedules${query}`);
      setSchedules(res.data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data jadwal B2B');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/b2b/schedules', {
        ...scheduleForm,
        picName: currentUser?.name || 'Admin',
      });
      toast.success('Jadwal berhasil ditambahkan');
      setShowScheduleModal(false);
      setScheduleForm({ partnerId: '', targetName: '', title: '', startDate: '', endDate: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error('Gagal menambah jadwal');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateScheduleStatus = async (id: string, status: string) => {
    try {
      await apiClient.put(`/b2b/schedules/${id}`, { status });
      toast.success('Status jadwal diupdate');
      fetchData();
    } catch (error) {
      toast.error('Gagal update status');
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="flex justify-between items-center bg-glass-bg p-6 rounded-2xl border border-glass-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/b2b" className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Jadwal Kunjungan & Meeting</h1>
            </div>
            <p className="text-muted text-sm ml-10">Atur agenda visitasi dan presentasi ke klien.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full transition-all text-sm font-medium shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Tambah Jadwal
            </button>
          </div>
        </motion.div>

        {/* Filter Period */}
        <div className="flex justify-between items-center px-2">
          <div className="flex bg-black/5 dark:bg-white/5 rounded-full p-1 border border-glass-border">
            <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-glass-bg shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>List View</button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-glass-bg shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}>Calendar View</button>
          </div>
          <select 
            value={scheduleFilter} 
            onChange={(e) => setScheduleFilter(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-glass-border text-gray-900 dark:text-white text-sm rounded-full px-4 py-2 outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Jadwal</option>
            <option value="hari-ini">Hari Ini</option>
            <option value="minggu-ini">Minggu Ini</option>
          </select>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted">Tidak ada jadwal ditemukan.</div>
                ) : (
                  schedules.map((s) => (
                    <GlassCard key={s.id} className="p-5 border-l-4 border-l-blue-500 hover:bg-nav-hover transition-colors group">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-foreground truncate pr-4">{s.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase whitespace-nowrap ${s.status === 'Selesai' ? 'bg-green-500/20 text-green-500' : s.status === 'Gagal' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                          {s.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <MapPin className="w-4 h-4 text-orange-400" />
                          <span className="truncate">{s.targetName || s.partner?.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span>{formatDateTime(s.startDate)}</span>
                        </div>
                      </div>

                      {s.notes && (
                        <p className="text-xs text-muted/70 bg-black/10 dark:bg-white/5 p-2 rounded-lg mb-4 line-clamp-2">
                          {s.notes}
                        </p>
                      )}

                      <div className="flex justify-between items-center mt-auto border-t border-glass-border pt-4">
                        <span className="text-xs text-muted">PIC: <span className="text-foreground">{s.picName}</span></span>
                        
                        {s.status === 'Belum Visit' && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleUpdateScheduleStatus(s.id, 'Selesai')} className="text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 px-3 py-1.5 rounded-full font-medium transition-colors">Selesai</button>
                            <button onClick={() => handleUpdateScheduleStatus(s.id, 'Gagal')} className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-full font-medium transition-colors">Batal</button>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            ) : (
              <GlassCard className="p-8 text-center min-h-[400px] flex flex-col justify-center items-center">
                <CalendarIcon className="w-12 h-12 text-muted mb-4" />
                <h3 className="text-lg font-medium text-foreground">Calendar View Sedang Dalam Pengembangan</h3>
                <p className="text-sm text-muted">Fitur ini akan segera tersedia di update berikutnya.</p>
                <button onClick={() => setViewMode('list')} className="mt-4 text-blue-500 text-sm font-semibold hover:underline">Kembali ke List View</button>
              </GlassCard>
            )}
          </>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-glass-bg border border-glass-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-glass-border">
              <h2 className="text-xl font-bold text-foreground">Tambah Jadwal B2B</h2>
              <p className="text-sm text-muted mt-1">Atur agenda kunjungan atau meeting dengan klien</p>
            </div>
            
            <form onSubmit={handleCreateSchedule} className="p-6 md:p-8 space-y-6">
              
              <div className="space-y-4 bg-glass-bg p-4 rounded-xl border border-glass-border">
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="radio" name="targetTypeSched" checked={!!scheduleForm.partnerId || !scheduleForm.targetName} onChange={() => setScheduleForm({...scheduleForm, targetName: ''})} />
                    Partner Terdaftar
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="radio" name="targetTypeSched" checked={!scheduleForm.partnerId && !!scheduleForm.targetName} onChange={() => setScheduleForm({...scheduleForm, partnerId: '', targetName: 'Prospek Baru'})} />
                    Prospek Baru
                  </label>
                </div>
                
                {!!scheduleForm.partnerId || !scheduleForm.targetName ? (
                  <div className="space-y-2">
                    <select required value={scheduleForm.partnerId} onChange={e => setScheduleForm({...scheduleForm, partnerId: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                      <option value="" disabled>Pilih Partner...</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.company}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input type="text" required value={scheduleForm.targetName} onChange={e => setScheduleForm({...scheduleForm, targetName: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="Nama Instansi/Perusahaan..." />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Judul / Agenda Utama</label>
                <input type="text" required value={scheduleForm.title} onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="Misal: Presentasi Lab Zboard di Univ XYZ" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Mulai</label>
                  <input type="datetime-local" required value={scheduleForm.startDate} onChange={e => setScheduleForm({...scheduleForm, startDate: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 [color-scheme:dark]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Selesai</label>
                  <input type="datetime-local" required value={scheduleForm.endDate} onChange={e => setScheduleForm({...scheduleForm, endDate: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 [color-scheme:dark]" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Catatan Tambahan (Opsional)</label>
                <textarea value={scheduleForm.notes} onChange={e => setScheduleForm({...scheduleForm, notes: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 min-h-[80px]" placeholder="Misal: Bawa contoh brosur dan proposal penawaran..."></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-glass-border">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-muted hover:text-foreground hover:bg-nav-hover transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-6 py-2.5 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
