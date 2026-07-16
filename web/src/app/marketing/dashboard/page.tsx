'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  BarChart3, RefreshCw, AlertTriangle, TrendingUp, DollarSign, MousePointerClick
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';

export default function MarketingDashboardPage() {
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchData();
    }
  }, [selectedAccount]);

  const fetchAdAccounts = async () => {
    try {
      const res = await apiClient.get('/meta/ad-accounts');
      if (res.data.success && res.data.data.length > 0) {
        setAdAccounts(res.data.data);
        setSelectedAccount(res.data.data[0].id);
      }
    } catch (err) {}
  };

  const fetchData = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    setError('');
    
    try {
      const [campRes, statsRes] = await Promise.all([
        apiClient.get(`/meta/dashboard?adAccountId=${selectedAccount}`),
        apiClient.get(`/meta/dashboard-stats?adAccountId=${selectedAccount}`)
      ]);
      
      if (campRes.data.success) setCampaignData(campRes.data.data);
      if (statsRes.data.success) setTrendData(statsRes.data.data);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat data grafik.');
    } finally {
      setLoading(false);
    }
  };

  // Top Widgets Calculation
  const topCtr = [...campaignData].sort((a,b) => b.ctr - a.ctr)[0];
  const lowestCpc = [...campaignData].filter(c => c.cpc > 0).sort((a,b) => a.cpc - b.cpc)[0];
  const lowestCostConv = [...campaignData].filter(c => c.cost_per_conversation > 0).sort((a,b) => a.cost_per_conversation - b.cost_per_conversation)[0];
  const topSpend = [...campaignData].sort((a,b) => b.spend - a.spend)[0];
  const topReach = [...campaignData].sort((a,b) => b.reach - a.reach)[0];
  const topClick = [...campaignData].sort((a,b) => b.clicks - a.clicks)[0];

  const formatIdr = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-glass-bg p-6 rounded-2xl border border-glass-border">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              Marketing Dashboard
            </h1>
            <p className="text-sm text-muted mt-1">Overview visual dari seluruh performa campaign (Last 30 Days).</p>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-glass-bg border border-glass-border text-foreground rounded-xl px-4 py-2"
            >
              {adAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
            <button onClick={fetchData} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-500/10 text-red-400 rounded-xl">{error}</div>}

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Widget title="🏆 Best CTR" value={topCtr ? `${topCtr.ctr.toFixed(2)}%` : '-'} desc={topCtr?.campaign_name} />
          <Widget title="💰 Lowest CPC" value={lowestCpc ? formatIdr(lowestCpc.cpc) : '-'} desc={lowestCpc?.campaign_name} />
          <Widget title="🎯 Best Cost/Conv" value={lowestCostConv ? formatIdr(lowestCostConv.cost_per_conversation) : '-'} desc={lowestCostConv?.campaign_name} />
          <Widget title="🔥 Highest Spend" value={topSpend ? formatIdr(topSpend.spend) : '-'} desc={topSpend?.campaign_name} />
          <Widget title="📢 Highest Reach" value={topReach ? topReach.reach.toLocaleString('id-ID') : '-'} desc={topReach?.campaign_name} />
          <Widget title="🖱️ Highest Click" value={topClick ? topClick.clicks.toLocaleString('id-ID') : '-'} desc={topClick?.campaign_name} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Trend Spend */}
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border h-[350px]">
            <h3 className="text-white font-bold mb-4">Trend Spend per Hari</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" tick={{fontSize: 10}} />
                <YAxis stroke="#888" tickFormatter={(v) => `Rp${v/1000}k`} />
                <Tooltip contentStyle={{backgroundColor: '#0B0C10', borderColor: '#333'}} />
                <Line type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Trend CTR & CPC */}
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border h-[350px]">
            <h3 className="text-white font-bold mb-4">CTR & CPC Trend</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" tick={{fontSize: 10}} />
                <YAxis yAxisId="left" stroke="#10b981" />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" />
                <Tooltip contentStyle={{backgroundColor: '#0B0C10', borderColor: '#333'}} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR (%)" stroke="#10b981" />
                <Line yAxisId="right" type="monotone" dataKey="cpc" name="CPC (Rp)" stroke="#f43f5e" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart Comparison */}
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border h-[400px] lg:col-span-2">
            <h3 className="text-white font-bold mb-4">Campaign Comparison (Spend vs Clicks)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={campaignData.map(c => ({ name: c.campaign_name.substring(0,20)+'...', spend: c.spend, clicks: c.clicks }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" tick={{fontSize: 10}} />
                <YAxis yAxisId="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" />
                <Tooltip contentStyle={{backgroundColor: '#0B0C10', borderColor: '#333'}} />
                <Legend />
                <Bar yAxisId="left" dataKey="spend" fill="#3b82f6" name="Spend (Rp)" radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="clicks" fill="#8b5cf6" name="Clicks" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scatter Chart */}
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border h-[350px] lg:col-span-2">
            <h3 className="text-white font-bold mb-4">Scatter Plot: CTR vs Cost per Conversation</h3>
            <ResponsiveContainer width="100%" height="85%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" dataKey="ctr" name="CTR (%)" stroke="#888" />
                <YAxis type="number" dataKey="cost_per_conversation" name="Cost per Conv (Rp)" stroke="#888" />
                <ZAxis type="category" dataKey="campaign_name" name="Campaign" />
                <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: '#0B0C10', borderColor: '#333'}} />
                <Scatter name="Campaigns" data={campaignData.filter(c => c.ctr > 0 && c.cost_per_conversation > 0)} fill="#ec4899" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

function Widget({ title, value, desc }: { title: string, value: string, desc?: string }) {
  return (
    <div className="bg-glass-bg p-4 rounded-2xl border border-glass-border flex flex-col justify-between min-h-[120px]">
      <p className="text-xs font-semibold text-muted">{title}</p>
      <h3 className="text-xl font-bold text-white my-2">{value}</h3>
      <p className="text-[10px] text-gray-500 truncate" title={desc}>{desc || 'N/A'}</p>
    </div>
  );
}
