'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function B2BTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({ partnerId: '', type: 'Barang', itemName: '', qty: 1, amount: '', date: '', contractPeriod: '', paymentMethod: 'Lunas - Cash', paymentDetails: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filterPeriod, setFilterPeriod] = useState('month'); 

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
      const res = await apiClient.get(`/b2b/transactions${query}`);
      setTransactions(res.data.data || []);
    } catch (error) {
      toast.error('Gagal mengambil data transaksi B2B');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/b2b/transactions', {
        ...transactionForm,
        picName: currentUser?.name || 'Admin',
      });
      toast.success('Transaksi B2B berhasil dicatat');
      setShowTransactionModal(false);
      setTransactionForm({ partnerId: '', type: 'Barang', itemName: '', qty: 1, amount: '', date: '', contractPeriod: '', paymentMethod: 'Lunas - Cash', paymentDetails: '' });
      fetchData();
    } catch (error) {
      toast.error('Gagal mencatat transaksi');
    } finally {
      setFormLoading(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
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
              <h1 className="text-2xl font-bold text-foreground">Transaksi B2B</h1>
            </div>
            <p className="text-muted text-sm ml-10">Kelola transaksi dan kesepakatan dengan instansi.</p>
          </div>
          
          <button 
            onClick={() => setShowTransactionModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full transition-all text-sm font-medium shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Catat Transaksi B2B
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
                    <th className="px-6 py-4 font-semibold">Klien / Partner</th>
                    <th className="px-6 py-4 font-semibold">Jenis Penjualan</th>
                    <th className="px-6 py-4 font-semibold">Detail (Item)</th>
                    <th className="px-6 py-4 font-semibold">Qty</th>
                    <th className="px-6 py-4 font-semibold text-right">Nilai (Rp)</th>
                    <th className="px-6 py-4 font-semibold">PIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada transaksi B2B di periode ini</td></tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-nav-hover transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {t.partner?.company || t.partner?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.type === 'Barang' ? 'bg-blue-500/20 text-blue-500' : 
                            t.type === 'Jasa' ? 'bg-purple-500/20 text-purple-500' : 
                            'bg-orange-500/20 text-orange-500'
                          }`}>
                            {t.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted max-w-xs truncate">{t.itemName || '-'}</td>
                        <td className="px-6 py-4 text-foreground">{t.qty}</td>
                        <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-medium">{formatRupiah(t.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{t.picName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-glass-bg border border-glass-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-glass-border">
              <h2 className="text-xl font-bold text-foreground">Catat Transaksi B2B</h2>
              <p className="text-sm text-muted mt-1">Masukkan data closing penjualan atau investasi B2B</p>
            </div>
            
            <form onSubmit={handleCreateTransaction} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Partner / Instansi</label>
                  <select required value={transactionForm.partnerId} onChange={e => setTransactionForm({...transactionForm, partnerId: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                    <option value="" disabled>Pilih Partner...</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.company}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Jenis Penjualan</label>
                  <select required value={transactionForm.type} onChange={e => setTransactionForm({...transactionForm, type: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                    <option value="Barang">Penjualan Barang (Unit Laptop dll)</option>
                    <option value="Jasa">Jasa (Service/Sewa/Web)</option>
                    <option value="Investasi">Investasi / Pendanaan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Tanggal Transaksi</label>
                  <input type="date" required value={transactionForm.date} onChange={e => setTransactionForm({...transactionForm, date: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 [color-scheme:dark]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Periode Kontrak (Opsional)</label>
                  <input type="text" value={transactionForm.contractPeriod} onChange={e => setTransactionForm({...transactionForm, contractPeriod: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="Misal: 6 Bulan, 1 Tahun" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Nama Barang / Deskripsi Project</label>
                <input type="text" required value={transactionForm.itemName} onChange={e => setTransactionForm({...transactionForm, itemName: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="Misal: 10 Unit Laptop Thinkpad, Jasa Web Zboard..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Jumlah (Qty)</label>
                  <input type="number" required value={transactionForm.qty} onChange={e => setTransactionForm({...transactionForm, qty: Number(e.target.value)})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" min="1" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Total Nilai / Omzet (Rp)</label>
                  <input type="number" required value={transactionForm.amount} onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="50000000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Metode Pembayaran</label>
                  <select required value={transactionForm.paymentMethod} onChange={e => setTransactionForm({...transactionForm, paymentMethod: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                    <option value="Lunas - Cash">Lunas - Cash</option>
                    <option value="Lunas - Transfer">Lunas - Transfer</option>
                    <option value="Termin / DP">Termin / DP</option>
                    <option value="Tempo">Tempo (Piutang)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Detail Pembayaran (Opsional)</label>
                  <input type="text" value={transactionForm.paymentDetails} onChange={e => setTransactionForm({...transactionForm, paymentDetails: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="Misal: DP 30% sisa lunas bulan depan" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-glass-border">
                <button type="button" onClick={() => setShowTransactionModal(false)} className="px-6 py-2.5 rounded-full text-sm font-medium text-muted hover:text-foreground hover:bg-nav-hover transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-6 py-2.5 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
