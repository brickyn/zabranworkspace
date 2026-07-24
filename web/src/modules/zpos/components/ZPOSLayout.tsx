'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  History, 
  Download, 
  Truck, 
  BarChart2, 
  User, 
  LogOut,
  Menu,
  X,
  Wallet
} from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { OpenSessionModal } from '@/components/zpos/OpenSessionModal';
import { CloseSessionModal } from '@/components/zpos/CloseSessionModal';
import { SessionContext } from './SessionContext';
import { apiClient } from '@/lib/axios';

export type ZPOSMenuItem = {
  name: string;
  icon: any;
  path: string;
  roles: string[];
};

export const ZPOS_MENU: ZPOSMenuItem[] = [
  { name: 'New Transaction', icon: ShoppingCart, path: '/zpos/new-transaction', roles: ['Cashier', 'Leader', 'Manager', 'Super Admin'] },
  { name: 'Transaction History', icon: History, path: '/zpos/transactions', roles: ['Cashier', 'Leader', 'Manager', 'Super Admin'] },
  { name: 'Store Receiving', icon: Download, path: '/zpos/receiving', roles: ['Cashier', 'Leader', 'Manager', 'Super Admin'] },
  { name: 'Transfer History', icon: Truck, path: '/zpos/transfers', roles: ['Cashier', 'Leader', 'Manager', 'Super Admin'] },
  { name: 'Sales Dashboard', icon: BarChart2, path: '/zpos/dashboard', roles: ['Leader', 'Manager', 'Super Admin', 'Owner'] },
];

export default function ZPOSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [showCloseSession, setShowCloseSession] = useState(false);
  const [showOpenSession, setShowOpenSession] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await apiClient.get('/sessions/current');
      if (res.data.success && res.data.data) {
        setSession(res.data.data);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSessionLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      const allowedRoles = ['Cashier', 'Leader', 'Manager', 'Super Admin', 'Owner'];
      if (!allowedRoles.includes(parsedUser.role)) {
        router.push('/dashboard');
        return;
      }
      setUser(parsedUser);
      
      const token = localStorage.getItem('token');
      if (token) {
        fetchSession();
      } else {
        setIsSessionLoading(false);
      }
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredMenu = ZPOS_MENU.filter(item => item.roles.includes(user.role));

  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-indigo-100">
        
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col shrink-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-600/20">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-800">ZPOS</span>
            </div>
            <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1 custom-scrollbar">
            <div className="px-3 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Store Operations
            </div>
            {filteredMenu.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/5' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.role}</p>
              </div>
            </div>
            
            {session ? (
              <button
                onClick={() => setShowCloseSession(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 text-sm font-medium text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 rounded-xl transition-all"
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>Tutup Shift (EOD)</span>
              </button>
            ) : (
              <button
                onClick={() => setShowOpenSession(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all"
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>Buka Shift Kasir</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden relative">
          <SessionContext.Provider value={{ session, isSessionLoading, showOpenSession, setShowOpenSession, fetchSession }}>
            {/* Topbar Mobile */}
            <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shrink-0">
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-md mr-3"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-bold text-slate-800">ZPOS</span>
            </header>

            <div className="flex-1 w-full h-full relative overflow-hidden">
              {children}
            </div>
            
            {/* Modals */}
            <OpenSessionModal 
              isOpen={showOpenSession} 
              onSuccess={() => {
                setShowOpenSession(false);
                fetchSession();
              }} 
              onClose={() => setShowOpenSession(false)}
            />
            
            <CloseSessionModal 
              isOpen={showCloseSession} 
              onClose={() => setShowCloseSession(false)} 
              session={session} 
            />
          </SessionContext.Provider>
        </main>
      </div>
    </ThemeProvider>
  );
}
