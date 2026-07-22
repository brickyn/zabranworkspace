'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MENU_GROUPS } from '@/components/Layout/DashboardLayout';
import { LogOut, ArrowRight, Layers, Users, Landmark, FileText, Settings, Briefcase, BookOpen, Package, Wrench, Shield, CreditCard, PieChart, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { apiClient } from '@/lib/axios';
import { GlassCard } from '@/components/ui/GlassCard';

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
};

export default function MasterHubPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Warehouse role is restricted to Inventory Operational module only
      if (parsedUser.role === 'Warehouse') {
        router.push('/products');
        return;
      }
      
      // Fetch live metrics
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      apiClient.get('/dashboard/metrics', {
        params: { month, year, branchId: 'all', includeSewa: true }
      }).then(res => {
        if (res.data.success) {
          setMetrics(res.data.data);
        }
      }).catch(err => console.error("Failed to fetch live stats", err));

    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen bg-glass-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Reuse RBAC logic
  const getMenuPermission = (path: string) => {
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('pos')) return 'POS';
    if (path.includes('crm') || path.includes('customers')) return 'CRM';
    if (path.includes('b2b')) return 'B2B';
    if (path.includes('bsb')) return 'BSB';
    if (path.includes('promo')) return 'Promos';
    if (path.includes('products') || path.includes('stock') || path.includes('pembelian')) return 'Inventory';
    if (path.includes('sales') || path.includes('laporan') || path.includes('analytics') || path.includes('finance') || path.includes('cash') || path.includes('biaya') || path.includes('margin') || path.includes('setor-tunai') || path.includes('marketing')) return 'Laporan';
    if (path.includes('users') || path.includes('branches') || path.includes('settings')) return 'Users';
    return null;
  };

  const hasMenuPermission = (roles: string[], path?: string) => {
    if (user.role === 'Super Admin' || user.role === 'Owner') return true;
    if (user.permissions && user.permissions.length > 0 && path) {
      const requiredPerm = getMenuPermission(path);
      if (requiredPerm) {
        return user.permissions.some((p: string) => p.startsWith(requiredPerm + '.') || p === requiredPerm);
      }
    }
    return roles.includes(user.role);
  };

  // Filter MENU_GROUPS based on RBAC
  const filteredGroups = MENU_GROUPS.map(group => {
    const filteredItems = group.items.filter(item => {
      if (item.subItems) {
        return hasMenuPermission(item.roles, item.path || item.subItems[0].path);
      }
      return hasMenuPermission(item.roles, item.path);
    }).map(item => {
      if (item.subItems) {
        const filteredSubs = item.subItems.filter(sub => hasMenuPermission(sub.roles, sub.path));
        return { ...item, subItems: filteredSubs };
      }
      return item;
    });
    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  const getGroupMetadata = (groupName: string) => {
    switch (groupName) {
      case 'Utama':
        return {
          icon: PieChart, desc: 'Pusat kontrol dan metrik operasional nasional.',
          color: 'from-blue-500/20 to-purple-500/20', textColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-500/30', dotColor: 'bg-blue-600',
          statLabel: 'Total Omzet (Bulan Ini)', statValue: metrics ? formatRupiah(metrics.totalOmzet) : '...'
        };
      case 'Transaksi':
        return {
          icon: CreditCard, desc: 'Pusat operasional kasir, riwayat penjualan, dan rekap harian.',
          color: 'from-fuchsia-500/20 to-purple-500/20', textColor: 'text-fuchsia-600 dark:text-fuchsia-400', borderColor: 'border-fuchsia-500/30', dotColor: 'bg-fuchsia-600',
          statLabel: 'Shift Terbuka', statValue: metrics && metrics.activeShifts ? metrics.activeShifts : '0'
        };
      case 'Operasional':
        return {
          icon: Package, desc: 'Manajemen master data, inventaris gudang, dan pembelian (PO).',
          color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-500/30', dotColor: 'bg-emerald-600',
          statLabel: 'Laptop Terjual', statValue: metrics ? `${metrics.laptop.unit} Unit` : '...'
        };
      case 'Layanan':
        return {
          icon: Wrench, desc: 'Pusat layanan pelanggan, reparasi, sewa, dan garansi.',
          color: 'from-orange-500/20 to-amber-500/20', textColor: 'text-orange-600 dark:text-orange-400', borderColor: 'border-orange-500/30', dotColor: 'bg-orange-600',
          statLabel: 'Total Servis', statValue: metrics ? `${metrics.service.unit} Unit` : '...'
        };
      case 'KPI & Target':
        return {
          icon: Target, desc: 'Pusat target sales dan KPI.',
          color: 'from-rose-500/20 to-orange-500/20', textColor: 'text-rose-600 dark:text-rose-400', borderColor: 'border-rose-500/30', dotColor: 'bg-rose-600',
          statLabel: null, statValue: null
        };
      case 'Divisi B2B':
        return {
          icon: Briefcase, desc: 'Eksplorasi peluang pasar B2B, aktivitas, dan jadwal strategis.',
          color: 'from-indigo-500/20 to-blue-500/20', textColor: 'text-indigo-600 dark:text-indigo-400', borderColor: 'border-indigo-500/30', dotColor: 'bg-indigo-600',
          statLabel: 'Omzet B2B', statValue: metrics ? formatRupiah(metrics.b2b.omzet) : '...'
        };
      case 'Divisi BSB':
        return {
          icon: BookOpen, desc: 'Manajemen operasional Buku Sekolah Bisnis dan analitik iklan.',
          color: 'from-pink-500/20 to-rose-500/20', textColor: 'text-pink-600 dark:text-pink-400', borderColor: 'border-pink-500/30', dotColor: 'bg-pink-600',
          statLabel: 'Omzet BSB', statValue: metrics ? formatRupiah(metrics.bsb.omzet) : '...'
        };
      case 'CRM & Pelanggan':
        return {
          icon: Users, desc: 'Analisis data pelanggan, kelola loyalitas, dan pantau feedback.',
          color: 'from-violet-500/20 to-purple-500/20', textColor: 'text-violet-600 dark:text-violet-400', borderColor: 'border-violet-500/30', dotColor: 'bg-violet-600',
          statLabel: 'Repeat Orders', statValue: metrics ? `${metrics.crm.repeatOrder} Orang` : '...'
        };
      case 'Keuangan':
        return {
          icon: Landmark, desc: 'Pantau metrik keuangan, arus kas, setor tunai, dan profit margin.',
          color: 'from-yellow-500/20 to-amber-500/20', textColor: 'text-yellow-600 dark:text-yellow-400', borderColor: 'border-yellow-500/30', dotColor: 'bg-yellow-600',
          statLabel: 'Profit Margin', statValue: metrics ? `${metrics.margin.toFixed(1)}%` : '...'
        };
      case 'Laporan & Analytics':
        return {
          icon: FileText, desc: 'Visualisasi data terpusat, analitik AI, dan performa kampanye.',
          color: 'from-cyan-500/20 to-blue-500/20', textColor: 'text-cyan-600 dark:text-cyan-400', borderColor: 'border-cyan-500/30', dotColor: 'bg-cyan-600',
          statLabel: 'Total Transaksi', statValue: metrics ? `${metrics.totalTransaksi} TX` : '...'
        };
      case 'Pengaturan':
        return {
          icon: Settings, desc: 'Konfigurasi sistem, manajemen pengguna, dan master data cabang.',
          color: 'from-gray-500/20 to-slate-500/20', textColor: 'text-gray-600 dark:text-muted', borderColor: 'border-gray-500/30', dotColor: 'bg-gray-600',
          statLabel: null, statValue: null
        };
      default:
        return {
          icon: Layers, desc: 'Modul sistem ERP Zabran Workspaces.',
          color: 'from-white/50 to-white/30', textColor: 'text-gray-600 dark:text-muted', borderColor: 'border-glass-border', dotColor: 'bg-slate-600',
          statLabel: null, statValue: null
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full w-full">
        {/* Top Navigation */}
        <header className="relative z-10 w-full px-6 py-4 lg:px-12 lg:py-6 flex justify-between items-center bg-glass-bg backdrop-blur-md border-b border-glass-border shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-xl font-bold text-white tracking-wider">Z</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground tracking-tight">Zabran Workspaces</h1>
              <p className="text-[10px] text-muted font-medium uppercase tracking-widest">Master Hub</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Divisions</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Brands</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Tools</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Contact</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-glass-bg px-4 py-2 rounded-full border border-glass-border shadow-inner">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground leading-tight">{user.name}</p>
                <p className="text-[10px] text-indigo-600 font-semibold">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-glass-bg hover:bg-red-50 text-muted hover:text-red-500 rounded-full border border-glass-border shadow-sm transition-all"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Grid Content */}
        <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-3">Selamat Datang, {user.name} 👋</h2>
              <p className="text-muted max-w-2xl text-lg">Pilih modul fungsional di bawah ini untuk memulai pekerjaan Anda. Akses telah disesuaikan dengan divisi Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredGroups.map((group, idx) => {
                const meta = getGroupMetadata(group.group);
                const Icon = meta.icon;
                
                let accessibleCount = 0;
                let firstPath = '';
                
                group.items.forEach(item => {
                  if (item.subItems && item.subItems.length > 0) {
                    accessibleCount += item.subItems.length;
                    if (!firstPath) firstPath = item.subItems[0].path || '';
                  } else {
                    accessibleCount += 1;
                    if (!firstPath) firstPath = item.path || '';
                  }
                });

                return (
                  <GlassCard 
                    key={group.group} 
                    interactive
                    onClick={() => router.push(firstPath)}
                    className={`border ${meta.borderColor} p-6 flex flex-col group`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center border border-glass-border shadow-inner group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${meta.textColor}`} />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-glass-bg border border-glass-border flex items-center justify-center group-hover:bg-accent transition-colors">
                        <ArrowRight className={`w-4 h-4 ${meta.textColor} opacity-50 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-foreground mb-2">{group.group}</h3>
                    <p className="text-muted text-sm mb-6 flex-1">{meta.desc}</p>
                    
                    {/* Miniature list of available items */}
                    <div className="mb-6 h-20 overflow-hidden relative">
                      <div className="flex flex-wrap gap-2">
                        {group.items.slice(0, 4).map(item => (
                          <span key={item.name} className="px-2.5 py-1 bg-black/5 dark:bg-white/10 border border-glass-border rounded-lg text-xs font-medium text-muted shadow-sm whitespace-nowrap">
                            {item.name}
                          </span>
                        ))}
                        {accessibleCount > 4 && (
                          <span className="px-2.5 py-1 bg-black/10 dark:bg-white/5 border border-glass-border rounded-lg text-xs font-medium text-muted whitespace-nowrap">
                            +{accessibleCount - 4} lainnya
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-glass-border">
                      {meta.statLabel ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">{meta.statLabel}</span>
                          <span className={`text-sm font-extrabold ${meta.textColor}`}>{meta.statValue}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
                          <div className={`w-2 h-2 rounded-full ${meta.dotColor}`}></div>
                          {accessibleCount} Modul
                        </div>
                      )}
                      
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
