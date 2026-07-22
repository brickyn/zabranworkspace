'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Printer, XCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { VoidAuthModal } from '@/components/zpos/VoidAuthModal';
import { connectAndPrint, TransactionPrintData } from '@/utils/bluetoothPrinter';
import toast from 'react-hot-toast';

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Void Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      // Gunakan query params yang sesuai dengan API yang ada
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(dateFilter && { date: dateFilter })
      });

      const res = await fetch(`/api/transactions?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setTransactions(data.data);
        setTotalPages(data.meta?.totalPages || 1);
      } else {
        toast.error('Gagal mengambil data transaksi');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, search, dateFilter]);

  const handleReprint = async (trx: any) => {
    const printData: TransactionPrintData = {
      transactionId: trx.id,
      date: new Date(trx.createdAt).toLocaleString('id-ID'),
      items: trx.items?.map((item: any) => ({
        name: item.product?.name || 'Produk',
        qty: 1,
        price: item.sellingPrice,
        subtotal: item.subtotal
      })) || [],
      total: trx.totalAmount,
      cash: trx.splitPayments ? trx.splitPayments[0]?.amount : trx.totalAmount, // Fallback if cash isn't explicitly saved
      change: 0, // Fallback
      cashierName: trx.cashier?.name,
      customerName: trx.customer?.name,
      leadSource: trx.leadSource,
      csName: trx.notes ? trx.notes.split('|')[0] : ''
    };

    const res = await connectAndPrint(printData);
    if (!res.success) {
      toast.error(res.error || 'Gagal mencetak setruk.');
    } else {
      toast.success('Setruk berhasil dicetak!');
    }
  };

  const handleOpenVoidModal = (id: string) => {
    setSelectedTransactionId(id);
    setIsVoidModalOpen(true);
  };

  const handleVoidSuccess = () => {
    fetchTransactions(); // Refresh table
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Riwayat Transaksi</h1>
            <p className="text-slate-400 mt-1">Kelola dan pantau seluruh transaksi POS</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Cari ID / Pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 bg-glass-bg border border-glass-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-48 bg-glass-bg border border-glass-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-glass-bg border border-glass-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-black/40 text-slate-400 font-medium uppercase tracking-wider text-xs border-b border-glass-border">
                <tr>
                  <th className="px-6 py-4">ID Transaksi</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-300">{trx.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(trx.createdAt).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">{trx.customer?.name || 'Walk-in'}</td>
                      <td className="px-6 py-4 font-medium text-white">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(trx.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        {trx.status === 'void' || trx.status === 'voided' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            VOID
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            SUCCESS
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleReprint(trx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-glass-border text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Reprint</span>
                        </button>
                        
                        {(trx.status !== 'void' && trx.status !== 'voided') && (
                          <button
                            onClick={() => handleOpenVoidModal(trx.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> <span className="hidden sm:inline">Void</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-glass-border bg-black/20 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg bg-glass-bg border border-glass-border text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-glass-bg border border-glass-border text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedTransactionId && (
        <VoidAuthModal 
          isOpen={isVoidModalOpen} 
          onClose={() => setIsVoidModalOpen(false)} 
          transactionId={selectedTransactionId}
          onSuccess={handleVoidSuccess}
        />
      )}
    </div>
  );
}
