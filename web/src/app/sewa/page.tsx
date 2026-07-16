'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Loader2, Plus, Laptop, Search, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SewaPage() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // To select product to rent
  const [loading, setLoading] = useState(false);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '', customerName: '', customerPhone: '', customerIdentity: '', productId: '', startDate: '', endDate: '',
    rentalType: 'Harian', totalFee: '', deposit: '', shippingFee: '', installationFee: '', otherFee: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRentals, resBranches, resProducts] = await Promise.all([
        apiClient.get('/rentals', { params: { branchId: filterBranch, status: filterStatus } }),
        apiClient.get('/branches'),
        apiClient.get('/products', { params: { status: 'Available' } })
      ]);
      if (resRentals.data.success) setRentals(resRentals.data.data);
      if (resProducts.data.success) setProducts(resProducts.data.data);
      if (resBranches.data.success) {
        setBranches(resBranches.data.data);
        if(!formData.branchId && resBranches.data.data.length > 0) {
          setFormData(prev => ({...prev, branchId: resBranches.data.data[0].id}));
        }
      }
    } catch (error) {
      toast.error('Gagal memuat data sewa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterBranch, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/rentals', formData);
      toast.success('Penyewaan berhasil dibuat');
      setShowModal(false);
      setFormData({ branchId: formData.branchId, customerName: '', customerPhone: '', customerIdentity: '', productId: '', startDate: '', endDate: '', rentalType: 'Harian', totalFee: '', deposit: '', shippingFee: '', installationFee: '', otherFee: '', notes: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat penyewaan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/rentals/${id}/status`, { status: newStatus });
      toast.success(`Status penyewaan diubah menjadi ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const handlePrintKontrak = (rental: any) => {
    const printContent = `
      <html>
        <head>
          <title>Kontrak Sewa - ${rental.id}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h2 { text-align: center; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            .footer { margin-top: 50px; text-align: right; }
          </style>
        </head>
        <body>
          <h2>KONTRAK PENYEWAAN BARANG</h2>
          <div class="info">
            <p><strong>ID Sewa:</strong> ${rental.id}</p>
            <p><strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
            <p><strong>Penyewa:</strong> ${rental.customerName} (${rental.customerPhone})</p>
            <p><strong>Identitas:</strong> ${rental.customerIdentity || '-'}</p>
          </div>
          <table>
            <tr><th>Barang</th><td>${rental.product?.name} (SN: ${rental.productId})</td></tr>
            <tr><th>Masa Sewa</th><td>${new Date(rental.startDate).toLocaleDateString('id-ID')} s/d ${new Date(rental.endDate).toLocaleDateString('id-ID')} (${rental.rentalType})</td></tr>
            <tr><th>Tarif Sewa</th><td>${formatRupiah(rental.totalFee)}</td></tr>
            <tr><th>Deposit</th><td>${formatRupiah(rental.deposit)}</td></tr>
            <tr><th>Biaya Pengiriman</th><td>${formatRupiah(rental.shippingFee)}</td></tr>
            <tr><th>Biaya Instalasi</th><td>${formatRupiah(rental.installationFee)}</td></tr>
            <tr><th>Biaya Lainnya</th><td>${formatRupiah(rental.otherFee)}</td></tr>
          </table>
          <div class="footer">
            <p>Penyewa</p>
            <br/><br/><br/>
            <p>( ${rental.customerName} )</p>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header & Filter */}
        <div className="bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Manajemen Sewa</h1>
            <p className="text-muted text-sm">Kelola penyewaan unit laptop ke pelanggan.</p>
          </div>
          
          <div className="flex gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              <option value="all">Semua Status</option>
              <option value="Active">Sedang Disewa (Active)</option>
              <option value="Overdue">Terlambat (Overdue)</option>
              <option value="Returned">Dikembalikan (Returned)</option>
            </select>
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              <option value="all">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Sewa Baru
            </button>
          </div>
        </div>

        {/* List of Rentals */}
        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Pelanggan</th>
                  <th className="px-6 py-4 font-medium">Unit / SN</th>
                  <th className="px-6 py-4 font-medium">Tgl Sewa</th>
                  <th className="px-6 py-4 font-medium">Biaya & Deposit</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" /> Memuat data...</td></tr>
                ) : rentals.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Tidak ada data penyewaan</td></tr>
                ) : (
                  rentals.map((rental) => (
                    <tr key={rental.id} className="hover:bg-nav-hover transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{rental.customerName}</p>
                        <p className="text-xs text-gray-500">{rental.customerPhone}</p>
                        {rental.customerIdentity && <p className="text-xs text-gray-500">ID: {rental.customerIdentity}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{rental.product?.name || 'Unknown'}</p>
                        <p className="text-xs text-blue-400 font-mono">{rental.productId}</p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p>Mulai: {new Date(rental.startDate).toLocaleDateString('id-ID')}</p>
                        <p className="text-red-400 mt-1">Kembali: {new Date(rental.endDate).toLocaleDateString('id-ID')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white text-xs bg-blue-500/10 px-2 py-0.5 rounded w-fit mb-1 border border-blue-500/20">{rental.rentalType}</p>
                        <p className="text-white font-medium">Total: {formatRupiah(rental.totalFee + rental.shippingFee + rental.installationFee + rental.otherFee)}</p>
                        <p className="text-xs text-gray-500 mt-1">DP: {formatRupiah(rental.deposit)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs border ${
                          rental.status === 'Active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                          rental.status === 'Overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          'bg-green-500/10 text-green-400 border-green-500/20'
                        }`}>
                          {rental.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <button onClick={() => handlePrintKontrak(rental)} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500 hover:text-white transition-colors">
                            Print Kontrak
                          </button>
                          {rental.status !== 'Returned' && (
                            <button onClick={() => handleUpdateStatus(rental.id, 'Returned')} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500 hover:text-white transition-colors">
                              Kembalikan
                            </button>
                          )}
                          {rental.status === 'Active' && new Date(rental.endDate) < new Date() && (
                            <button onClick={() => handleUpdateStatus(rental.id, 'Overdue')} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500 hover:text-white transition-colors">
                              Set Overdue
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Buat Penyewaan Baru</h2>
              <p className="text-sm text-muted mt-1">Pilih pelanggan dan produk yang akan disewa.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Nama Penyewa *</label>
                    <input required type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">No. KTP / Identitas</label>
                    <input type="text" value={formData.customerIdentity} onChange={e => setFormData({...formData, customerIdentity: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">No HP / WhatsApp *</label>
                    <input required type="text" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Pilih Cabang *</label>
                    <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Unit Laptop yang Disewa (Pilih Serial Number) *</label>
                  <select required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
                    <option value="">-- Pilih Produk Tersedia --</option>
                    {products.map(p => <option key={p.id} value={p.id}>[{p.id}] {p.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Tanggal Mulai Sewa *</label>
                    <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Tanggal Kembali *</label>
                    <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Tipe Sewa *</label>
                    <select required value={formData.rentalType} onChange={e => setFormData({...formData, rentalType: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
                      <option value="Harian">Harian</option>
                      <option value="Mingguan">Mingguan</option>
                      <option value="Bulanan">Bulanan</option>
                      <option value="Tahunan">Tahunan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Tarif Pokok Sewa (Rp) *</label>
                    <input required type="number" min="0" value={formData.totalFee} onChange={e => setFormData({...formData, totalFee: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Biaya Kirim (Rp)</label>
                    <input type="number" min="0" value={formData.shippingFee} onChange={e => setFormData({...formData, shippingFee: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Biaya Instalasi (Rp)</label>
                    <input type="number" min="0" value={formData.installationFee} onChange={e => setFormData({...formData, installationFee: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Biaya Lainnya (Rp)</label>
                    <input type="number" min="0" value={formData.otherFee} onChange={e => setFormData({...formData, otherFee: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Deposit Jaminan (Rp)</label>
                    <input type="number" min="0" value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 rounded-b-3xl">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Buat Penyewaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
