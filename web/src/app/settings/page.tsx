'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Settings as SettingsIcon, Save, Loader2, Store, Receipt, Percent } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    STORE_NAME: 'Zabran Enterprise',
    STORE_PHONE: '',
    STORE_ADDRESS: '',
    RECEIPT_FOOTER: 'Thank you for your purchase!',
    TAX_RATE: '11',
    STORE_LOGO: '',
  });

  useEffect(() => {
    // Check role, only Super Admin allowed
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.role !== 'Super Admin') {
      toast.error('Unauthorized access. Redirecting...');
      router.push('/dashboard');
      return;
    }

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/settings');
      if (res.data.success && res.data.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiClient.post('/settings', settings);
      if (res.data.success) {
        toast.success('Settings saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 h-full flex flex-col pb-10">
        <div className="flex justify-between items-center bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="w-7 h-7 text-blue-500" />
              Global Settings
            </h1>
            <p className="text-muted mt-1 text-sm">Manage system-wide configuration, receipt templates, and defaults.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all font-medium"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Store Info */}
          <div className="bg-glass-bg border border-glass-border rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-400" />
              Store Information
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-muted ml-1">Store Name</label>
                <input 
                  name="STORE_NAME" 
                  value={settings.STORE_NAME || ''} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted ml-1">Store Phone Number</label>
                <input 
                  name="STORE_PHONE" 
                  value={settings.STORE_PHONE || ''} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted ml-1">Address / Location</label>
                <textarea 
                  name="STORE_ADDRESS" 
                  value={settings.STORE_ADDRESS || ''} 
                  onChange={handleChange} 
                  rows={3}
                  className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all resize-none" 
                />
              </div>
            </div>
          </div>

          {/* Preferences & Receipt */}
          <div className="space-y-6">
            <div className="bg-glass-bg border border-glass-border rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Percent className="w-5 h-5 text-orange-400" />
                Financial & Tax
              </h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Default Tax Rate (%)</label>
                  <input 
                    name="TAX_RATE" 
                    type="number"
                    value={settings.TAX_RATE || ''} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" 
                  />
                  <p className="text-xs text-gray-500 ml-1">Used for B2B and specific corporate transactions.</p>
                </div>
              </div>
            </div>

            <div className="bg-glass-bg border border-glass-border rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-400" />
                Receipt Customization
              </h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Footer Message</label>
                  <textarea 
                    name="RECEIPT_FOOTER" 
                    value={settings.RECEIPT_FOOTER || ''} 
                    onChange={handleChange} 
                    rows={3}
                    placeholder="e.g. Barang yang sudah dibeli tidak dapat ditukar."
                    className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all resize-none" 
                  />
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}
