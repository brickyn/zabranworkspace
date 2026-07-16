import React, { useState, useEffect } from 'react';
import { ShoppingCart, Banknote, Clock, LogOut, FileText } from 'lucide-react';
import { CardSkeleton } from '../ui/Skeleton';
import { apiClient } from '@/lib/axios';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function CashierDashboard() {
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showEodModal, setShowEodModal] = useState(false);
  const [eodSummary, setEodSummary] = useState<any>(null);
  
  // EOD Form State
  const [actualCash, setActualCash] = useState('');
  const [actualTransfer, setActualTransfer] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingEod, setIsSubmittingEod] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get('/dashboard/cashier');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data dashboard kasir');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEod = async () => {
    try {
      const res = await apiClient.get('/pos/eod-summary');
      if (res.data.success) {
        setEodSummary(res.data.data);
        setShowEodModal(true);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil ringkasan End of Day');
    }
  };

  const handleSubmitEod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCash || !actualTransfer) {
      toast.error('Harap isi jumlah uang tunai dan transfer fisik (aktual).');
      return;
    }
    
    setIsSubmittingEod(true);
    try {
      const res = await apiClient.post('/pos/eod', {
        expectedCash: eodSummary.expectedCash,
        expectedTransfer: eodSummary.expectedTransfer,
        actualCash: Number(actualCash),
        actualTransfer: Number(actualTransfer),
        totalTransactions: eodSummary.totalTransactions,
        notes
      });
      if (res.data.success) {
        toast.success('End of Day (Tutup Shift) berhasil disimpan!');
        setShowEodModal(false);
        setActualCash('');
        setActualTransfer('');
        setNotes('');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan End of Day');
    } finally {
      setIsSubmittingEod(false);
    }
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cashier Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Ringkasan transaksi (Riwayat 7 Hari)</p>
        </div>
        <button
          onClick={handleOpenEod}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium shadow transition"
        >
          <LogOut className="w-5 h-5" />
          Tutup Shift (EOD)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Penjualan Hari Ini</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(data?.todaySales || 0)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transaksi Hari Ini</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{data?.todayTransactions || 0} Transaksi</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Omzet 7 Hari Terakhir</h4>
          <div className="h-64">
            {data?.history && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.history}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [formatRupiah(value), 'Omzet']} />
                  <Bar dataKey="omzet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
            <ShoppingCart className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h4 className="font-semibold mb-2 text-center text-gray-900 dark:text-white">Buka Point of Sales</h4>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">Mulai melayani pelanggan dan buat transaksi baru.</p>
          <a href="/pos" className="w-full text-center px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition font-bold">
            Buka Kasir POS
          </a>
        </div>
      </div>

      {/* EOD Modal */}
      {showEodModal && eodSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-xl shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b dark:border-gray-700 pb-3">Tutup Shift (End of Day)</h2>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-6 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total Transaksi</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{eodSummary.totalTransactions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ekspektasi Cash</p>
                <p className="font-bold text-green-600 text-lg">{formatRupiah(eodSummary.expectedCash)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ekspektasi Transfer</p>
                <p className="font-bold text-blue-600 text-lg">{formatRupiah(eodSummary.expectedTransfer)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitEod} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Uang Tunai Aktual (Di Laci) *
                  </label>
                  <input
                    type="number"
                    required
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: 1500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Transfer Aktual (Mutasi) *
                  </label>
                  <input
                    type="number"
                    required
                    value={actualTransfer}
                    onChange={(e) => setActualTransfer(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: 5000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  placeholder="Contoh: Ada kembalian kurang 500 perak"
                />
              </div>

              {actualCash && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Selisih Cash: {formatRupiah(Number(actualCash) - eodSummary.expectedCash)} 
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEodModal(false)}
                  className="px-5 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEod}
                  className="px-5 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-medium shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingEod ? 'Menyimpan...' : 'Submit EOD & Tutup Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
