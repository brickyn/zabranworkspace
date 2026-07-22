'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/axios';

interface OpenSessionModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export const OpenSessionModal: React.FC<OpenSessionModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [startingCash, setStartingCash] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setStartingCash(rawValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startingCash) {
      setError('Modal awal wajib diisi (bisa 0).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const numericCash = parseInt(startingCash, 10) || 0;

      const res = await apiClient.post('/sessions/open', { startingCash: numericCash });

      if (res.data.success) {
        toast.success('Sesi kasir berhasil dibuka!');
        onSuccess();
      } else {
        setError(res.data.error || res.data.message || 'Gagal membuka sesi.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
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
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-glass-bg border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 text-center border-b border-glass-border bg-indigo-500/10 relative">
              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
              <div className="w-16 h-16 mx-auto bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] rotate-3">
                <Wallet className="w-8 h-8 text-indigo-400 -rotate-3" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Buka Shift Kasir</h2>
              <p className="text-slate-400 mt-2 text-sm">
                Masukkan modal awal fisik (uang receh) di dalam laci kasir saat ini.
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">
                  Modal Awal Laci
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">
                    Rp
                  </span>
                  <input
                    autoFocus
                    type="text"
                    disabled={isSubmitting}
                    value={startingCash ? new Intl.NumberFormat('id-ID').format(parseInt(startingCash)) : ''}
                    onChange={handleCashChange}
                    placeholder="0"
                    className="w-full bg-black/40 border border-glass-border rounded-xl py-4 pl-14 pr-6 text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !startingCash}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Buka Kasir'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
