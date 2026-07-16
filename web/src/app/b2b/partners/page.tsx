'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Loader2, ArrowLeft, Building, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function B2BPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ 
    name: '', company: '', category: 'Instansi/Perusahaan', contactName: '', contactPhone: '', email: '' 
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Filters
  const [filterPartnerCat, setFilterPartnerCat] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filterPartnerCat]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/b2b/partners');
      let data = res.data.data || [];
      if (filterPartnerCat !== 'all') {
        data = data.filter((p: any) => p.category === filterPartnerCat);
      }
      setPartners(data);
    } catch (error) {
      toast.error('Gagal mengambil data partner B2B');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/b2b/partners', partnerForm);
      toast.success('Partner berhasil ditambahkan');
      setShowPartnerModal(false);
      setPartnerForm({ name: '', company: '', category: 'Instansi/Perusahaan', contactName: '', contactPhone: '', email: '' });
      fetchData();
    } catch (error) {
      toast.error('Gagal menambah partner');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus partner ini? Semua data terkait mungkin ikut terhapus.')) return;
    try {
      await apiClient.delete(`/b2b/partners/${id}`);
      toast.success('Partner dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus partner');
    }
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
              <h1 className="text-2xl font-bold text-foreground">Partnership Aktif</h1>
            </div>
            <p className="text-muted text-sm ml-10">Daftar klien, sekolah, dan instansi yang bekerja sama.</p>
          </div>
          
          <button 
            onClick={() => setShowPartnerModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full transition-all text-sm font-medium shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Tambah Partner
          </button>
        </motion.div>

        {/* Filter Period */}
        <div className="flex justify-end px-2">
          <select 
            value={filterPartnerCat} 
            onChange={(e) => setFilterPartnerCat(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-glass-border text-gray-900 dark:text-white text-sm rounded-full px-4 py-2 outline-none focus:border-indigo-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="Instansi/Perusahaan">Instansi / Perusahaan</option>
            <option value="Kampus/Universitas">Kampus / Universitas</option>
            <option value="Sekolah">Sekolah</option>
          </select>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted">Belum ada partner terdaftar.</div>
            ) : (
              partners.map((p) => (
                <GlassCard key={p.id} className="p-6 flex flex-col hover:bg-nav-hover transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Building className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{p.company}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase border border-blue-500/20">
                          {p.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                        <Phone className="w-3 h-3 text-muted" />
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-0.5">PIC / Kontak</p>
                        <p className="text-sm font-medium text-foreground">{p.contactName || '-'} <span className="text-muted font-normal">({p.contactPhone || '-'})</span></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                        <Mail className="w-3 h-3 text-muted" />
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-0.5">Email</p>
                        <p className="text-sm font-medium text-foreground">{p.email || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-glass-border">
                    <span className="text-xs text-muted">Bergabung: {new Date(p.startDate).toLocaleDateString('id-ID')}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDeletePartner(p.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        )}
      </div>

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-glass-bg border border-glass-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-glass-border">
              <h2 className="text-xl font-bold text-foreground">Tambah Partner B2B</h2>
              <p className="text-sm text-muted mt-1">Daftarkan instansi atau perusahaan baru</p>
            </div>
            
            <form onSubmit={handleCreatePartner} className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-muted">Nama Instansi / Perusahaan</label>
                <input type="text" required value={partnerForm.company} onChange={e => setPartnerForm({...partnerForm, company: e.target.value, name: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="PT Teknologi Nusantara..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Kategori</label>
                <select required value={partnerForm.category} onChange={e => setPartnerForm({...partnerForm, category: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                  <option value="Instansi/Perusahaan">Instansi / Perusahaan</option>
                  <option value="Kampus/Universitas">Kampus / Universitas</option>
                  <option value="Sekolah">Sekolah (SMK/SMA)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Nama PIC (Kontak)</label>
                  <input type="text" value={partnerForm.contactName} onChange={e => setPartnerForm({...partnerForm, contactName: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="Budi Santoso" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">No. Telepon / WA</label>
                  <input type="text" value={partnerForm.contactPhone} onChange={e => setPartnerForm({...partnerForm, contactPhone: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="08123456789" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Email Perusahaan / PIC</label>
                <input type="email" value={partnerForm.email} onChange={e => setPartnerForm({...partnerForm, email: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="info@perusahaan.com" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-glass-border">
                <button type="button" onClick={() => setShowPartnerModal(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-muted hover:text-foreground hover:bg-nav-hover transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-6 py-2.5 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
