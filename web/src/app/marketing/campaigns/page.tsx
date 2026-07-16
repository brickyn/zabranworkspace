'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  BarChart2, RefreshCw, DollarSign, MousePointerClick, 
  MessageCircle, TrendingUp, AlertCircle, Search 
} from 'lucide-react';
import { apiClient } from '@/lib/axios';

export default function MarketingIntelligencePage() {
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchDashboardData();
    }
  }, [selectedAccount]);

  const fetchAdAccounts = async () => {
    setLoadingAccounts(true);
    setError('');
    try {
      const res = await apiClient.get('/meta/ad-accounts');
      if (res.data.success && res.data.data.length > 0) {
        setAdAccounts(res.data.data);
        setSelectedAccount(res.data.data[0].id);
      } else {
        setError('Tidak ada Ad Account yang ditemukan.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat daftar Ad Account.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!selectedAccount) return;
    
    setLoadingData(true);
    setError('');
    try {
      const res = await apiClient.get(`/meta/dashboard?adAccountId=${selectedAccount}`);
      if (res.data.success) {
        setDashboardData(res.data.data);
      } else {
        setError(res.data.error || 'Gagal memuat data dashboard.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal terhubung ke server ERP saat memuat dashboard.');
    } finally {
      setLoadingData(false);
    }
  };

  // Kalkulasi Summary
  const totalSpend = dashboardData.reduce((acc, curr) => acc + (curr.spend || 0), 0);
  const totalClicks = dashboardData.reduce((acc, curr) => acc + (curr.link_click || 0), 0);
  const totalConversations = dashboardData.reduce((acc, curr) => acc + (curr.messaging_conversation_started || 0), 0);
  const avgCtr = dashboardData.length > 0 ? (dashboardData.reduce((acc, curr) => acc + (curr.ctr || 0), 0) / dashboardData.length) : 0;
  const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-glass-bg p-6 rounded-2xl border border-glass-border">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-blue-400" />
              Campaign Performance
            </h1>
            <p className="text-sm text-muted mt-1">
              Pantau detail dan performa masing-masing kampanye Meta Ads.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {loadingAccounts ? (
              <div className="animate-pulse h-10 w-48 bg-white/5 rounded-xl"></div>
            ) : (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="bg-glass-bg border border-glass-border text-foreground rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 w-full md:w-auto"
              >
                {adAccounts.length === 0 && <option value="">Pilih Ad Account</option>}
                {adAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.account_id})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={fetchDashboardData}
              disabled={loadingData || !selectedAccount}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Terjadi Kesalahan</h3>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted">Total Spend</p>
            </div>
            <h3 className="text-2xl font-bold text-white">
              Rp {totalSpend.toLocaleString('id-ID')}
            </h3>
          </div>

          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted">Total Clicks</p>
            </div>
            <h3 className="text-2xl font-bold text-white">
              {totalClicks.toLocaleString('id-ID')}
            </h3>
          </div>

          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                <MessageCircle className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted">Total Conversations</p>
            </div>
            <h3 className="text-2xl font-bold text-white">
              {totalConversations.toLocaleString('id-ID')}
            </h3>
          </div>

          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted">Avg CTR</p>
            </div>
            <h3 className="text-2xl font-bold text-white">
              {avgCtr.toFixed(2)}%
            </h3>
          </div>

          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                <BarChart2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted">Avg CPC</p>
            </div>
            <h3 className="text-2xl font-bold text-white">
              Rp {avgCpc.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </h3>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-glass-bg rounded-2xl border border-glass-border overflow-hidden">
          <div className="p-6 border-b border-glass-border flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Campaign Performance</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari campaign..." 
                className="pl-9 pr-4 py-2 bg-glass-bg border border-glass-border rounded-xl text-sm text-foreground focus:outline-none focus:border-blue-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap">Campaign Name</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Spend</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Reach</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Clicks</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">CTR / CPC</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Conv. Started</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Cost per Conv.</th>
                  <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loadingData ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-blue-500" />
                        <p>Mengambil data dari Meta Graph API...</p>
                      </div>
                    </td>
                  </tr>
                ) : dashboardData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted">
                      Tidak ada data campaign untuk Ad Account ini.
                    </td>
                  </tr>
                ) : (
                  dashboardData.map((camp, idx) => (
                    <tr key={camp.campaign_id || idx} className="hover:bg-nav-hover transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-medium text-white max-w-[200px] truncate" title={camp.campaign_name}>
                          {camp.campaign_name}
                        </p>
                        <p className="text-[10px] text-gray-500">{camp.objective}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                          camp.effective_status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-muted'
                        }`}>
                          {camp.effective_status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-sm text-muted">
                        Rp {camp.spend.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-right text-sm text-muted">
                        {camp.reach.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-right text-sm text-muted">
                        {camp.clicks.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-sm text-white">{camp.ctr.toFixed(2)}%</p>
                        <p className="text-[10px] text-gray-500">Rp {camp.cpc.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                      </td>
                      <td className="p-4 text-right text-sm font-medium text-white">
                        {camp.messaging_conversation_started.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-right text-sm text-muted">
                        Rp {camp.cost_per_conversation.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-4 text-right">
                        {camp.purchase_roas > 0 ? (
                          <span className="text-sm font-bold text-green-400">{camp.purchase_roas.toFixed(2)}x</span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
