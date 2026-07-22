'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/axios';
import { printEndOfDay } from '../../utils/bluetoothPrinter';

interface CloseSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any; // The current session data
}

export const CloseSessionModal: React.FC<CloseSessionModalProps> = ({ isOpen, onClose, session }) => {
  const [actualCash, setActualCash] = useState<string>('');
  const [actualQris, setActualQris] = useState<string>('');
  const [actualTransfer, setActualTransfer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [result, setResult] = useState<any>(null); // To hold the API response with variances

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const parseNum = (val: string) => parseInt(val.replace(/\D/g, ''), 10) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCash && !actualQris && !actualTransfer) {
      setError('Masukkan setidaknya satu jumlah aktual.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.post('/sessions/close', {
        actualCash: parseNum(actualCash),
        actualQris: parseNum(actualQris),
        actualTransfer: parseNum(actualTransfer)
      });

      if (res.data.success) {
        toast.success('Sesi kasir berhasil ditutup!');
        // Keep the modal open but change view to Result
        setResult(res.data.data);
      } else {
        setError(res.data.error || res.data.message || 'Gagal menutup sesi.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = async () => {
    if (!result || !session) return;
    try {
      // Calculate variances based on actual vs expected
      const expected = session.expectedTotals || { cash: 0, qris: 0, transfer: 0 };
      const variances = {
        cash: result.actualCash - expected.cash,
        qris: result.actualQris - expected.qris,
        transfer: result.actualTransfer - expected.transfer
      };

      await printEndOfDay(result, expected, variances);
      toast.success('Struk EOD berhasil dicetak!');
    } catch (err: any) {
      toast.error('Gagal mencetak: ' + err.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={() => { if(!result) onClose(); }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-glass-bg border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            {/* View 1: Input Actuals */}
            {!result ? (
              <>
                <div className="p-8 text-center border-b border-glass-border bg-indigo-500/10 relative">
                  <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors">
                    ✕
                  </button>
                  <div className="w-16 h-16 mx-auto bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    <CheckCircle2 className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Tutup Shift Kasir</h2>
                  <p className="text-slate-400 mt-2 text-sm">
                    Lakukan <strong>Blind Close</strong>. Masukkan uang fisik dan mutasi akhir Anda secara aktual tanpa melihat sistem.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 mb-2">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <p>{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Total Uang Fisik (Cash)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                        <input
                          type="text"
                          autoFocus
                          value={actualCash ? new Intl.NumberFormat('id-ID').format(parseNum(actualCash)) : ''}
                          onChange={(e) => setActualCash(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-black/40 border border-glass-border rounded-xl py-3 pl-12 pr-4 text-xl font-bold text-white focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Total QRIS Masuk</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                        <input
                          type="text"
                          value={actualQris ? new Intl.NumberFormat('id-ID').format(parseNum(actualQris)) : ''}
                          onChange={(e) => setActualQris(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-black/40 border border-glass-border rounded-xl py-3 pl-12 pr-4 text-xl font-bold text-white focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Total Transfer Bank</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                        <input
                          type="text"
                          value={actualTransfer ? new Intl.NumberFormat('id-ID').format(parseNum(actualTransfer)) : ''}
                          onChange={(e) => setActualTransfer(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-black/40 border border-glass-border rounded-xl py-3 pl-12 pr-4 text-xl font-bold text-white focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Selesaikan Hitungan'}
                  </button>
                </form>
              </>
            ) : (
              // View 2: Result & Variance
              <div className="p-8 space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Sesi Ditutup</h2>
                  <p className="text-slate-400 mt-1 text-sm">Rekonsiliasi harian telah tersimpan</p>
                </div>

                <div className="space-y-4">
                  {/* Variance Cards */}
                  {[
                    { label: 'Tunai / Fisik', exp: session.expectedTotals?.cash, act: result.actualCash },
                    { label: 'QRIS', exp: session.expectedTotals?.qris, act: result.actualQris },
                    { label: 'Transfer', exp: session.expectedTotals?.transfer, act: result.actualTransfer }
                  ].map((item, idx) => {
                    const variance = (item.act || 0) - (item.exp || 0);
                    const isMinus = variance < 0;
                    const isPlus = variance > 0;
                    
                    return (
                      <div key={idx} className="p-4 rounded-xl bg-black/40 border border-glass-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-slate-300">{item.label}</span>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            variance === 0 ? 'bg-green-500/20 text-green-400' :
                            isMinus ? 'bg-rose-500/20 text-rose-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {variance === 0 ? 'BALANCE' : isMinus ? 'MINUS' : 'OVER'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Ekspektasi Sistem</p>
                            <p className="font-medium text-slate-300">{formatRupiah(item.exp || 0)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Hitungan Kasir</p>
                            <p className="font-medium text-slate-300">{formatRupiah(item.act || 0)}</p>
                          </div>
                        </div>
                        {variance !== 0 && (
                          <div className={`mt-3 pt-3 border-t border-glass-border flex justify-between font-bold ${isMinus ? 'text-rose-400' : 'text-yellow-400'}`}>
                            <span>Selisih:</span>
                            <span>{formatRupiah(variance)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-3 rounded-xl border border-glass-border text-white hover:bg-white/5 font-medium transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                  >
                    <FileText className="w-5 h-5" />
                    Cetak Struk EOD
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
