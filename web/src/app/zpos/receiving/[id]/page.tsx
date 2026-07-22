'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/axios';
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUS_OPTIONS = [
  'Received', 'Missing', 'Damaged', 'WrongSN', 'WrongItem', 'PackagingDamaged', 'Other'
];

export default function ZPOSReceivingDetail() {
  const params = useParams();
  const router = useRouter();
  const [transfer, setTransfer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  const fetchDetail = async () => {
    try {
      const res = await apiClient.get(`/zpos/transfers/${params.id}`);
      if (res.data.success) {
        setTransfer(res.data.data);
        // Initialize state for items
        const initItems = res.data.data.items.map((it: any) => ({
          stockTransferId: it.id,
          product: it.product,
          status: it.status,
          receivedStatus: 'Received', // default assumption
          discrepancyNotes: ''
        }));
        setItems(initItems);
      }
    } catch (error: any) {
      toast.error('Gagal memuat detail transfer');
      router.push('/zpos/receiving');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setItems(prev => prev.map(item => 
      item.stockTransferId === id ? { ...item, receivedStatus: newStatus } : item
    ));
  };

  const handleNotesChange = (id: string, notes: string) => {
    setItems(prev => prev.map(item => 
      item.stockTransferId === id ? { ...item, discrepancyNotes: notes } : item
    ));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = items.map(it => ({
        stockTransferId: it.stockTransferId,
        receivedStatus: it.receivedStatus,
        discrepancyNotes: it.discrepancyNotes
      }));

      const res = await apiClient.post(`/zpos/transfers/${params.id}/receive`, { items: payload });
      if (res.data.success) {
        toast.success('Penerimaan berhasil disimpan!');
        router.push('/zpos/receiving');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan penerimaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!transfer) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifikasi Penerimaan Barang</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm text-gray-500">Nomor Transfer</p>
            <p className="font-semibold text-gray-900">{transfer.transferNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Surat Jalan (DO)</p>
            <p className="font-semibold text-gray-900">{transfer.doNumber || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gudang Pengirim</p>
            <p className="font-semibold text-gray-900">{transfer.fromBranch?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Item</p>
            <p className="font-semibold text-gray-900">{items.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-gray-900">Daftar Item</h2>
          
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Produk</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Serial Number (System)</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Kondisi Fisik</th>
                  <th className="px-4 py-3 font-medium text-gray-700 w-1/3">Catatan Discrepancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.stockTransferId} className={item.receivedStatus !== 'Received' ? 'bg-red-50/30' : ''}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{item.product.name}</div>
                      <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-600">
                      -
                    </td>
                    <td className="px-4 py-4">
                      <select 
                        value={item.receivedStatus}
                        onChange={(e) => handleStatusChange(item.stockTransferId, e.target.value)}
                        className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none
                          ${item.receivedStatus === 'Received' ? 'border-gray-200 bg-white' : 'border-red-300 bg-red-50 text-red-700 font-medium'}`}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt === 'Received' ? '✔ Sesuai (Received)' : `⚠️ ${opt}`}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input 
                        type="text" 
                        placeholder={item.receivedStatus === 'Received' ? "Opsional..." : "Wajib diisi..."}
                        value={item.discrepancyNotes}
                        onChange={(e) => handleNotesChange(item.stockTransferId, e.target.value)}
                        required={item.receivedStatus !== 'Received'}
                        className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none
                          ${item.receivedStatus === 'Received' ? 'border-gray-200 bg-gray-50' : 'border-red-300 bg-white'}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Konfirmasi & Terima Barang
          </button>
        </div>
      </div>
    </div>
  );
}
