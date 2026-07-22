'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/axios';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function ZPOSTransferDetail() {
  const params = useParams();
  const router = useRouter();
  const [transfer, setTransfer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  const fetchDetail = async () => {
    try {
      const res = await apiClient.get(`/zpos/transfers/${params.id}`);
      if (res.data.success) {
        setTransfer(res.data.data);
      }
    } catch (error: any) {
      toast.error('Gagal memuat detail transfer');
      router.push('/zpos/transfers');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!transfer) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Transfer
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transfer Detail</h1>
            <p className="text-gray-500">{transfer.transferNumber}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
            ${transfer.status === 'Received' || transfer.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            Status: {transfer.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm text-gray-500">Gudang Pengirim</p>
            <p className="font-semibold text-gray-900">{transfer.fromBranch?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Toko Penerima</p>
            <p className="font-semibold text-gray-900">{transfer.toBranch?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tanggal Dibuat</p>
            <p className="font-semibold text-gray-900">{format(new Date(transfer.createdAt), 'dd MMM yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Penerima (User ID)</p>
            <p className="font-semibold text-gray-900">{transfer.receivedBy || '-'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-400" /> Daftar Barang
          </h2>
          
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Produk</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Serial Number</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Status Awal</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Status Diterima</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Catatan Discrepancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transfer.items.map((item: any) => (
                  <tr key={item.id} className={item.receivedStatus && item.receivedStatus !== 'Received' ? 'bg-red-50/30' : ''}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{item.product?.name}</div>
                      <div className="text-xs text-gray-500">SKU: {item.product?.sku}</div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-600">
                      -
                    </td>
                    <td className="px-4 py-4">
                      {item.status}
                    </td>
                    <td className="px-4 py-4">
                      {item.receivedStatus ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${item.receivedStatus === 'Received' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.receivedStatus}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-700 text-xs">
                      {item.discrepancyNotes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
