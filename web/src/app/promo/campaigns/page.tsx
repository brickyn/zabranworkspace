'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Gift, Loader2, Search, Plus, Trash2, ArrowLeft, Play, Pause, Edit2, Store, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PromoCampaignsPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCampaign, setSearchCampaign] = useState('');
  const [filterBranchCampaign, setFilterBranchCampaign] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const initialForm = {
    name: '', voucherCode: '', startDate: '', endDate: '',
    discountRp: '', discountPct: '', minPurchase: '', maxDiscount: '', maxUsage: '', branchId: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState(initialForm);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const [promoRes, branchRes] = await Promise.all([
        apiClient.get('/promos'),
        apiClient.get('/branches')
      ]);
      if (promoRes.data.success) setPromos(promoRes.data.data);
      if (branchRes.data.success) setBranches(branchRes.data.data);
    } catch (error) {
      toast.error('Gagal mengambil data kampanye');
    } finally {
      setLoading(false);
    }
  };

  const filteredPromos = promos.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchCampaign.toLowerCase()) || (p.voucherCode && p.voucherCode.toLowerCase().includes(searchCampaign.toLowerCase()));
    const matchBranch = filterBranchCampaign === 'all' || p.branchId === filterBranchCampaign || (filterBranchCampaign === 'all_branch' && !p.branchId);
    return matchSearch && matchBranch;
  });

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/promos', {
        ...formData,
        voucherCode: formData.voucherCode.toUpperCase(),
        branchId: formData.branchId || null
      });
      toast.success('Kampanye berhasil dibuat');
      setShowModal(false);
      setFormData(initialForm);
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan kampanye');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (promo: any) => {
    setEditId(promo.id);
    setEditData({
      name: promo.name,
      voucherCode: promo.voucherCode || '',
      startDate: new Date(promo.startDate).toISOString().split('T')[0],
      endDate: new Date(promo.endDate).toISOString().split('T')[0],
      discountRp: promo.discountRp || '',
      discountPct: promo.discountPct || '',
      minPurchase: promo.minPurchase || '',
      maxDiscount: promo.maxDiscount || '',
      maxUsage: promo.maxUsage || '',
      branchId: promo.branchId || ''
    });
    setEditModal(true);
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.patch(`/promos/${editId}`, {
        ...editData,
        voucherCode: editData.voucherCode.toUpperCase(),
        branchId: editData.branchId || null
      });
      toast.success('Kampanye berhasil diupdate');
      setEditModal(false);
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal update kampanye');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus kampanye ini?')) return;
    try {
      await apiClient.delete(`/promos/${id}`);
      toast.success('Kampanye dihapus');
      fetchCampaigns();
    } catch (error) {
      toast.error('Gagal menghapus kampanye');
    }
  };

  const handleToggleCampaign = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/promos/${id}`, { isActive: !currentStatus });
      toast.success(`Kampanye di${!currentStatus ? 'aktifkan' : 'nonaktifkan'}`);
      fetchCampaigns();
    } catch (error) {
      toast.error('Gagal merubah status kampanye');
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-glass-bg p-6 rounded-2xl border border-glass-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/promo" className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Kampanye & Voucher</h1>
            </div>
            <p className="text-muted text-sm ml-10">Kelola voucher promo dan diskon global/cabang.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full transition-all text-sm font-medium shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            Buat Kampanye
          </button>
        </motion.div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mt-2">
          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type="text" 
                placeholder="Cari Kampanye atau Kode..."
                value={searchCampaign}
                onChange={e => setSearchCampaign(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <select
              value={filterBranchCampaign}
              onChange={(e) => setFilterBranchCampaign(e.target.value)}
              className="bg-glass-bg border border-glass-border text-foreground text-sm rounded-xl px-3 py-2 outline-none focus:border-purple-500"
            >
              <option value="all">Semua Cabang (Filter)</option>
              <option value="all_branch">Berlaku Global</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPromos.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted">Belum ada kampanye promo.</div>
            ) : (
              filteredPromos.map((promo) => (
                <div key={promo.id} className={`bg-glass-bg border p-6 rounded-3xl transition-all relative overflow-hidden group ${promo.isActive ? 'border-purple-500/30 shadow-lg shadow-purple-500/5' : 'border-glass-border opacity-70'}`}>
                  
                  {promo.isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>}
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{promo.name}</h3>
                      {promo.voucherCode ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-500 border border-purple-500/30 rounded-lg text-sm font-mono font-bold tracking-wider">
                          <Gift className="w-4 h-4" /> {promo.voucherCode}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-black/10 dark:bg-white/10 text-muted rounded text-xs font-semibold">Otomatis / Tanpa Kode</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => handleToggleCampaign(promo.id, promo.isActive)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${promo.isActive ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30' : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'}`} title={promo.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                        {promo.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEditModal(promo)} className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 flex items-center justify-center transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteCampaign(promo.id)} className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                    <div className="bg-glass-bg/50 p-3 rounded-xl border border-glass-border space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Store className="w-4 h-4" /> {promo.branch?.name || 'Berlaku Global (Semua)'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Calendar className="w-4 h-4" /> 
                        {new Date(promo.startDate).toLocaleDateString('id-ID', { day:'numeric', month:'short' })} - {new Date(promo.endDate).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
                      </div>
                    </div>
                    <div className="bg-glass-bg/50 p-3 rounded-xl border border-glass-border space-y-2">
                      {promo.discountRp > 0 && (
                        <div className="flex justify-between text-sm"><span className="text-muted">Diskon</span><span className="text-white font-bold text-purple-400">{formatRupiah(promo.discountRp)}</span></div>
                      )}
                      {promo.discountPct > 0 && (
                        <div className="flex justify-between text-sm"><span className="text-muted">Diskon %</span><span className="text-white font-bold text-purple-400">{promo.discountPct}% {promo.maxDiscount ? `(Max ${formatRupiah(promo.maxDiscount)})` : ''}</span></div>
                      )}
                      <div className="flex justify-between text-sm"><span className="text-muted">Min Pembelian</span><span className="text-white">{formatRupiah(promo.minPurchase)}</span></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-glass-border flex justify-between items-center text-xs text-muted relative z-10">
                    <span>Terpakai: {promo.usageCount} {promo.maxUsage ? `/ ${promo.maxUsage}` : ''}</span>
                    <span className={!promo.isActive ? 'text-red-400' : 'text-green-400 font-bold'}>{promo.isActive ? 'Sedang Aktif' : 'Tidak Aktif'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Form Kampanye */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0B0C10] border border-glass-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-glass-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Buat Kampanye / Voucher</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground transition-colors">✕</button>
            </div>
            <form onSubmit={handleCampaignSubmit}>
              {/* Form implementation is identical to the provided one */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm text-muted">Nama Kampanye <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Misal: Promo Akhir Tahun" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm text-muted">Cabang (Kosongkan jika untuk semua cabang)</label>
                  <select value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500">
                    <option value="">Semua Cabang (Global)</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Kode Voucher (Opsional)</label>
                  <input type="text" value={formData.voucherCode} onChange={e => setFormData({...formData, voucherCode: e.target.value.toUpperCase()})} placeholder="Misal: YEAREND2026" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Min. Pembelian (Rp)</label>
                  <input type="number" min="0" value={formData.minPurchase} onChange={e => setFormData({...formData, minPurchase: e.target.value})} placeholder="0" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Tanggal Mulai <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500 [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Tanggal Berakhir <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500 [color-scheme:dark]" />
                </div>
                <div className="md:col-span-2 pt-4 border-t border-glass-border">
                  <p className="text-sm font-medium text-foreground mb-4">Tipe Diskon (Pilih Salah Satu)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Diskon Nominal (Rp)</label>
                  <input type="number" min="0" value={formData.discountRp} onChange={e => setFormData({...formData, discountRp: e.target.value, discountPct: ''})} placeholder="0" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" disabled={!!formData.discountPct} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Diskon Persentase (%)</label>
                  <input type="number" min="0" max="100" value={formData.discountPct} onChange={e => setFormData({...formData, discountPct: e.target.value, discountRp: ''})} placeholder="0" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" disabled={!!formData.discountRp} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Max Diskon (Rp) *Jika %</label>
                  <input type="number" min="0" value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: e.target.value})} placeholder="Opsional" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" disabled={!formData.discountPct} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Maksimal Pemakaian (Kuota)</label>
                  <input type="number" min="0" value={formData.maxUsage} onChange={e => setFormData({...formData, maxUsage: e.target.value})} placeholder="Opsional, misal: 100" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" />
                </div>
              </div>
              <div className="p-6 border-t border-glass-border flex justify-end gap-3 bg-black/20">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-muted hover:text-foreground hover:bg-nav-hover transition-colors font-medium">Batal</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Kampanye
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal (same implementation) */}
      {editModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0B0C10] border border-glass-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-glass-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Edit Kampanye / Voucher</h2>
              <button onClick={() => setEditModal(false)} className="text-muted hover:text-foreground transition-colors">✕</button>
            </div>
            <form onSubmit={handleUpdateCampaign}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm text-muted">Nama Kampanye <span className="text-red-500">*</span></label>
                  <input type="text" required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Misal: Promo Akhir Tahun" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm text-muted">Cabang (Kosongkan jika untuk semua cabang)</label>
                  <select value={editData.branchId} onChange={e => setEditData({...editData, branchId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500">
                    <option value="">Semua Cabang (Global)</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Kode Voucher (Opsional)</label>
                  <input type="text" value={editData.voucherCode} onChange={e => setEditData({...editData, voucherCode: e.target.value.toUpperCase()})} placeholder="Misal: YEAREND2026" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Min. Pembelian (Rp)</label>
                  <input type="number" min="0" value={editData.minPurchase} onChange={e => setEditData({...editData, minPurchase: e.target.value})} placeholder="0" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Tanggal Mulai <span className="text-red-500">*</span></label>
                  <input type="date" required value={editData.startDate} onChange={e => setEditData({...editData, startDate: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500 [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Tanggal Berakhir <span className="text-red-500">*</span></label>
                  <input type="date" required value={editData.endDate} onChange={e => setEditData({...editData, endDate: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500 [color-scheme:dark]" />
                </div>
                <div className="md:col-span-2 pt-4 border-t border-glass-border">
                  <p className="text-sm font-medium text-foreground mb-4">Tipe Diskon (Pilih Salah Satu)</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Diskon Nominal (Rp)</label>
                  <input type="number" min="0" value={editData.discountRp} onChange={e => setEditData({...editData, discountRp: e.target.value, discountPct: ''})} placeholder="0" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" disabled={!!editData.discountPct} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Diskon Persentase (%)</label>
                  <input type="number" min="0" max="100" value={editData.discountPct} onChange={e => setEditData({...editData, discountPct: e.target.value, discountRp: ''})} placeholder="0" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" disabled={!!editData.discountRp} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Max Diskon (Rp) *Jika %</label>
                  <input type="number" min="0" value={editData.maxDiscount} onChange={e => setEditData({...editData, maxDiscount: e.target.value})} placeholder="Opsional" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" disabled={!editData.discountPct} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Maksimal Pemakaian (Kuota)</label>
                  <input type="number" min="0" value={editData.maxUsage} onChange={e => setEditData({...editData, maxUsage: e.target.value})} placeholder="Opsional, misal: 100" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-purple-500" />
                </div>
              </div>
              <div className="p-6 border-t border-glass-border flex justify-end gap-3 bg-black/20">
                <button type="button" onClick={() => setEditModal(false)} className="px-5 py-2.5 rounded-xl text-muted hover:text-foreground hover:bg-nav-hover transition-colors font-medium">Batal</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
