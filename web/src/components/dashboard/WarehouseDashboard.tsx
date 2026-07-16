import React from 'react';
import { Package, Truck, FileText } from 'lucide-react';
import { CardSkeleton } from '../ui/Skeleton';

export default function WarehouseDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warehouse Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Pantau pergerakan stok dan penerimaan barang.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mock Widgets */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Menunggu Diproses</p>
              <h3 className="text-2xl font-bold">12 Transfer</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sedang Dikirim</p>
              <h3 className="text-2xl font-bold">5 Surat Jalan</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Stok Masuk Hari Ini</p>
              <h3 className="text-2xl font-bold">128 Unit</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-4">Tugas Menunggu (Picking)</h4>
          <CardSkeleton />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-4">Status Gudang</h4>
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
