'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Trash2, Loader2, Package, DollarSign } from 'lucide-react';

interface ImportVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (finalProducts: any[]) => void;
  initialProducts: any[];
  isSubmitting: boolean;
}

export default function ImportVerificationModal({
  open,
  onClose,
  onConfirm,
  initialProducts,
  isSubmitting
}: ImportVerificationModalProps) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    setItems(initialProducts || []);
  }, [initialProducts, open]);

  if (!open) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  const handleRemoveRow = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const totalUnits = items.reduce((acc, p) => acc + (Number(p.qty) || 1), 0);
  const totalModalValue = items.reduce((acc, p) => {
    const unitModal = (Number(p.buyPrice) || 0) + (Number(p.developmentCost) || 0);
    return acc + (unitModal * (Number(p.qty) || 1));
  }, 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0f172a] border border-emerald-500/30 rounded-3xl w-full max-w-6xl shadow-2xl my-6 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-border bg-emerald-950/20 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white">
                  Verifikasi & Konfirmasi Import Data Produk
                </h2>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold">
                  Lokasi Inbound: Gudang Utama (Warehouse)
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Semua barang import otomatis masuk ke Gudang Utama (Warehouse) sebelum didistribusikan/transfer ke cabang.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="px-6 py-4 bg-black/40 border-b border-glass-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Total Katalog/Master</span>
              <span className="text-lg font-extrabold text-white">{items.length} Item</span>
            </div>
            <div className="px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Total Fisik Unit</span>
              <span className="text-lg font-extrabold text-white">{totalUnits} Unit</span>
            </div>
            <div className="px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Total Modal Yang Dikeluarkan</span>
              <span className="text-lg font-extrabold text-white">{formatRupiah(totalModalValue)}</span>
            </div>
          </div>

          <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Klik "PROSES IMPORT STOK" untuk menyimpan ke inventaris.</span>
          </div>
        </div>

        {/* Products Table Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="py-16 text-center text-muted">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada data untuk di-import.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-glass-border rounded-2xl">
              <table className="w-full text-left text-xs text-muted">
                <thead className="text-[11px] text-muted uppercase bg-black/40 border-b border-glass-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-white">#</th>
                    <th className="px-4 py-3 font-semibold text-white">SKU / ID</th>
                    <th className="px-4 py-3 font-semibold text-white">Nama Produk & Brand</th>
                    <th className="px-4 py-3 font-semibold text-white">Spesifikasi Detail</th>
                    <th className="px-4 py-3 font-semibold text-white text-center">Warna</th>
                    <th className="px-4 py-3 font-semibold text-white text-right">HPP Supplier</th>
                    <th className="px-4 py-3 font-semibold text-white text-right">Modal QC/Service</th>
                    <th className="px-4 py-3 font-semibold text-white text-right">Harga Jual</th>
                    <th className="px-4 py-3 font-semibold text-white text-center">QTY</th>
                    <th className="px-4 py-3 font-semibold text-white text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border bg-black/20">
                  {items.map((row, idx) => {
                    const specStr = [row.processor, row.ram, row.storage, row.gpu, row.screenSize].filter(Boolean).join('/');
                    return (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">{row.sku || row.id || '-'}</td>
                        <td className="px-4 py-3 text-white max-w-[180px]">
                          <div className="font-semibold truncate">{row.name}</div>
                          <div className="text-[10px] text-gray-400">{row.brand} {row.model}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-blue-300 max-w-[200px]">
                          <div className="truncate" title={specStr || '-'}>{specStr || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300">{row.color || '-'}</td>
                        <td className="px-4 py-3 text-right text-gray-300 font-medium">{formatRupiah(row.buyPrice)}</td>
                        <td className="px-4 py-3 text-right text-amber-400 font-medium">{formatRupiah(row.developmentCost)}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-bold">{formatRupiah(row.sellPrice)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 font-extrabold rounded-lg">
                            {row.qty || 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-glass-border bg-black/40 flex justify-between items-center rounded-b-3xl">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl font-semibold text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50 text-sm"
          >
            Batal / Perbaiki File
          </button>
          <button 
            type="button"
            onClick={() => onConfirm(items)}
            disabled={isSubmitting || items.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/30 text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses Import...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                PROSES IMPORT STOK ({items.length} ITEM)
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
