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
  roles: string[]; // Cashier, Leader, Manager, Super Admin, Owner
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
  const [isSidebarOpen, setSidebarOpen] = useState(false);
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
      // Ensure user has access
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
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Filter menu based on roles
  const filteredMenu = ZPOS_MENU.filter(item => item.roles.includes(user.role));

  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden selection:bg-blue-100">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-gray-900">ZPOS</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Store Operations
            </div>
            {filteredMenu.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            </div>
            
            {session ? (
              <button
                onClick={() => setShowCloseSession(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Tutup Shift (EOD)
              </button>
            ) : (
              <button
                onClick={() => setShowOpenSession(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Buka Shift Kasir
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
          <SessionContext.Provider value={{ session, isSessionLoading, showOpenSession, setShowOpenSession, fetchSession }}>
            {/* Topbar Mobile */}
            <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 shrink-0">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md mr-3"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-bold text-gray-900">ZPOS</span>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
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
