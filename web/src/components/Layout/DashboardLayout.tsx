'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AskAI from '../AskAI';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import CommandPalette from '@/components/ui/CommandPalette';
import NotificationCenter from '@/components/ui/NotificationCenter';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  Receipt,
  Store,
  ChevronDown,
  TrendingUp,
  LineChart,
  Tag,
  Target,
  Percent,
  Wallet,
  Wrench,
  FileText,
  BarChart2,
  Landmark,
  Briefcase,
  Key,
  Shield,
  Activity,
  Search as SearchIcon,
  Home,
  AlertTriangle,
  LayoutGrid,
  Sun,
  Moon,
  ArrowLeft,
  BookOpen
} from 'lucide-react';

export type MenuItem = {
  name: string;
  icon?: any;
  path?: string;
  roles: string[];
  subItems?: MenuItem[];
};

export type MenuGroup = {
  group: string;
  items: MenuItem[];
};

export const MENU_GROUPS: MenuGroup[] = [
  {
    group: 'Utama',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Finance'] }
    ]
  },
  {
    group: 'Transaksi',
    items: [
      { name: 'Kasir (POS)', icon: Receipt, path: '/zpos/new-transaction', roles: ['Super Admin', 'Admin', 'Cashier', 'Leader'] },
      { name: 'Riwayat Transaksi', icon: FileText, path: '#', roles: ['Super Admin', 'Admin', 'Cashier', 'Leader', 'Manager'] },
      { name: 'Petty Cash', icon: Wallet, path: '#', roles: ['Super Admin', 'Cashier', 'Leader', 'Manager'] },
      { name: 'Rekap Shift', icon: Activity, path: '#', roles: ['Super Admin', 'Cashier', 'Leader', 'Manager'] },
    ]
  },
  {
    group: 'Operasional',
    items: [
      {
        name: 'Produk & Inventaris', icon: Package, roles: ['Super Admin', 'Admin', 'Warehouse', 'Manager', 'Leader', 'Cashier'],
        subItems: [
          { name: 'Data Produk', path: '/products', roles: ['Super Admin', 'Admin', 'Warehouse', 'Manager', 'Leader'] },
          { name: 'Transfer / Penerimaan Stok', path: '/stock-transfer', roles: ['Super Admin', 'Admin', 'Warehouse', 'Manager', 'Leader', 'Cashier'] },
          { name: 'Stock Opname', path: '/stock-opname', roles: ['Super Admin', 'Admin', 'Warehouse', 'Manager', 'Leader'] },
        ]
      },
      { name: 'Pembelian (PO)', icon: ShoppingCart, path: '/pembelian', roles: ['Super Admin', 'Management', 'Manager'] },
      { name: 'Data Penjualan', icon: LineChart, path: '/sales', roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Finance'] },
      { name: 'Promo & Kampanye', icon: Tag, path: '/promo', roles: ['Super Admin', 'Management', 'Manager'] },
    ]
  },
  {
    group: 'Layanan',
    items: [
      { name: 'Sewa & Rental', icon: Key, path: '/sewa', roles: ['Super Admin', 'Admin', 'Cashier', 'Leader'] },
      { name: 'Servis Center', icon: Wrench, path: '/service-center', roles: ['Super Admin', 'Admin', 'Cashier', 'Leader', 'Teknisi'] },
      { name: 'Garansi', icon: Shield, path: '/warranty', roles: ['Super Admin', 'Admin', 'Cashier', 'Leader'] },
    ]
  },
  {
    group: 'KPI & Target',
    items: [
      { name: 'Sales Targets', icon: Target, path: '/sales-targets', roles: ['Super Admin', 'Leader', 'Management', 'Manager'] },
    ]
  },
  {
    group: 'Divisi B2B',
    items: [
      {
        name: 'B2B & Partnership', icon: Briefcase, roles: ['Super Admin', 'Management', 'Leader', 'Manager'],
        subItems: [
          { name: 'Dashboard B2B', path: '/b2b', roles: ['Super Admin', 'Management', 'Leader', 'Manager'] },
          { name: 'Aktivitas B2B', path: '/b2b/activities', roles: ['Super Admin', 'Management', 'Leader', 'Manager'] },
          { name: 'Jadwal & Gantt', path: '/b2b/schedules', roles: ['Super Admin', 'Management', 'Leader', 'Manager'] },
        ]
      }
    ]
  },
  {
    group: 'Divisi BSB',
    items: [
      {
        name: 'Buku Sekolah Bisnis', icon: BookOpen, roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Admin'],
        subItems: [
          { name: 'Dashboard BSB', path: '/bsb', roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Admin'] },
          { name: 'Aktivitas BSB', path: '/bsb/activities', roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Admin'] },
          { name: 'Data Penjualan Scalev', path: '/bsb/scalev', roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Admin'] },
        ]
      }
    ]
  },
  {
    group: 'CRM & Pelanggan',
    items: [
      {
        name: 'Customer Relations', icon: Users, roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Admin', 'Cashier'],
        subItems: [
          { name: 'Dashboard CRM', path: '/crm', roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Admin'] },
          { name: 'Database Pelanggan', path: '/customers', roles: ['Super Admin', 'Management', 'Leader', 'Cashier', 'Admin', 'Manager'] },
          { name: 'Pelanggan Loyal', path: '/crm/loyal-customers', roles: ['Super Admin', 'Management', 'Leader', 'Cashier', 'Admin', 'Manager'] },
          { name: 'Repeat Orders', path: '/crm/repeat-orders', roles: ['Super Admin', 'Management', 'Leader', 'Cashier', 'Admin', 'Manager'] },
          { name: 'Rekap Rating (G-Maps)', path: '/crm/daily-reviews', roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Admin'] },
          { name: 'Mystery Guest', path: '/crm/mystery-guest', roles: ['Super Admin', 'Management', 'Leader', 'Manager', 'Admin'] },
        ]
      }
    ]
  },
  {
    group: 'Keuangan',
    items: [
      { name: 'Laporan Setor Tunai', icon: Wallet, path: '/setor-tunai', roles: ['Super Admin', 'Management', 'Leader'] },
      { name: 'Keuangan & Akunting', icon: Landmark, path: '/finance', roles: ['Super Admin', 'Finance', 'Management', 'Manager'] },
      { name: 'Cash Management', icon: Wallet, path: '/cash-management', roles: ['Super Admin', 'Finance', 'Management', 'Manager'] },
      { name: 'Biaya Operasional', icon: Wallet, path: '/biaya', roles: ['Super Admin', 'Management', 'Finance', 'Manager'] },
      { name: 'Margin Report', icon: Percent, path: '/margin-report', roles: ['Super Admin', 'Management', 'Finance'] },
    ]
  },
  {
    group: 'Laporan & Analytics',
    items: [
      { name: 'Laporan Umum', icon: FileText, path: '/laporan', roles: ['Super Admin', 'Leader', 'Management', 'Finance', 'Manager'] },
      { name: 'Analytics', icon: BarChart2, path: '/analytics', roles: ['Super Admin', 'Management', 'Finance'] },
      {
        name: 'Marketing Intelligence', icon: BarChart2, roles: ['Super Admin', 'Management'],
        subItems: [
          { name: 'Dashboard Marketing', path: '/marketing/dashboard', roles: ['Super Admin', 'Management'] },
          { name: 'Campaign Performance', path: '/marketing/campaigns', roles: ['Super Admin', 'Management'] },
          { name: 'AI Analyst', path: '/marketing/ai-analyst', roles: ['Super Admin', 'Management'] }
        ]
      },
    ]
  },
  {
    group: 'Pengaturan',
    items: [
      { name: 'Import Data Historis', icon: Activity, path: '/data-import', roles: ['Super Admin', 'Management'] },
      { name: 'Cabang', icon: Store, path: '/branches', roles: ['Super Admin', 'Management'] },
      { name: 'Users', icon: Users, path: '/users', roles: ['Super Admin', 'Management'] },
      { name: 'Role Delegations', icon: Shield, path: '/delegations', roles: ['Super Admin', 'Owner'] },
      { name: 'Pengaturan', icon: Settings, path: '/settings', roles: ['Super Admin', 'Management'] },
    ]
  }
];

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  // Global Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.data.success) {
      }
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.debug('Polling notifications failed.');
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.length < 2) { return; }
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiClient.get('/search', { params: { q: value } });
      } catch { /* silently fail */ }
      finally { setIsSearching(false); }
    }, 400);
  };

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Master Hub Mode: render fullscreen directly
  if (pathname === '/hub') {
    return (
      <div className="h-screen bg-background text-foreground font-sans relative overflow-hidden">
        {/* Abstract Background Elements (Glassmorphism environment) */}
        <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-300/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-300/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed top-[30%] left-[40%] w-[400px] h-[400px] bg-pink-300/30 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="h-full relative z-10 overflow-y-auto">
          {children}
        </div>
        <AskAI />
      </div>
    );
  }

  // --- Normal Module Layout --- //

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

  const filteredGroups = MENU_GROUPS.map(group => {
    const filteredItems = group.items.filter(item => {
      if (item.subItems) {
        return hasMenuPermission(item.roles, item.path || item.subItems[0].path);
      }
      return hasMenuPermission(item.roles, item.path);
    }).map(item => {
      if (item.subItems) {
        const fSubs = item.subItems.filter(sub => hasMenuPermission(sub.roles, sub.path));
        return { ...item, subItems: fSubs };
      }
      return item;
    });
    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  // Determine Active Group and Tabs
  let activeGroup: any = null;
  filteredGroups.forEach(group => {
    group.items.forEach((item: any) => {
      if (item.path && pathname.startsWith(item.path.split('?')[0])) activeGroup = group;
      if (item.subItems) {
        item.subItems.forEach((sub: any) => {
          if (sub.path && pathname.startsWith(sub.path.split('?')[0])) activeGroup = group;
        });
      }
    });
  });

  const activeTabs: { name: string; path: string; icon?: any }[] = [];
  if (activeGroup && activeGroup.items) {
    activeGroup.items.forEach((item: any) => {
      if (item.subItems) {
        item.subItems.forEach((sub: any) => {
          if (sub.path) activeTabs.push({ name: sub.name, path: sub.path, icon: item.icon });
        });
      } else if (item.path) {
        activeTabs.push({ name: item.name, path: item.path, icon: item.icon });
      }
    });
  }

  const isMegaMenuAllowed = ['Super Admin', 'Owner', 'Director', 'Management', 'Manager', 'General Manager', 'Admin'].includes(user.role);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden flex flex-col">
      {/* Background Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-300/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-300/40 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Global Command Palette (CMD+K) */}
      <CommandPalette />
      
      {/* TopNav */}
      <header className="relative z-20 w-full px-6 py-4 flex flex-col gap-4 bg-glass-bg backdrop-blur-md border-b border-glass-border shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/hub')}
              className="p-2 bg-glass-bg hover:bg-nav-hover rounded-xl border border-glass-border shadow-sm transition-all text-muted hover:text-indigo-600 flex items-center gap-2"
              title="Kembali ke Master Hub"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-semibold">Master Hub</span>
            </button>
            <div className="h-6 w-px bg-glass-border"></div>
            {activeGroup && (
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2 tracking-tight">
                {activeGroup.group}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search (Trigger Command Palette) */}
            <div className="hidden lg:flex relative w-64">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <div
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="w-full bg-glass-bg border border-glass-border rounded-full pl-10 pr-4 py-2 text-sm text-muted cursor-text hover:bg-nav-hover transition-all shadow-inner flex items-center justify-between"
              >
                <span>Cari data...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-500">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>

            {/* Instant Switcher Mega Menu */}
            {isMegaMenuAllowed && (
              <div className="relative">
                <button 
                  onClick={() => setShowMegaMenu(!showMegaMenu)}
                  className={`p-2.5 rounded-full border shadow-sm transition-all ${showMegaMenu ? 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-400 dark:border-indigo-700' : 'bg-glass-bg text-muted border-glass-border hover:bg-nav-hover'}`}
                  title="Instant Switcher"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showMegaMenu && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowMegaMenu(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-[600px] max-h-[70vh] overflow-y-auto bg-white/95 dark:bg-[#0B0C10]/95 backdrop-blur-xl border border-glass-border shadow-2xl rounded-3xl z-40 p-6 grid grid-cols-2 gap-6"
                      >
                        <h3 className="col-span-2 text-lg font-bold text-foreground border-b border-glass-border pb-2 mb-2">Instant Switcher</h3>
                        {filteredGroups.map(group => (
                          <div key={group.group} className="space-y-2">
                            <h4 className="text-xs font-bold text-muted uppercase tracking-wider">{group.group}</h4>
                            <div className="space-y-1">
                              {group.items.map(item => {
                                if (item.subItems) {
                                  return item.subItems.map(sub => (
                                    <Link key={sub.name} href={sub.path || '#'} onClick={() => setShowMegaMenu(false)} className="block px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-nav-hover hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                      {sub.name}
                                    </Link>
                                  ));
                                }
                                return (
                                  <Link key={item.name} href={item.path || '#'} onClick={() => setShowMegaMenu(false)} className="block px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-nav-hover hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                    {item.name}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 bg-glass-bg hover:bg-nav-hover rounded-full border border-glass-border shadow-sm transition-all text-muted hover:text-indigo-500 relative"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-3 bg-glass-bg px-3 py-1.5 rounded-full border border-glass-border shadow-inner">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="text-right pr-2">
                <p className="text-xs font-bold text-foreground leading-tight">{user.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Tab Bar (Sub-Navigation) */}
        {activeTabs.length > 0 && (
          <div className="flex items-center bg-black/5 dark:bg-white/5 backdrop-blur-md p-1.5 rounded-full border border-glass-border overflow-x-auto w-max max-w-full shadow-inner hide-scrollbar mt-2">
            {activeTabs.map(tab => {
              const [tabPath, tabQuery] = tab.path.split('?');
              let isActive = false;
              if (pathname === tabPath) {
                if (tabQuery) {
                  const searchTab = searchParams.get('tab');
                  const requiredTab = new URLSearchParams(tabQuery).get('tab');
                  isActive = searchTab === requiredTab;
                } else {
                  isActive = true;
                }
              }
              const Icon = tab.icon;

              return (
                <Link 
                  key={tab.name} 
                  href={tab.path}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap relative ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#1F2833] shadow-md scale-100 z-10'
                      : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 scale-95 hover:scale-100'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.name}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area (Glassmorphism panels should be implemented inside pages) */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>

      <AskAI />

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
