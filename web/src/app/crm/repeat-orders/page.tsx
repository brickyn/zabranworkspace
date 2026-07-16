'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  Users, Plus, Loader2, Calendar, Star, ShieldCheck, Trophy, Medal, Award
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import CRMFilter from '@/components/CRMFilter';

export default function RepeatOrdersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Filter
  const [filterBranch, setFilterBranch] = useState('');
  const [filterType, setFilterType] = useState('exact'); // exact, month, year, all
  const [filterExactDate, setFilterExactDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  // Forms
  const [form, setForm] = useState({ 
    customerName: '', phone: '', branchId: '', purchaseQty: 1, purchaseAmount: 0 
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch(e) {}
    }
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const bRes = await apiClient.get('/branches');
      setBranches(bRes.data.data);
      if (bRes.data.data.length > 0) {
        setForm(prev => ({ ...prev, branchId: bRes.data.data[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchData();
  }, [filterBranch, filterType, filterExactDate, filterMonth, filterYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBranch) params.append('branchId', filterBranch);
      
      if (filterType === 'exact' && filterExactDate) {
        params.append('startDate', filterExactDate);
        params.append('endDate', filterExactDate);
      } else if (filterType === 'month') {
        params.append('month', filterMonth.toString());
        params.append('year', filterYear.toString());
      } else if (filterType === 'year') {
        params.append('year', filterYear.toString());
      }
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get(`/crm/customers${query}`);
      // Filter hanya yang repeat order (total pembelian keseluruhan > 1 unit atau punya badge)
      const loyalCustomers = res.data.data.filter((c: any) => c.totalQty > 1 || c.badge !== '-');
      setCustomers(loyalCustomers);
    } catch (error) {
      toast.error('Gagal mengambil data laporan repeat order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.phone || !form.branchId) {
      toast.error('Mohon lengkapi Nama, No. Telp, dan Cabang!');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        ...form,
        purchaseDate: new Date().toISOString(),
        purchaseDetails: 'Repeat Order',
        isActive: true,
        picName: currentUser?.name || 'CRM Staff',
      };
      
      await apiClient.post('/crm/customers', payload);
      toast.success('Data Repeat Order berhasil ditambahkan');
      setForm(prev => ({ ...prev, customerName: '', phone: '', purchaseQty: 1, purchaseAmount: 0 }));
      fetchData(); // Reload data hari ini
    } catch (error) {
      toast.error('Gagal menyimpan data repeat order');
    } finally {
      setFormLoading(false);
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge?.toLowerCase()) {
      case 'platinum': return <Trophy className="w-4 h-4 text-gray-200 drop-shadow-md" />;
      case 'gold': return <Award className="w-4 h-4 text-yellow-400 drop-shadow-md" />;
      case 'silver': return <Medal className="w-4 h-4 text-muted drop-shadow-md" />;
      case 'bronze': return <ShieldCheck className="w-4 h-4 text-orange-400 drop-shadow-md" />;
      default: return null;
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-400" fill="currentColor" />
              Laporan Repeat Order & Customer Loyal
            </h1>
            <p className="text-muted text-sm">Lihat aktivitas belanja harian pelanggan yang sudah pernah membeli sebelumnya.</p>
          </div>
          <div>
            <CRMFilter 
              filterType={filterType} setFilterType={setFilterType}
              filterExactDate={filterExactDate} setFilterExactDate={setFilterExactDate}
              filterMonth={filterMonth} setFilterMonth={setFilterMonth}
              filterYear={filterYear} setFilterYear={setFilterYear}
              filterBranch={filterBranch} setFilterBranch={setFilterBranch}
              branches={branches}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-glass-bg border border-glass-border rounded-3xl p-6 backdrop-blur-sm shadow-xl sticky top-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-green-400" />
                Input Cepat Repeat Order
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Nama Customer *</label>
                  <input 
                    type="text" 
                    value={form.customerName}
                    onChange={e => setForm({...form, customerName: e.target.value})}
                    placeholder="Contoh: Zahra"
                    className="w-full bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Nomor Telepon *</label>
                  <input 
                    type="tel" 
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="Contoh: 08123..."
                    className="w-full bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Cabang / Brand *</label>
                  <select 
                    value={form.branchId}
                    onChange={e => setForm({...form, branchId: e.target.value})}
                    className="w-full bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500"
                    required
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Qty (Unit) *</label>
                    <input 
                      type="number" 
                      min="1"
                      value={form.purchaseQty}
                      onChange={e => setForm({...form, purchaseQty: Number(e.target.value)})}
                      className="w-full bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Nominal (Rp)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={form.purchaseAmount || ''}
                      onChange={e => setForm({...form, purchaseAmount: Number(e.target.value)})}
                      placeholder="Opsional"
                      className="w-full bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Repeat Order'}
                </button>
              </form>
            </div>
          </div>

          {/* Table Report */}
          <div className="lg:col-span-2">
            <div className="bg-glass-bg border border-glass-border rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
              <div className="p-5 border-b border-glass-border bg-glass-bg">
                <h3 className="text-white font-medium text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-400" /> 
                  Daftar Repeat Order
                </h3>
              </div>
              
              {loading ? (
                <div className="flex-1 flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-sm text-left text-muted">
                    <thead className="text-xs text-muted uppercase bg-white/5">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Pelanggan & Badge</th>
                        <th className="px-6 py-4 font-semibold">Cabang</th>
                        <th className="px-6 py-4 font-semibold">Transaksi Hari Ini</th>
                        <th className="px-6 py-4 font-semibold">Total Akumulasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border">
                      {customers.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-12 text-gray-500">Tidak ada repeat order pada tanggal ini.</td></tr>
                      ) : (
                        customers.map((c) => (
                          <tr key={c.id} className="hover:bg-nav-hover transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-white mb-1">{c.customerName}</div>
                              <div className="text-xs text-gray-500 font-mono mb-2">{c.phone}</div>
                              {c.badge !== '-' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                                  ${c.badge === 'Platinum' ? 'bg-gray-100 text-gray-800' : 
                                    c.badge === 'Gold' ? 'bg-yellow-500/20 text-yellow-500' : 
                                    c.badge === 'Silver' ? 'bg-gray-500/20 text-muted' : 
                                    'bg-orange-500/20 text-orange-400'}
                                `}>
                                  {getBadgeIcon(c.badge)} {c.badge}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-white">
                              {c.branch?.name || '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-blue-400 font-bold mb-0.5">{c.purchaseQty} Unit</div>
                              <div className="text-xs text-gray-500">{formatRupiah(c.purchaseAmount)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-green-400 font-bold mb-0.5">{c.totalQty} Unit Keseluruhan</div>
                              <div className="text-xs text-gray-500">{formatRupiah(c.totalAmount)}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
