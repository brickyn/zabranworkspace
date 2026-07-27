'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/axios';
import { Search, Loader2, FileText, Printer, X, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrinter from '@/components/Print/ReceiptPrinter';

const statusColor: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  void: 'bg-red-100 text-red-600',
  voided: 'bg-red-100 text-red-600',
  returned: 'bg-yellow-100 text-yellow-700',
};

export default function ZPOSTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Struk_${selectedTx?.id || 'Zabran'}`,
  });

  const fetchTransactions = async () => {
    try {
      const res = await apiClient.get('/zpos/transactions');
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memuat riwayat transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t =>
    t.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
          <p className="text-slate-500 text-sm mt-0.5">Point of Sales — klik baris untuk detail & cetak ulang nota</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID Transaksi / Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2.5 w-full md:w-80 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm text-center p-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Belum ada transaksi</h3>
          <p className="text-slate-500 mt-1 text-sm">Transaksi yang Anda buat akan muncul di sini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 font-semibold">No. Transaksi</th>
                  <th className="px-5 py-4 font-semibold">Tanggal</th>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Total</th>
                  <th className="px-5 py-4 font-semibold">Metode</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTx(t)}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-indigo-600 font-semibold text-xs">{t.id}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {format(new Date(t.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {t.customer?.name || t.customerName || 'Walk-in Customer'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {formatRp(t.totalAmount)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{t.paymentMethod}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[t.status] || 'bg-slate-100 text-slate-600'}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 inline-block transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTx(null)}>
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Detail Transaksi</h2>
                <p className="text-xs font-mono text-indigo-500 mt-0.5">{selectedTx.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Ulang
                </button>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-slate-400 mb-1">Tanggal</div>
                  <div className="font-semibold text-slate-800">
                    {format(new Date(selectedTx.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-slate-400 mb-1">Status</div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[selectedTx.status] || 'bg-slate-100 text-slate-600'}`}>
                    {selectedTx.status.toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-slate-400 mb-1">Customer</div>
                  <div className="font-semibold text-slate-800">
                    {selectedTx.customer?.name || selectedTx.customerName || 'Walk-in Customer'}
                  </div>
                  {(selectedTx.customer?.phone || selectedTx.customerPhone) && (
                    <div className="text-xs text-slate-500 mt-0.5">{selectedTx.customer?.phone || selectedTx.customerPhone}</div>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-slate-400 mb-1">Metode Bayar</div>
                  <div className="font-semibold text-slate-800">{selectedTx.paymentMethod}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Item Dibeli ({selectedTx.items?.length || 0})</h3>
                <div className="space-y-2">
                  {selectedTx.items?.map((item: any, idx: number) => {
                    const p = item.productItem?.product;
                    const productName = p ? `${p.brand || ''} ${p.name || ''} ${p.model || ''}`.trim() : (item.productName || item.productId);
                    const sn = item.productItem?.sn;
                    return (
                      <div key={idx} className="flex justify-between items-start bg-slate-50 rounded-xl p-3 text-sm">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{productName}</div>
                          {sn && <div className="text-xs text-slate-400 font-mono mt-0.5">SN: {sn}</div>}
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.qty}x @ {formatRp(item.sellingPrice)}
                            {item.discount > 0 && <span className="text-red-400 ml-2">- {formatRp(item.discount)} disc</span>}
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 ml-4">{formatRp(item.subtotal)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                {selectedTx.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Total Diskon</span>
                    <span>- {formatRp(selectedTx.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-slate-900">
                  <span>TOTAL</span>
                  <span className="text-indigo-600">{formatRp(selectedTx.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Receipt for re-print */}
      <div style={{ display: 'none' }}>
        <ReceiptPrinter ref={receiptRef} transaction={selectedTx} />
      </div>
    </div>
  );
}
