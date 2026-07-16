'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Wallet, Plus, Loader2, Trash2, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function CashManagementPage() {
  const [data, setData] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    amount: '',
    type: 'Setoran Tunai',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resCash, resBranch] = await Promise.all([
        apiClient.get('/cash-management', { params: { branchId: filterBranch, month: filterMonth, year: filterYear } }),
        apiClient.get('/branches')
      ]);
      
      if(resCash.data.success) setData(resCash.data.data);
      if(resBranch.data.success) {
        setBranches(resBranch.data.data);
        if(!formData.branchId && resBranch.data.data.length > 0) {
          setFormData(prev => ({ ...prev, branchId: resBranch.data.data[0].id }));
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil data mutasi kas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterBranch, filterMonth, filterYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/cash-management', formData);
      toast.success('Mutasi Kas berhasil dicatat');
      setShowModal(false);
      setFormData(prev => ({ ...prev, amount: '', notes: '' }));
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan mutasi kas');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('Yakin ingin menghapus mutasi ini?')) return;
    try {
      await apiClient.delete(`/cash-management/${id}`);
      toast.success('Mutasi dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus mutasi');
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        
        {/* Header */}
        <div className="bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Cash Management</h1>
            <p className="text-muted text-sm">Catat arus kas di luar penjualan (Setoran tunai, Kas Kecil, dll).</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Catat Mutasi Kas
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-2">
          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="flex-1 px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none text-sm">
            <option value="all">Semua Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none text-sm">
            {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>Bulan {i+1}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none text-sm">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Table Container */}
        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Cabang</th>
                  <th className="px-6 py-4 font-medium">Tipe Mutasi</th>
                  <th className="px-6 py-4 font-medium">Keterangan</th>
                  <th className="px-6 py-4 font-medium text-right">Nominal (Rp)</th>
                  <th className="px-6 py-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                      Memuat mutasi kas...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">Tidak ada catatan mutasi kas.</p>
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="hover:bg-nav-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{item.branch?.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-medium">{item.type}</span>
                      </td>
                      <td className="px-6 py-4">{item.notes || '-'}</td>
                      <td className="px-6 py-4 text-right font-medium text-blue-400">{formatRupiah(item.amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Input Mutasi Kas</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Cabang *</label>
                  <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Tanggal *</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Tipe Mutasi *</label>
                    <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
                      <option value="Setoran Tunai">Setoran Tunai</option>
                      <option value="Kas Kecil">Kas Kecil (Petty Cash)</option>
                      <option value="Pencairan Marketplace">Pencairan Marketplace</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Nominal (Rp) *</label>
                  <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Misal: 1000000" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Keterangan / Catatan</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Opsional" rows={2} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none"></textarea>
                </div>
              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 rounded-b-3xl">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2 transition-colors">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
