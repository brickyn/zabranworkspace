'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';
import WarehouseDashboard from '@/components/dashboard/WarehouseDashboard';
import CashierDashboard from '@/components/dashboard/CashierDashboard';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <EmptyState 
          title="Sesi Berakhir" 
          description="Silakan login kembali untuk mengakses dashboard." 
          actionLabel="Ke Halaman Login"
          onAction={() => window.location.href = '/login'}
        />
      </DashboardLayout>
    );
  }

  const role = user.role;

  const renderDashboard = () => {
    switch (role) {
      case 'Super Admin':
      case 'Owner':
      case 'Director':
      case 'General Manager':
      case 'Finance':
        return <OwnerDashboard />;
      case 'Warehouse':
        return <WarehouseDashboard />;
      case 'Cashier':
        return <CashierDashboard />;
      case 'Leader':
      case 'Manager':
      case 'Admin':
        return <SupervisorDashboard />;
      default:
        return (
          <EmptyState 
            title="Akses Terbatas" 
            description={`Role Anda (${role}) belum memiliki dashboard khusus.`} 
          />
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="px-2 py-4">
        {renderDashboard()}
      </div>
    </DashboardLayout>
  );
}
