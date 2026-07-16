'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Loader2, Upload, Wallet, Building2, Search, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SetorTunaiPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Balance
  const [balanceData, setBalanceData] = useState({ totalCashSales: 0, totalDeposits: 0, balance: 0 });

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form State
  const [formData, setFormData] = useState({ 
    branchId: '', 
    type: 'Setoran Tunai', 
    amount: '', 
    date: new Date().toISOString().split('T')[0],
    notes: '',
    picName: '',
    suratJalanUrl: '',
    buktiTransferUrl: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      
      const defaultBranch = ['Cashier', 'Leader', 'Manager', 'User'].includes(parsed.role) ? (parsed.branch_id || '') : '';
      setSelectedBranch(defaultBranch);
      fetchInitialData(defaultBranch);
    }
  }, []);

  const fetchInitialData = async (branchId: string) => {
    try {
      setLoading(true);
      const resBranches = await apiClient.get('/branches');
      if (resBranches.data.success) {
        setBranches(resBranches.data.data);
      }
      
      if (branchId) {
        await fetchBalance(branchId);
      }
      await fetchDeposits(branchId, selectedMonth, selectedYear);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeposits = async (branchId: string, month: number, year: number) => {
    try {
      const res = await apiClient.get(`/cash-management?branchId=${branchId}&month=${month}&year=${year}`);
      if (res.data.success) {
        // Only show types relevant to Setoran Tunai / Pencairan Marketplace
        const filtered = res.data.data.filter((d: any) => 
          ['Setoran Tunai', 'Pencairan E-commerce', 'Cash Penjualan'].includes(d.type)
        );
        setDeposits(filtered);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    }
  };

  const fetchBalance = async (branchId: string) => {
    if (!branchId) return;
    try {
      const res = await apiClient.get(`/cash-management/balance/${branchId}`);
      if (res.data.success) {
        setBalanceData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  useEffect(() => {
    if (user && selectedBranch) {
      fetchBalance(selectedBranch);
    }
    if (user) {
      fetchDeposits(selectedBranch, selectedMonth, selectedYear);
    }
  }, [selectedBranch, selectedMonth, selectedYear]);

  const handleAddClick = () => {
    setFormData({ 
      branchId: selectedBranch || branches[0]?.id || '', 
      type: 'Setoran Tunai', 
      amount: '', 
      date: new Date().toISOString().split('T')[0],
      notes: '',
      picName: user?.name || '',
      suratJalanUrl: '',
      buktiTransferUrl: ''
    });
    setFormOpen(true);
  };

  // Convert file to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'suratJalanUrl' | 'buktiTransferUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId || !formData.amount) {
      toast.error('Branch and Amount are required');
      return;
    }

    setFormLoading(true);
    try {
      const payload = { ...formData, amount: Number(formData.amount) };
      await apiClient.post('/cash-management', payload);
      toast.success('Setoran berhasil ditambahkan');
      setFormOpen(false);
      
      // Refresh
      fetchBalance(selectedBranch);
      fetchDeposits(selectedBranch, selectedMonth, selectedYear);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan setoran');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Laporan Setor Tunai</h1>
            <p className="text-muted text-sm">Kelola setoran tunai hasil penjualan dan pencairan e-commerce.</p>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Setoran
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-glass-bg p-4 rounded-2xl border border-glass-border backdrop-blur-sm flex items-center gap-3">
            <Building2 className="w-5 h-5 text-muted" />
            <select 
              value={selectedBranch} 
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={['Cashier', 'Leader', 'Manager', 'User'].includes(user?.role)}
              className="bg-transparent text-white text-sm outline-none w-full"
            >
              <option value="" className="bg-black">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-black">{b.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-glass-bg p-4 rounded-2xl border border-glass-border backdrop-blur-sm flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-white text-sm outline-none w-full"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i+1} value={i+1} className="bg-black">
                  {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-foreground text-sm outline-none border-l border-glass-border pl-3 ml-1"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y} className="bg-black">{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Balance Metric */}
        {selectedBranch && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border">
              <div className="text-muted text-sm font-medium mb-1">Total Cash Penjualan (POS)</div>
              <div className="text-2xl font-bold text-white">Rp {balanceData.totalCashSales.toLocaleString()}</div>
            </div>
            <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border">
              <div className="text-muted text-sm font-medium mb-1">Total Setoran Tunai</div>
              <div className="text-2xl font-bold text-green-400">Rp {balanceData.totalDeposits.toLocaleString()}</div>
            </div>
            <div className="bg-blue-600/20 p-5 rounded-2xl border border-blue-500/30">
              <div className="text-blue-300 text-sm font-medium mb-1">Saldo Belum Disetor</div>
              <div className="text-2xl font-bold text-white">Rp {balanceData.balance.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Branch</th>
                  <th className="px-6 py-4 font-medium">Jenis</th>
                  <th className="px-6 py-4 font-medium">PIC</th>
                  <th className="px-6 py-4 font-medium">Nominal</th>
                  <th className="px-6 py-4 font-medium">Lampiran</th>
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
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">Belum ada riwayat setoran</p>
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-nav-hover transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        {new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">{d.branch?.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-green-500/20 text-green-400 border-green-500/30">
                          {d.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{d.picName || '-'}</td>
                      <td className="px-6 py-4 font-medium text-white">Rp {d.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 flex gap-2">
                        {d.suratJalanUrl && (
                          <a href={d.suratJalanUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">S.Jalan</a>
                        )}
                        {d.buktiTransferUrl && (
                          <a href={d.buktiTransferUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">B.Transfer</a>
                        )}
                        {!d.suratJalanUrl && !d.buktiTransferUrl && <span className="text-gray-500">-</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-xl shadow-2xl my-8">
            <div className="p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Input Setoran Tunai</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Cabang *</label>
                    <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all appearance-none" disabled={['Cashier', 'Leader', 'Manager'].includes(user?.role)}>
                      <option value="">Pilih Cabang</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Tanggal *</label>
                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Jenis Setoran *</label>
                    <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all appearance-none">
                      <option value="Setoran Tunai">Setoran Tunai (Cash Penjualan)</option>
                      <option value="Pencairan E-commerce">Pencairan E-commerce</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">PIC Setoran *</label>
                    <input required type="text" value={formData.picName} onChange={e => setFormData({...formData, picName: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Jumlah Setoran (Rp) *</label>
                  <input required type="number" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" placeholder="Contoh: 1500000" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Foto Surat Jalan (Opsional)</label>
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'suratJalanUrl')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="w-full px-4 py-3 bg-glass-bg border border-dashed border-white/20 rounded-xl text-muted flex items-center justify-center gap-2 hover:border-blue-500 transition-colors">
                        <Upload className="w-4 h-4" />
                        {formData.suratJalanUrl ? 'Gambar Terpilih' : 'Upload File'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Foto Bukti Transfer *</label>
                    <div className="relative">
                      <input required type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'buktiTransferUrl')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="w-full px-4 py-3 bg-glass-bg border border-dashed border-white/20 rounded-xl text-muted flex items-center justify-center gap-2 hover:border-blue-500 transition-colors">
                        <Upload className="w-4 h-4" />
                        {formData.buktiTransferUrl ? 'Gambar Terpilih' : 'Upload File'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-sm text-muted ml-1">Catatan Tambahan (Opsional)</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all resize-none h-24" placeholder="Contoh: Setoran cash hari sabtu-minggu" />
                </div>
              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 rounded-b-3xl">
                <button type="button" onClick={() => setFormOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-white hover:bg-white/10 transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
