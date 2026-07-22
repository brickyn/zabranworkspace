'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';

// Role-based landing pages after login
const ROLE_REDIRECT: Record<string, string> = {
  'Super Admin': '/dashboard',
  'Management': '/dashboard',
  'Leader': '/dashboard',
  'Manager': '/dashboard',
  'Admin': '/dashboard',
  'Finance': '/finance',
  'Cashier': '/zpos/new-transaction',
  'Warehouse': '/products',
  'Teknisi': '/service-center',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/login', { email, password });

      if (res.data.success) {
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (user.role === 'Cashier') {
          router.push('/zpos/new-transaction');
        } else if (user.role === 'Leader') {
          router.push('/zpos/dashboard');
        } else if (user.role === 'Warehouse') {
          router.push('/products');
        } else {
          // Master Hub redirect for ERP roles
          router.push('/hub');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Email atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-glass-bg flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-glass-bg backdrop-blur-xl border border-glass-border rounded-3xl shadow-2xl p-8 z-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
            <span className="text-2xl font-bold text-white tracking-wider">Z</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Zabran Workspaces</h1>
          <p className="text-sm text-gray-500 mb-1">PT Zabran Internasional Grup</p>
          <p className="text-muted text-sm">Masukkan kredensial Anda untuk melanjutkan</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-glass-bg/50 border border-glass-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="admin@zabran.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-muted">Password</label>
              <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-glass-bg/50 border border-glass-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Masuk</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center z-10">
        <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
          <img src="/logo-zabran-group.jpg" alt="Zabran" className="h-6 object-contain rounded opacity-50 hover:opacity-80 transition-opacity" />
          <img src="/logo-republic-laptop.jpg" alt="RL" className="h-6 object-contain rounded opacity-50 hover:opacity-80 transition-opacity" />
          <img src="/logo-importir-laptop.png" alt="IL" className="h-6 object-contain rounded opacity-50 hover:opacity-80 transition-opacity" />
          <img src="/logo-bsb.png" alt="BSB" className="h-6 object-contain rounded opacity-50 hover:opacity-80 transition-opacity" />
        </div>
        <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} PT Zabran Internasional Grup. All rights reserved.</p>
      </div>
    </div>
  );
}
