'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Crown, Loader2, Download, Database } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import CRMFilter from '@/components/CRMFilter';

export default function LoyalCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterBranch, setFilterBranch] = useState('');
  const [filterType, setFilterType] = useState('month'); // exact, month, year, all
  const [filterExactDate, setFilterExactDate] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  const [branches, setBranches] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBranch) params.append('branchId', filterBranch);
      if (filterType === 'exact' && filterExactDate) {
        params.append('startDate', filterExactDate);
        params.append('endDate', filterExactDate);
      } else if (filterType === 'month') {
        params.append('month', filterMonth.toString());
        params.append('year', filterYear.toString());
      } else if (filterType === 'year') {
        params.append('year', filterYear.toString());
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const [leaderboardRes, branchRes] = await Promise.all([
        apiClient.get(`/crm/leaderboard${query}`),
        apiClient.get('/branches')
      ]);

      if (leaderboardRes.data.success) {
        // Filter out customers with only 1 purchase (only keep > 1)
        const repeatCustomers = leaderboardRes.data.data.topLoyal.filter((c: any) => c.yearlyQty > 1);
        setCustomers(repeatCustomers);
      }
      if (branchRes.data.success) {
        setBranches(branchRes.data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data pelanggan loyal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterBranch, filterType, filterExactDate, filterMonth, filterYear]);

  const handleExportExcel = () => {
    const dataToExport = customers.map(c => ({
      'Nama Pelanggan': c.customerName,
      'No. WhatsApp': c.phone,
      'Total Pembelian (Qty)': c.yearlyQty,
      'Total Nominal (Rp)': c.yearlyAmount,
      'Loyalty Badge': c.loyaltyBadge,
      'Follow-up Terakhir': c.lastFollowUp ? new Date(c.lastFollowUp).toLocaleDateString('id-ID') : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loyal Customers");
    XLSX.writeFile(wb, "Data_Loyal_Customers_CRM.xlsx");
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              Loyal Customers Database
            </h1>
            <p className="text-muted text-sm">Daftar pelanggan setia yang telah berbelanja lebih dari satu kali.</p>
          </div>
          
          <div className="flex gap-3">
            <CRMFilter 
              filterType={filterType} setFilterType={setFilterType}
              filterExactDate={filterExactDate} setFilterExactDate={setFilterExactDate}
              filterMonth={filterMonth} setFilterMonth={setFilterMonth}
              filterYear={filterYear} setFilterYear={setFilterYear}
              filterBranch={filterBranch} setFilterBranch={setFilterBranch}
              branches={branches}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20 text-yellow-400">
            <Database className="w-4 h-4" />
            <span className="text-sm font-semibold">{customers.length} Loyal Customers</span>
          </div>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>

        {/* Table */}
        <div className="bg-glass-bg border border-glass-border rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full text-sm text-left text-muted">
                <thead className="text-xs text-muted uppercase bg-glass-bg sticky top-0 z-10 shadow-sm border-b border-glass-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Pelanggan</th>
                    <th className="px-6 py-4 font-semibold text-center">Total Belanja (Qty)</th>
                    <th className="px-6 py-4 font-semibold text-right">Total Nominal</th>
                    <th className="px-6 py-4 font-semibold text-center">Badge Loyalitas</th>
                    <th className="px-6 py-4 font-semibold">Follow-up Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {customers.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-500">Belum ada pelanggan loyal yang melakukan repeat order</td></tr>
                  ) : (
                    customers.map((c, i) => (
                      <tr key={i} className="hover:bg-nav-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white mb-1">{c.customerName}</div>
                          <div className="text-xs text-gray-500 font-mono">{c.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-white text-lg">
                          {c.yearlyQty}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-green-400">
                          Rp {c.yearlyAmount?.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {c.loyaltyBadge === 'Platinum' && <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30">💎 Platinum</span>}
                          {c.loyaltyBadge === 'Gold' && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-500/30">🥇 Gold</span>}
                          {c.loyaltyBadge === 'Silver' && <span className="px-3 py-1 bg-gray-400/20 text-muted text-xs rounded border border-gray-400/30">🥈 Silver</span>}
                          {c.loyaltyBadge === 'Bronze' && <span className="px-3 py-1 bg-orange-700/20 text-orange-300 text-xs rounded border border-orange-700/30">🥉 Bronze</span>}
                          {c.loyaltyBadge === 'Loyal' && <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">⭐ Loyal</span>}
                          {c.loyaltyBadge === 'Reguler' && <span className="px-3 py-1 bg-gray-500/20 text-muted text-xs rounded border border-gray-500/30">Reguler</span>}
                        </td>
                        <td className="px-6 py-4">
                          {c.lastFollowUp ? new Date(c.lastFollowUp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
