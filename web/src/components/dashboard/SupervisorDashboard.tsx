import React from 'react';
import { ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { CardSkeleton } from '../ui/Skeleton';

export default function SupervisorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supervisor Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Ringkasan performa cabang dan persetujuan tertunda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Persetujuan Tertunda</p>
              <h3 className="text-2xl font-bold text-red-600">8 Dokumen</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Penjualan Cabang Hari Ini</p>
              <h3 className="text-2xl font-bold">Rp 45.000.000</h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Kehadiran Staf</p>
              <h3 className="text-2xl font-bold">12 / 12 Hadir</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-4">Grafik Penjualan Mingguan</h4>
          <CardSkeleton />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-4">Log Aktivitas Cabang</h4>
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
