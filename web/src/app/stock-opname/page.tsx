'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { ClipboardList, Plus, FileDown, Upload, Search, CheckCircle2, AlertTriangle, AlertCircle, Eye, Loader2, ArrowLeft, Save } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function StockOpnamePage() {
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [opnames, setOpnames] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userRole, setUserRole] = useState<string>('');
  const [userBranch, setUserBranch] = useState<string>('');

  // detail states
  const [activeSO, setActiveSO] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'MATCH' | 'MISSING' | 'UNEXPECTED'>('MATCH');
  
  // init SO modal
  const [showInitModal, setShowInitModal] = useState(false);
  const [initBranch, setInitBranch] = useState('');
  const [initNotes, setInitNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // upload file
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // cancel SO
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branchId || '');
    }
    fetchOpnames();
    if (user?.role === 'Super Admin' || user?.role === 'Finance' || user?.role === 'Management') {
      fetchBranches();
    }
  }, []);

  const fetchOpnames = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory/opname');
      if (res.data.success) {
        setOpnames(res.data.data);
      }
    } catch (error) {
      toast.error('Gagal mengambil data histori SO');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get('/branches');
      if (res.data.success) {
        setBranches(res.data.data);
      }
    } catch (error) {}
  };

  const handleInitSO = async () => {
    if (!initBranch) return toast.error('Pilih cabang terlebih dahulu');
    try {
      setIsSubmitting(true);
      const res = await apiClient.post('/inventory/opname/init', { branchId: initBranch, notes: initNotes });
      if (res.data.success) {
        toast.success('Stock Opname berhasil dimulai');
        setShowInitModal(false);
        fetchOpnames();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memulai SO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/inventory/opname/${id}`);
      if (res.data.success) {
        setActiveSO(res.data.data);
        setView('DETAIL');
      }
    } catch (error) {
      toast.error('Gagal memuat detail SO');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const tokenStr = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/inventory/opname/template/${activeSO.branchId}`, {
        headers: { 'Authorization': `Bearer ${tokenStr}` }
      });
      if (!res.ok) throw new Error('Failed to download');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SO_Template_${activeSO.branchId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Gagal mendownload template');
    }
  };

  const handleCancelSO = async () => {
    if (!cancelReason) return toast.error('Alasan pembatalan harus diisi');
    try {
      setIsSubmitting(true);
      const res = await apiClient.patch(`/inventory/opname/${activeSO.id}/cancel`, { reason: cancelReason });
      if (res.data.success) {
        toast.success('SO Berhasil Dibatalkan');
        setShowCancelModal(false);
        setCancelReason('');
        openDetail(activeSO.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membatalkan SO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Pilih file Excel SO');
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setIsUploading(true);
      const tokenStr = localStorage.getItem('token');
      // Direct fetch to support formData properly with auth
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/inventory/opname/${activeSO.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenStr}`
        },
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('File berhasil diproses!');
        setFile(null);
        openDetail(activeSO.id); // reload
      } else {
        toast.error(data.error || 'Gagal upload file');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem saat upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveNote = async (itemId: string, note: string) => {
    try {
      const res = await apiClient.patch(`/inventory/opname/${activeSO.id}/items/${itemId}/notes`, { notes: note });
      if (res.data.success) {
        toast.success('Catatan disimpan');
        // Update local state without full reload to be fast
        const newItems = activeSO.items.map((i: any) => i.id === itemId ? { ...i, notes: note } : i);
        setActiveSO({ ...activeSO, items: newItems });
      }
    } catch (error) {
      toast.error('Gagal menyimpan catatan');
    }
  };

  const handleVerify = async () => {
    if (!confirm('Apakah Anda yakin ingin memverifikasi SO ini? Data tidak dapat diubah lagi.')) return;
    try {
      setIsSubmitting(true);
      const res = await apiClient.patch(`/inventory/opname/${activeSO.id}/verify`);
      if (res.data.success) {
        toast.success('SO Berhasil Diverifikasi');
        openDetail(activeSO.id);
      }
    } catch (error) {
      toast.error('Gagal memverifikasi SO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderList = () => (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center bg-glass-bg p-6 rounded-3xl border border-glass-border">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-green-500" />
            Stock Opname
          </h1>
          <p className="text-muted mt-1 text-sm">Kelola proses perhitungan fisik barang toko & gudang.</p>
        </div>
        {['Super Admin', 'Finance', 'Management'].includes(userRole) && (
          <button 
            onClick={() => setShowInitModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all shadow-lg shadow-green-500/20"
          >
            <Plus className="w-5 h-5" /> Mulai SO Baru
          </button>
        )}
      </div>

      <div className="bg-glass-bg border border-glass-border rounded-3xl flex-1 overflow-hidden">
        <table className="w-full text-left text-sm text-muted">
          <thead className="text-xs text-muted uppercase bg-black/20">
            <tr>
              <th className="px-6 py-4 font-medium">Tanggal Mulai</th>
              <th className="px-6 py-4 font-medium">Cabang</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Catatan Awal</th>
              <th className="px-6 py-4 font-medium text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></td></tr>
            ) : opnames.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada data SO</td></tr>
            ) : opnames.map((op) => (
              <tr key={op.id} className="hover:bg-nav-hover transition-colors group">
                <td className="px-6 py-4">{new Date(op.startTime).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-6 py-4 text-white font-medium">{op.branch?.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                    op.status === 'In Progress' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    op.status === 'Review' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    op.status === 'Verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    'bg-gray-500/10 text-muted border-gray-500/20'
                  }`}>
                    {op.status}
                  </span>
                </td>
                <td className="px-6 py-4 truncate max-w-xs">{op.notes || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => openDetail(op.id)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-glass-bg rounded-3xl w-full max-w-md border border-glass-border p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Mulai Stock Opname</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-2">Pilih Cabang</label>
                <select 
                  value={initBranch} onChange={(e) => setInitBranch(e.target.value)}
                  className="w-full bg-glass-bg border border-glass-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-green-500"
                >
                  <option value="">-- Pilih Cabang --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted mb-2">Catatan (Opsional)</label>
                <textarea 
                  value={initNotes} onChange={(e) => setInitNotes(e.target.value)}
                  className="w-full bg-glass-bg border border-glass-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-green-500"
                  placeholder="Misal: SO Akhir Bulan Juli" rows={3}
                ></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowInitModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium transition-colors">Batal</button>
              <button onClick={handleInitSO} disabled={isSubmitting} className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Mulai SO
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-glass-bg rounded-3xl w-full max-w-md border border-glass-border p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Batalkan Stock Opname</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-2">Alasan Pembatalan</label>
                <textarea 
                  value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-glass-bg border border-glass-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-red-500"
                  placeholder="Misal: Salah cabang, salah hitung, dll" rows={3}
                ></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium transition-colors">Tutup</button>
              <button onClick={handleCancelSO} disabled={isSubmitting} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetail = () => {
    if (!activeSO) return null;

    const itemsMatch = activeSO.items.filter((i: any) => i.diffStatus === 'MATCH');
    const itemsMissing = activeSO.items.filter((i: any) => i.diffStatus === 'MISSING');
    const itemsUnexpected = activeSO.items.filter((i: any) => i.diffStatus === 'UNEXPECTED');

    const activeList = activeTab === 'MATCH' ? itemsMatch : activeTab === 'MISSING' ? itemsMissing : itemsUnexpected;

    return (
      <div className="flex flex-col gap-6 h-full pb-10">
        {/* Header */}
        <div className="flex justify-between items-center bg-glass-bg p-6 rounded-3xl border border-glass-border">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('LIST')} className="p-2 bg-white/5 hover:bg-white/10 text-muted hover:text-white rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                Detail SO - {activeSO.branch?.name}
              </h1>
              <p className="text-muted mt-1 text-sm">
                Mulai: {new Date(activeSO.startTime).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} 
                {activeSO.uploadTime && ` • Upload: ${new Date(activeSO.uploadTime).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 text-sm font-medium rounded-full border ${
              activeSO.status === 'In Progress' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
              activeSO.status === 'Review' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              activeSO.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-green-500/10 text-green-400 border-green-500/20'
            }`}>
              {activeSO.status}
            </span>
            {activeSO.status !== 'Verified' && activeSO.status !== 'Cancelled' && ['Super Admin', 'Admin'].includes(userRole) && (
              <button 
                onClick={() => setShowCancelModal(true)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg transition-all"
              >
                Batalkan SO
              </button>
            )}
            {activeSO.status === 'Review' && ['Super Admin', 'Finance'].includes(userRole) && (
              <button 
                onClick={handleVerify}
                disabled={isSubmitting}
                className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Verifikasi SO
              </button>
            )}
          </div>
        </div>

        {/* State: In Progress (Upload Excel) */}
        {activeSO.status === 'In Progress' && (
          <div className="bg-glass-bg border border-glass-border rounded-3xl p-8 max-w-3xl mx-auto w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileDown className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Tahap 1: Download Template</h2>
              <p className="text-muted text-sm">Download template kosong. Scan barcode setiap fisik laptop di toko/gudang kamu ke dalam template Excel tersebut (Kolom A).</p>
              <button onClick={handleDownloadTemplate} className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all inline-block">
                Download Template SO
              </button>
            </div>

            <div className="border-t border-glass-border my-8"></div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Tahap 2: Upload Hasil SO</h2>
              <p className="text-muted text-sm mb-6">Upload file Excel yang sudah berisi semua SN/Barcode hasil scan.</p>
              
              <div className="max-w-md mx-auto">
                <input 
                  type="file" 
                  accept=".xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full bg-glass-bg border border-glass-border rounded-xl px-4 py-2.5 text-foreground mb-4"
                />
                <button 
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  Proses & Validasi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* State: Review or Verified */}
        {(activeSO.status === 'Review' || activeSO.status === 'Verified') && (
          <div className="flex flex-col flex-1 min-h-0 bg-glass-bg border border-glass-border rounded-3xl p-6">
            <div className="flex gap-4 mb-6 border-b border-glass-border pb-4">
              <button 
                onClick={() => setActiveTab('MATCH')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'MATCH' ? 'bg-green-500/20 text-green-400' : 'text-muted hover:bg-nav-hover'}`}
              >
                <CheckCircle2 className="w-5 h-5" /> Sesuai / Match ({itemsMatch.length})
              </button>
              <button 
                onClick={() => setActiveTab('MISSING')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'MISSING' ? 'bg-red-500/20 text-red-400' : 'text-muted hover:bg-nav-hover'}`}
              >
                <AlertCircle className="w-5 h-5" /> Selisih / Missing ({itemsMissing.length})
              </button>
              <button 
                onClick={() => setActiveTab('UNEXPECTED')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === 'UNEXPECTED' ? 'bg-orange-500/20 text-orange-400' : 'text-muted hover:bg-nav-hover'}`}
              >
                <AlertTriangle className="w-5 h-5" /> Tidak Dikenal ({itemsUnexpected.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                {activeList.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Tidak ada item di kategori ini.</div>
                ) : (
                  activeList.map((item: any) => (
                    <div key={item.id} className="bg-glass-bg p-4 rounded-2xl border border-glass-border flex gap-6">
                      <div className="flex-1">
                        <div className="text-sm text-muted mb-1">Serial Number</div>
                        <div className="font-mono text-white text-lg">{item.serialNumber}</div>
                        {item.product && (
                          <div className="text-sm text-blue-400 mt-1">{item.product.name} ({item.product.category})</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-muted mb-1">Catatan / Keterangan Toko</div>
                        {activeSO.status === 'Review' ? (
                          <textarea 
                            defaultValue={item.notes || ''}
                            onBlur={(e) => handleSaveNote(item.id, e.target.value)}
                            className="w-full bg-glass-bg border border-glass-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500 h-20"
                            placeholder="Wajib diisi jika barang hilang / tidak dikenal..."
                          />
                        ) : (
                          <div className="text-foreground text-sm bg-glass-bg p-3 rounded-xl h-20 overflow-y-auto">
                            {item.notes || <span className="text-gray-500 italic">Tidak ada catatan</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      {view === 'LIST' ? renderList() : renderDetail()}
    </DashboardLayout>
  );
}
