'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Loader2, PenTool, Plus, CheckCircle2, Search, Clock, Wrench } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function ServiceCenterPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '', customerName: '', customerPhone: '', deviceModel: '', issues: '', estimatedCost: '', downPayment: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resJobs, resBranches] = await Promise.all([
        apiClient.get('/service-center', { params: { branchId: filterBranch, status: filterStatus } }),
        apiClient.get('/branches')
      ]);
      if (resJobs.data.success) setJobs(resJobs.data.data);
      if (resBranches.data.success) {
        setBranches(resBranches.data.data);
        if(!formData.branchId && resBranches.data.data.length > 0) {
          setFormData(prev => ({...prev, branchId: resBranches.data.data[0].id}));
        }
      }
    } catch (error) {
      toast.error('Gagal memuat data service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterBranch, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/service-center', formData);
      toast.success('Tanda terima service berhasil dibuat');
      setShowModal(false);
      setFormData({ branchId: formData.branchId, customerName: '', customerPhone: '', deviceModel: '', issues: '', estimatedCost: '', downPayment: '', notes: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat tanda terima');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/service-center/${id}/status`, { status: newStatus });
      toast.success(`Status diubah menjadi ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Antrean': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Pengecekan': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Menunggu Sparepart': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Selesai': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Diambil': return 'bg-gray-500/10 text-muted border-gray-500/20';
      case 'Batal': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-muted border-gray-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header & Filter */}
        <div className="bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Service Center</h1>
            <p className="text-muted text-sm">Kelola tanda terima dan progres reparasi pelanggan.</p>
          </div>
          
          <div className="flex gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              <option value="all">Semua Status</option>
              <option value="Antrean">Antrean</option>
              <option value="Pengecekan">Pengecekan</option>
              <option value="Menunggu Sparepart">Menunggu Sparepart</option>
              <option value="Selesai">Selesai</option>
              <option value="Diambil">Diambil</option>
            </select>
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              <option value="all">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Tanda Terima Baru
            </button>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="flex-1 overflow-y-auto pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                <Wrench className="w-12 h-12 mb-4 opacity-50" />
                <p>Belum ada antrean service</p>
              </div>
            ) : jobs.map(job => (
              <div key={job.id} className="bg-glass-bg border border-glass-border p-6 rounded-3xl hover:bg-nav-hover transition-colors relative flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{job.customerName}</h3>
                    <p className="text-sm text-muted">{job.customerPhone}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6 flex-1">
                  <div className="bg-black/20 p-3 rounded-xl border border-glass-border">
                    <p className="text-xs text-muted mb-1">Perangkat</p>
                    <p className="font-medium text-white text-sm">{job.deviceModel}</p>
                  </div>
                  <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                    <p className="text-xs text-red-400/80 mb-1">Keluhan</p>
                    <p className="font-medium text-red-300 text-sm">{job.issues}</p>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-glass-border pt-3">
                    <span className="text-muted">Estimasi Biaya</span>
                    <span className="font-bold text-white">{formatRupiah(job.estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted">DP (Uang Muka)</span>
                    <span className="font-medium text-green-400">{formatRupiah(job.downPayment)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  {job.status === 'Antrean' && <button onClick={() => handleUpdateStatus(job.id, 'Pengecekan')} className="w-full py-2 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500 hover:text-white transition-colors">Mulai Cek</button>}
                  {job.status === 'Pengecekan' && <button onClick={() => handleUpdateStatus(job.id, 'Selesai')} className="w-full py-2 text-xs font-medium bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500 hover:text-white transition-colors">Tandai Selesai</button>}
                  {job.status === 'Selesai' && <button onClick={() => handleUpdateStatus(job.id, 'Diambil')} className="w-full py-2 text-xs font-medium bg-gray-500/20 text-muted rounded-xl hover:bg-gray-500 hover:text-white transition-colors">Diambil (Selesai)</button>}
                  {job.status !== 'Selesai' && job.status !== 'Diambil' && job.status !== 'Batal' && <button onClick={() => handleUpdateStatus(job.id, 'Batal')} className="w-full py-2 text-xs font-medium bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors">Batalkan</button>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-xl shadow-2xl">
            <div className="p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Buat Tanda Terima Service</h2>
              <p className="text-sm text-muted mt-1">Isi detail pelanggan dan perangkat yang diservis.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Nama Pelanggan *</label>
                    <input required type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">No. HP / WhatsApp *</label>
                    <input required type="text" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Model / Tipe Perangkat *</label>
                  <input required type="text" placeholder="Misal: Asus ROG Zephyrus G14" value={formData.deviceModel} onChange={e => setFormData({...formData, deviceModel: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Detail Keluhan / Kerusakan *</label>
                  <textarea required rows={3} placeholder="Misal: Layar kedap-kedip saat disentuh..." value={formData.issues} onChange={e => setFormData({...formData, issues: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none resize-none"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Estimasi Biaya (Rp)</label>
                    <input type="number" min="0" value={formData.estimatedCost} onChange={e => setFormData({...formData, estimatedCost: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">DP (Uang Muka) (Rp)</label>
                    <input type="number" min="0" value={formData.downPayment} onChange={e => setFormData({...formData, downPayment: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Pilih Cabang *</label>
                  <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 rounded-b-3xl">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Buat Tanda Terima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
