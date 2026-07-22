'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/axios';
import { Search, Truck, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function ZPOSTransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransfers = async () => {
    try {
      const res = await apiClient.get('/zpos/transfers');
      if (res.data.success) {
        setTransfers(res.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memuat riwayat transfer');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const filtered = transfers.filter(t => 
    t.transferNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.fromBranch?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.toBranch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer History</h1>
          <p className="text-gray-500">Riwayat perpindahan stok masuk maupun keluar</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Nomor Transfer/Toko..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full md:w-80 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm text-center p-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Truck className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Belum ada riwayat</h3>
          <p className="text-gray-500 mt-1">Belum ada aktivitas perpindahan barang.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Nomor Transfer</th>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Rute (Dari &rarr; Ke)</th>
                  <th className="px-6 py-4 font-medium">Total Item</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-blue-600">{t.transferNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(t.createdAt), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{t.fromBranch?.name}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{t.toBranch?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {t.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                        ${t.status === 'Received' || t.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/zpos/transfers/${t.id}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
