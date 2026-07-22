'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, FileText, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/axios';

interface VoidAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  onSuccess: () => void;
}

export const VoidAuthModal: React.FC<VoidAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  transactionId, 
  onSuccess 
}) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || !reason) {
      setError('PIN dan Alasan wajib diisi.');
      return;
    }
    if (pin.length < 4) {
      setError('PIN minimal 4 digit.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.post(`/transactions/${transactionId}/void`, {
        managerPin: pin,
        reason
      });

      if (res.data.success) {
        toast.success('Transaksi berhasil di-void!');
        onSuccess();
        onClose();
        // Reset state
        setPin('');
        setReason('');
      } else {
        setError(res.data.error || res.data.message || 'Otorisasi gagal.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Numpad handler for PIN
  const handleNumpad = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-glass-bg border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-glass-border bg-rose-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Otorisasi Void</h3>
                  <p className="text-xs text-rose-200/60 font-mono mt-0.5">ID: {transactionId}</p>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 mb-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PIN Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300 text-center uppercase tracking-widest">
                  PIN Manajer
                </label>
                <div className="flex justify-center gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-12 h-14 rounded-xl border flex items-center justify-center text-2xl font-bold transition-colors ${
                        i < pin.length 
                          ? 'bg-rose-500/20 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                          : 'bg-black/40 border-glass-border text-transparent'
                      }`}
                    >
                      {i < pin.length ? '•' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Numpad */}
              <div className="grid grid-cols-3 gap-2 px-4 py-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpad(num.toString())}
                    className="p-3 text-xl font-medium text-white hover:bg-white/10 rounded-xl transition-colors active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <div className="p-3"></div>
                <button
                  type="button"
                  onClick={() => handleNumpad('0')}
                  className="p-3 text-xl font-medium text-white hover:bg-white/10 rounded-xl transition-colors active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="p-3 text-xl font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Reason Textarea */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Alasan Pembatalan
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <textarea
                    rows={3}
                    disabled={isSubmitting}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Masukkan alasan detail void..."
                    className="w-full bg-black/40 border border-glass-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 placeholder:text-slate-600 resize-none"
                  />
                </div>
              </div>

              {/* Action */}
              <button
                type="submit"
                disabled={isSubmitting || pin.length < 4 || !reason}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Otorisasi & Void Transaksi'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
