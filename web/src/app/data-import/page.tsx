'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Upload, FileDown, CheckCircle2, AlertCircle, Loader2, Info, Package, Receipt } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

type ImportTab = 'products' | 'transactions';

export default function DataImportPage() {
  const [activeTab, setActiveTab] = useState<ImportTab>('products');
  const [file, setFile] = useState<File | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    apiClient.get('/branches').then(res => {
      if (res.data.success) {
        setBranches(res.data.data);
        if (res.data.data.length > 0) setSelectedBranch(res.data.data[0].id);
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls')) {
        setFile(selected);
        setImportResult(null);
      } else {
        toast.error('Gunakan file Excel (.xlsx atau .xls)');
        e.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Pilih file Excel terlebih dahulu');
    if (!selectedBranch) return toast.error('Pilih cabang tujuan');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('branchId', selectedBranch);

    setIsUploading(true);
    setImportResult(null);

    const endpoint = activeTab === 'products' ? '/data-import/products' : '/data-import/transactions';

    try {
      const res = await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Import berhasil');
        setImportResult(res.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal mengimpor data');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-4xl mx-auto pb-10">
        <div className="bg-glass-bg p-6 rounded-3xl border border-glass-border">
          <h1 className="text-2xl font-bold text-white mb-2">Data Import Center</h1>
          <p className="text-muted text-sm">Upload master produk atau data transaksi historis dari Excel.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-glass-bg border border-glass-border rounded-2xl p-1 w-full max-w-md mx-auto sm:mx-0">
          <button
            onClick={() => { setActiveTab('products'); setImportResult(null); setFile(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all text-sm ${
              activeTab === 'products' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                : 'text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" /> Import Produk
          </button>
          <button
            onClick={() => { setActiveTab('transactions'); setImportResult(null); setFile(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium transition-all text-sm ${
              activeTab === 'transactions' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                : 'text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-4 h-4" /> Import Transaksi
          </button>
        </div>

        <div className="bg-glass-bg border border-glass-border p-6 rounded-3xl">
          {activeTab === 'products' ? (
            <div className="flex items-start gap-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-8">
              <Info className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-purple-400 font-medium mb-1">Format Excel Master Produk</h3>
                <p className="text-sm text-muted">
                  Pastikan baris pertama Excel mengandung header persis seperti ini:<br/>
                  <code className="text-xs bg-black/30 px-2 py-1 rounded mt-2 block text-white/80">
                    ID Produk | Nama | Brand | Model | Kategori | Processor | RAM | Storage | GPU | HPP | Harga Jual | Serial Number | Cabang ID | Status
                  </code>
                </p>
                <button onClick={() => toast('Fitur download template produk dalam pengembangan', { icon: '🚧' })} className="mt-3 flex items-center w-fit gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  <FileDown className="w-4 h-4" /> Download Template Produk .xlsx
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-8">
              <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-400 font-medium mb-1">Format Excel Transaksi Historis</h3>
                <p className="text-sm text-muted">
                  Pastikan baris pertama Excel mengandung header persis seperti ini:<br/>
                  <code className="text-xs bg-black/30 px-2 py-1 rounded mt-2 block text-white/80">
                    Tanggal | Kode TX | Cabang ID | Nama Produk | Kategori | HPP | Harga Jual | Metode Bayar | Kasir ID
                  </code>
                </p>
                <button onClick={() => toast('Fitur download template transaksi dalam pengembangan', { icon: '🚧' })} className="mt-3 flex items-center w-fit gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  <FileDown className="w-4 h-4" /> Download Template Transaksi .xlsx
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-muted mb-2">Pilih Cabang (Jika Cabang ID kosong di Excel)</label>
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-glass-bg border border-glass-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
              >
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">Upload File Excel (.xlsx)</label>
              <input 
                type="file" 
                accept=".xlsx, .xls"
                key={activeTab} // force re-render input on tab change
                onChange={handleFileChange}
                className="w-full bg-glass-bg border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-glass-border flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all ${
                activeTab === 'products' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isUploading ? 'Mengimpor...' : `Mulai Import ${activeTab === 'products' ? 'Produk' : 'Transaksi'}`}
            </button>
          </div>

          {importResult && (
            <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="text-green-400 font-medium mb-1">Import Selesai!</h3>
                <p className="text-sm text-muted">
                  Total Baris Excel: <b>{importResult.total}</b><br/>
                  Berhasil Diimport: <b className="text-green-400">{importResult.imported} baris</b><br/>
                  Dilewati (Duplikat/Error): <b className="text-orange-400">{importResult.skipped}</b>
                </p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                    <p className="font-semibold mb-1">Error Detail (Max 20):</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {importResult.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
