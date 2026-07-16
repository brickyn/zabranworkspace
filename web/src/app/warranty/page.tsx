'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Loader2, Shield, Search, Calendar, FileText, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/warranties', { params: { search, status: filterStatus } });
      if (res.data.success) {
        setWarranties(res.data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data garansi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, filterStatus]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/warranties/${id}/status`, { status });
      toast.success('Status garansi diperbarui');
      fetchData();
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        
        {/* Header */}
        <div className="bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Manajemen Garansi</h1>
            <p className="text-muted text-sm">Lihat dan kelola garansi produk yang telah terjual.</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Cari Pelanggan / SN..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none text-sm"
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none text-sm">
              <option value="all">Semua Status</option>
              <option value="Active">Aktif (Active)</option>
              <option value="Expired">Kedaluwarsa (Expired)</option>
              <option value="Claimed">Sedang Diklaim (Claimed)</option>
              <option value="Void">Hangus (Void)</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Pelanggan</th>
                  <th className="px-6 py-4 font-medium">Produk & SN</th>
                  <th className="px-6 py-4 font-medium">Masa Garansi</th>
                  <th className="px-6 py-4 font-medium">Tipe Garansi</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                      Memuat data garansi...
                    </td>
                  </tr>
                ) : warranties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">Tidak ada data garansi ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  warranties.map((w) => {
                    const isExpired = new Date(w.endDate) < new Date();
                    const status = isExpired && w.status === 'Active' ? 'Expired' : w.status;
                    
                    return (
                      <tr key={w.id} className="hover:bg-nav-hover transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{w.customerName}</p>
                          <p className="text-xs text-gray-500">{w.customerPhone || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{w.transactionItem?.product?.name}</p>
                          <p className="text-xs text-blue-400 font-mono">{w.transactionItem?.product?.id}</p>
                          <p className="text-xs text-gray-500">Cabang: {w.transactionItem?.transaction?.branch?.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-muted text-xs mb-1">
                            <Calendar className="w-3 h-3" /> Mulai: {new Date(w.startDate).toLocaleDateString('id-ID')}
                          </div>
                          <div className={`flex items-center gap-2 text-xs font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                            <Calendar className="w-3 h-3" /> Selesai: {new Date(w.endDate).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs">{w.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs border ${
                            status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            status === 'Expired' || status === 'Void' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {status === 'Active' && (
                            <div className="flex flex-col gap-2 items-center">
                              <button onClick={() => handleUpdateStatus(w.id, 'Claimed')} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500 hover:text-white transition-colors w-full text-center">
                                Klaim Garansi
                              </button>
                              <button onClick={() => handleUpdateStatus(w.id, 'Void')} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500 hover:text-white transition-colors w-full text-center">
                                Void (Hangus)
                              </button>
                            </div>
                          )}
                          {status === 'Claimed' && (
                            <button onClick={() => handleUpdateStatus(w.id, 'Active')} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500 hover:text-white transition-colors w-full text-center">
                              Selesai (Active)
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
