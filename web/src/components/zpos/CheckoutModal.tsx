'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Tag, Megaphone, CheckCircle2, Loader2, Printer, PlusCircle } from 'lucide-react';
import { connectAndPrint, TransactionPrintData } from '../../utils/bluetoothPrinter';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/axios';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartTotal: number;
  cartItems: any[];
  branchId: string;
  onSuccess: (data?: any) => void;
}

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  cartTotal,
  cartItems,
  branchId,
  onSuccess 
}) => {
  // Step & Data State
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [transactionData, setTransactionData] = useState<any>(null);

  // Payment State
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // CRM State
  const [customerWA, setCustomerWA] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [csClosing, setCsClosing] = useState('');
  
  // Fail-safe State
  const [isWalkIn, setIsWalkIn] = useState(false);

  // API State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derived State
  const numericCash = parseInt(cashReceived.replace(/\D/g, ''), 10) || 0;
  const change = numericCash - cartTotal;

  // Effects
  useEffect(() => {
    if (isWalkIn) {
      setCustomerWA('00000000000');
      setCustomerName('Walk-in Customer');
      setLeadSource('OFFLINE');
    } else {
      setCustomerWA('');
      setCustomerName('');
      setLeadSource('');
    }
  }, [isWalkIn]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setTransactionData(null);
      setCashReceived('');
      setIsWalkIn(false);
      setCustomerWA('');
      setCustomerName('');
      setLeadSource('');
      setCsClosing('');
      setIsSubmitting(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Validation
  const isCrmValid = isWalkIn || (customerWA !== '' && customerName !== '' && leadSource !== '' && csClosing !== '');
  const isValid = change >= 0 && isCrmValid;

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setCashReceived(rawValue);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        cartItems,
        payment: { cartTotal, cashReceived: numericCash, change },
        customer: { phone: customerWA, name: customerName },
        crm: { source: leadSource, csId: csClosing },
        branchId
      };

      const res = await apiClient.post('/transactions/checkout', payload);

      if (res.data.success) {
        setTransactionData(res.data.data);
        setStep('success');
      } else {
        setErrorMessage(res.data.message || res.data.error || 'Terjadi kesalahan saat memproses transaksi.');
      }
    } catch (error: any) {
      console.error('[Checkout API Error]', error);
      setErrorMessage(error.response?.data?.error || error.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!transactionData) return;
    
    // Map data for printer utility
    const printData: TransactionPrintData = {
      transactionId: transactionData.id,
      date: new Date(transactionData.createdAt).toLocaleString('id-ID'),
      // Gunakan cartItems dari UI untuk memastikan nama barang tercetak dengan benar
      items: cartItems.map(item => ({
        name: item.name || item.productId || 'Produk',
        qty: item.qty || 1,
        price: item.price,
        subtotal: item.price * (item.qty || 1)
      })),
      total: transactionData.totalAmount,
      cash: numericCash,
      change: change,
      cashierName: transactionData.cashier?.name || 'Kasir',
      customerName: transactionData.customer?.name,
      leadSource: transactionData.leadSource,
      csName: csClosing
    };

    const res = await connectAndPrint(printData);
    if (!res.success) {
      toast.error(res.error || 'Gagal mencetak setruk.');
    } else {
      toast.success('Setruk berhasil dicetak!');
    }
  };

  const handleFinishTransaction = () => {
    onSuccess(transactionData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && step === 'form' && onClose()}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-4xl bg-glass-bg border border-glass-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border bg-black/20">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {step === 'form' ? 'Selesaikan Pembayaran' : 'Transaksi Berhasil'}
              </h2>
              {step === 'form' && (
                <button
                  onClick={() => !isSubmitting && onClose()}
                  disabled={isSubmitting}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Content: Form View */}
            {step === 'form' && (
              <form onSubmit={handleTransactionSubmit} className="overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                  
                  {/* Left Column - Payment Focus */}
                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
                        Total Tagihan
                      </label>
                      <div className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                        {formatRupiah(cartTotal)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
                        Uang Diterima
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">
                          Rp
                        </span>
                        <input
                          autoFocus
                          type="text"
                          disabled={isSubmitting}
                          value={cashReceived ? new Intl.NumberFormat('id-ID').format(parseInt(cashReceived)) : ''}
                          onChange={handleCashChange}
                          placeholder="0"
                          className="w-full bg-black/40 border border-glass-border rounded-xl py-5 pl-14 pr-6 text-4xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className={`p-6 rounded-xl border transition-colors duration-300 ${
                      !cashReceived ? 'bg-black/20 border-glass-border' : 
                      change >= 0 ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-rose-950/30 border-rose-500/30'
                    }`}>
                      <label className="block text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">
                        Kembalian
                      </label>
                      <div className={`text-3xl font-bold tracking-tight ${
                        !cashReceived ? 'text-slate-500' :
                        change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {cashReceived ? formatRupiah(change) : '-'}
                      </div>
                      {cashReceived && change < 0 && (
                        <div className="text-sm text-rose-400 mt-2 flex items-center gap-1.5">
                          <X className="w-4 h-4" /> Uang tidak cukup
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - CRM Focus */}
                  <div className="space-y-5 bg-black/20 p-6 rounded-xl border border-glass-border">
                    <div className="flex items-center justify-between pb-4 border-b border-glass-border/50">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Data Pelanggan</h3>
                        <p className="text-sm text-slate-400">Pencatatan CRM</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                          Pelanggan Anonim / Walk-in
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            disabled={isSubmitting}
                            checked={isWalkIn}
                            onChange={(e) => setIsWalkIn(e.target.checked)}
                          />
                          <div className={`block w-10 h-6 rounded-full transition-colors ${isWalkIn ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isWalkIn ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Nomor WhatsApp
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                            type="text"
                            disabled={isWalkIn || isSubmitting}
                            value={customerWA}
                            onChange={(e) => setCustomerWA(e.target.value)}
                            placeholder="08123456789"
                            className="w-full bg-black/40 border border-glass-border rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Nama Pelanggan
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                            type="text"
                            disabled={isWalkIn || isSubmitting}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-black/40 border border-glass-border rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Sumber Lead
                          </label>
                          <div className="relative">
                            <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                            <select
                              disabled={isWalkIn || isSubmitting}
                              value={leadSource}
                              onChange={(e) => setLeadSource(e.target.value)}
                              className="w-full bg-black/40 border border-glass-border rounded-lg py-3 pl-11 pr-10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <option value="" disabled className="bg-slate-900 text-slate-400">Pilih Sumber...</option>
                              <option value="OFFLINE" className="bg-slate-900">OFFLINE</option>
                              <option value="IG" className="bg-slate-900">Instagram</option>
                              <option value="TIKTOK" className="bg-slate-900">TikTok</option>
                              <option value="RELASI" className="bg-slate-900">Relasi / Referal</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            CS Closing
                          </label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                            <select
                              disabled={isSubmitting}
                              value={csClosing}
                              onChange={(e) => setCsClosing(e.target.value)}
                              className="w-full bg-black/40 border border-glass-border rounded-lg py-3 pl-11 pr-10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 transition-all"
                            >
                              <option value="" disabled className="bg-slate-900 text-slate-400">Pilih CS...</option>
                              <option value="CS_1" className="bg-slate-900">CS 1 (Budi)</option>
                              <option value="CS_2" className="bg-slate-900">CS 2 (Siti)</option>
                              <option value="CS_3" className="bg-slate-900">CS 3 (Agus)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-glass-border bg-black/40 flex flex-col gap-4">
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-sm font-medium"
                      >
                        {errorMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => !isSubmitting && onClose()}
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors mr-3 font-medium disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] min-w-[240px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Selesaikan Transaksi
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Content: Success View */}
            {step === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Transaksi Selesai!</h3>
                <p className="text-slate-400 mb-8 max-w-sm">
                  ID: <span className="font-mono text-slate-300">{transactionData?.id}</span>
                </p>

                <div className="w-full max-w-md bg-black/40 border border-glass-border rounded-2xl p-6 mb-10">
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Kembalian Pelanggan</p>
                  <p className="text-6xl font-black text-emerald-400 tracking-tighter drop-shadow-md">
                    {formatRupiah(change)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <button
                    onClick={handleFinishTransaction}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-glass-border bg-black/40 hover:bg-white/5 text-white font-medium transition-colors"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Transaksi Baru
                  </button>
                  <button
                    onClick={handlePrintReceipt}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                  >
                    <Printer className="w-5 h-5" />
                    Cetak Setruk
                  </button>
                </div>
              </motion.div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
