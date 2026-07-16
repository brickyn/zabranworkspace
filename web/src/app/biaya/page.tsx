'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Wallet, Loader2, Trash2, Calendar, Building2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function BiayaOperasionalPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
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
    category: 'Operasional',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resExp, resBranch] = await Promise.all([
        apiClient.get('/expenses', { params: { branchId: filterBranch, month: filterMonth, year: filterYear } }),
        apiClient.get('/branches')
      ]);
      
      if(resExp.data.success) setExpenses(resExp.data.data);
      if(resBranch.data.success) {
        setBranches(resBranch.data.data);
        if(!formData.branchId && resBranch.data.data.length > 0) {
          setFormData(prev => ({ ...prev, branchId: resBranch.data.data[0].id }));
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil data pengeluaran');
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
      await apiClient.post('/expenses', formData);
      toast.success('Pengeluaran berhasil dicatat');
      setShowModal(false);
      setFormData(prev => ({ ...prev, amount: '', description: '' }));
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan data');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('Yakin ingin menghapus catatan ini?')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      toast.success('Berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus');
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        <div className="bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Biaya Operasional</h1>
            <p className="text-muted text-sm">Catat pengeluaran harian cabang (Listrik, Gaji, Sewa, dll).</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Catat Pengeluaran
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 flex gap-4">
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="flex-1 px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              <option value="all">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>Bulan {i+1}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400 uppercase font-bold mb-1">Total Biaya</p>
              <h2 className="text-xl font-bold text-red-400">{formatRupiah(totalExpense)}</h2>
            </div>
            <Wallet className="text-red-400 opacity-50 w-8 h-8" />
          </div>
        </div>

        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Cabang</th>
                  <th className="px-6 py-4 font-medium">Kategori</th>
                  <th className="px-6 py-4 font-medium">Deskripsi</th>
                  <th className="px-6 py-4 font-medium text-right">Nominal (Rp)</th>
                  <th className="px-6 py-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                      Memuat data...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">Tidak ada catatan pengeluaran bulan ini.</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-nav-hover transition-colors">
                      <td className="px-6 py-4">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 font-medium text-white">{exp.branch?.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-medium">{exp.category}</span>
                      </td>
                      <td className="px-6 py-4">{exp.description || '-'}</td>
                      <td className="px-6 py-4 font-bold text-red-400 text-right">{formatRupiah(exp.amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleDelete(exp.id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg">
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Catat Pengeluaran Baru</h2>
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
                    <label className="text-sm text-muted">Kategori *</label>
                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
                      <option value="Operasional">Operasional</option>
                      <option value="Gaji">Gaji / Insentif</option>
                      <option value="Listrik & Air">Listrik & Air</option>
                      <option value="Sewa">Sewa Tempat</option>
                      <option value="Ads & Marketing">Ads & Marketing</option>
                      <option value="Pengiriman/Packing">Pengiriman / Packing (BSB)</option>
                      <option value="Transport & Akomodasi">Transport & Akomodasi (B2B)</option>
                      <option value="Entertain Pitching">Entertain Pitching (B2B)</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Nominal (Rp) *</label>
                  <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Misal: 150000" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Keterangan / Deskripsi</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Misal: Beli ATK, Bayar listrik bulan Juli" rows={2} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none"></textarea>
                </div>
              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 rounded-b-3xl">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium flex items-center gap-2">
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
