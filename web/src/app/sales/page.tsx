'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Search, FileText, Ban, Loader2, Download, Calendar, Activity, CreditCard, Users, Store } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function SalesDataCenter() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'datacenter'>('dashboard');
  
  // Data Center State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [search, setSearch] = useState('');
  const [isVoiding, setIsVoiding] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState<string | null>(null);

  // Filters
  const [branches, setBranches] = useState<any[]>([]);
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Dashboard State
  const [summary, setSummary] = useState<any>(null);
  const [historical, setHistorical] = useState<any[]>([]);
  const [loadingDash, setLoadingDash] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (activeTab === 'datacenter') {
      fetchTransactions();
    } else {
      fetchSummary();
    }
  }, [activeTab, filterBranch, filterMonth, filterYear]);

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get('/branches');
      if (res.data.success) {
        setBranches(res.data.data);
      }
    } catch (error) {}
  };

  const fetchTransactions = async () => {
    try {
      setLoadingTx(true);
      
      let start_date = '';
      let end_date = '';
      if (filterMonth !== 'all' && filterYear !== 'all') {
        start_date = `${filterYear}-${filterMonth.padStart(2, '0')}-01`;
        const lastDay = new Date(Number(filterYear), Number(filterMonth), 0).getDate();
        end_date = `${filterYear}-${filterMonth.padStart(2, '0')}-${lastDay}T23:59:59`;
      } else if (filterYear !== 'all') {
        start_date = `${filterYear}-01-01`;
        end_date = `${filterYear}-12-31T23:59:59`;
      }

      const res = await apiClient.get('/transactions', {
        params: {
          branch_id: filterBranch !== 'all' ? filterBranch : undefined,
          start_date: start_date || undefined,
          end_date: end_date || undefined,
          pageSize: 500
        }
      });
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoadingTx(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoadingDash(true);
      const res = await apiClient.get('/dashboard/sales-summary', {
        params: { month: new Date().getMonth() + 1, year: new Date().getFullYear(), branchId: 'all' }
      });
      const histRes = await apiClient.get('/dashboard/historical', {
        params: { yearFrom: new Date().getFullYear() - 1, yearTo: new Date().getFullYear(), branchId: 'all' }
      });
      
      if (res.data.success) {
        setSummary(res.data.data);
      }
      if (histRes.data.success) {
        setHistorical(histRes.data.data);
      }
    } catch (error) {
      toast.error('Failed to load sales summary');
    } finally {
      setLoadingDash(false);
    }
  };

  const handleVoid = async (id: string) => {
    if (!window.confirm('Are you sure you want to VOID this transaction? This action will restock the items and cannot be undone.')) return;
    
    setIsVoiding(id);
    try {
      await apiClient.patch(`/transactions/${id}/void`);
      toast.success('Transaction voided successfully');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to void transaction');
    } finally {
      setIsVoiding(null);
    }
  };

  const handleReturn = async (id: string) => {
    if (!window.confirm('Are you sure you want to RETURN this transaction? The items will be marked as QC_Pending and points will be deducted.')) return;
    
    setIsReturning(id);
    try {
      await apiClient.post(`/transactions/${id}/return`, { reason: 'Customer return', returnToStock: true });
      toast.success('Transaction returned successfully');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to return transaction');
    } finally {
      setIsReturning(null);
    }
  };

  const handleExport = () => {
    // Sheet 1: Transactions
    const wsTransactions = XLSX.utils.json_to_sheet(transactions.map(t => ({
      ID: t.id,
      Date: new Date(t.createdAt).toLocaleString(),
      Customer: t.customer?.name || '-',
      Amount: t.totalAmount,
      Status: t.status,
      Cashier: t.cashier?.name || '-'
    })));

    // Sheet 2: Items by Brand
    const itemsData: any[] = [];
    transactions.forEach(t => {
      if (t.items && t.items.length > 0) {
        t.items.forEach((item: any) => {
          itemsData.push({
            'Transaction ID': t.id,
            'Date': new Date(t.createdAt).toLocaleString(),
            'Customer': t.customer?.name || '-',
            'Product ID': item.product?.id || '-',
            'Product Name': item.product?.name || '-',
            'Brand': item.product?.brand || '-',
            'Category': item.product?.category || '-',
            'Quantity': item.quantity,
            'Unit Price': item.unitPrice,
            'Subtotal': item.subtotal
          });
        });
      }
    });

    const wsItems = XLSX.utils.json_to_sheet(itemsData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, wsTransactions, "Transactions");
    XLSX.utils.book_append_sheet(workbook, wsItems, "Rincian per Brand");
    XLSX.writeFile(workbook, "Transactions_Report.xlsx");
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const filteredTransactions = transactions.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Data Penjualan</h1>
            <p className="text-muted text-sm">Rangkuman performa dan riwayat data center transaksi.</p>
          </div>
          <div className="flex bg-glass-bg p-1 rounded-xl border border-glass-border">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-muted hover:text-white'}`}
            >
              <Activity className="w-4 h-4" /> Dashboard Sales
            </button>
            <button 
              onClick={() => setActiveTab('datacenter')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'datacenter' ? 'bg-blue-600 text-white' : 'text-muted hover:text-white'}`}
            >
              <FileText className="w-4 h-4" /> Data Center (List)
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {loadingDash ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {/* Yearly Trend Chart */}
                <div className="bg-glass-bg border border-glass-border p-6 rounded-3xl mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" /> Tren Pendapatan (Year-over-Year)
                  </h3>
                  <div className="h-72">
                    {historical.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historical}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="month" tickFormatter={(val, i) => `${val}/${historical[i]?.year}`} stroke="#9ca3af" fontSize={12} />
                          <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} />
                          <Tooltip formatter={(val: any) => formatRupiah(val as number)} labelFormatter={(lbl, arr) => `Bulan ${lbl} Tahun ${arr[0]?.payload?.year}`} contentStyle={{backgroundColor: '#0B0C10', borderColor: '#ffffff20'}} />
                          <Line type="monotone" dataKey="omzet" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Omzet" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center"><p className="text-gray-500">Belum ada data historis</p></div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Methods */}
                  <div className="bg-glass-bg border border-glass-border p-6 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-400" /> Metode Pembayaran
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                      {summary?.paymentMethods && Object.keys(summary.paymentMethods).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(summary.paymentMethods).map(([name, value]) => ({ name, value }))}
                              cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                              label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                              {Object.entries(summary.paymentMethods).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#0B0C10', borderColor: '#ffffff20'}} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-gray-500">Belum ada data</p>
                      )}
                    </div>
                  </div>

                  {/* Cashier Performance */}
                  <div className="bg-glass-bg border border-glass-border p-6 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-400" /> Performa CS / Kasir
                    </h3>
                    <div className="h-64">
                      {summary?.cashierPerformance && summary.cashierPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={summary.cashierPerformance} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} />
                            <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                            <Tooltip formatter={(val: any) => formatRupiah(val as number)} contentStyle={{backgroundColor: '#0B0C10', borderColor: '#ffffff20'}} />
                            <Bar dataKey="omzet" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center"><p className="text-gray-500">Belum ada data</p></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Branch Performance Summary */}
                <div className="bg-glass-bg border border-glass-border p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Store className="w-5 h-5 text-purple-400" /> Rangkuman Performa Cabang
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted">
                      <thead className="text-xs text-muted uppercase bg-black/20">
                        <tr>
                          <th className="px-4 py-3 font-medium">Cabang</th>
                          <th className="px-4 py-3 font-medium text-right">Total Transaksi</th>
                          <th className="px-4 py-3 font-medium text-right">Omzet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border">
                        {summary?.branchPerformance?.map((b: any, idx: number) => (
                          <tr key={idx} className="hover:bg-nav-hover">
                            <td className="px-4 py-3 text-white">{b.name}</td>
                            <td className="px-4 py-3 text-right">{b.transaksi || 0}</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-400">{formatRupiah(b.omzet)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'datacenter' && (
          <>
            {/* Header Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-3 w-full">
                {/* Search */}
                <div className="relative flex-1 lg:w-64 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search Invoice or Customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-glass-bg/80 border border-glass-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2 w-full lg:w-auto">
                  <select 
                    value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}
                    className="bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500 text-sm flex-1 lg:w-40"
                  >
                    <option value="all">Semua Cabang</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>

                  <select 
                    value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                    className="bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500 text-sm w-32"
                  >
                    <option value="all">Semua Bulan</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m.toString()}>{new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                    ))}
                  </select>

                  <select 
                    value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                    className="bg-glass-bg/80 border border-glass-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500 text-sm w-28"
                  >
                    <option value="all">Semua Tahun</option>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={handleExport}
                  className="px-4 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ml-auto"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-muted">
                  <thead className="text-xs text-muted uppercase bg-black/20">
                    <tr>
                      <th className="px-6 py-4 font-medium">Invoice ID</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Items</th>
                      <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                      <th className="px-6 py-4 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {loadingTx ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                          Loading transactions...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p className="text-lg">No transactions found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-nav-hover transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-white">{trx.id}</td>
                          <td className="px-6 py-4 text-muted">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {new Date(trx.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-white">{trx.customer?.name || '-'}</td>
                          <td className="px-6 py-4 text-muted">{trx.items?.length || 0} items</td>
                          <td className="px-6 py-4 text-right font-medium text-blue-400">
                            {formatRupiah(trx.totalAmount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${trx.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                              {trx.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center items-center gap-2">
                              {trx.status === 'completed' && (
                                <>
                                  <button 
                                    onClick={() => handleReturn(trx.id)}
                                    disabled={isReturning === trx.id || isVoiding === trx.id}
                                    className="px-3 py-1.5 bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-orange-500/30 disabled:opacity-50"
                                  >
                                    {isReturning === trx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Store className="w-3.5 h-3.5" />}
                                    Return
                                  </button>
                                  <button 
                                    onClick={() => handleVoid(trx.id)}
                                    disabled={isVoiding === trx.id || isReturning === trx.id}
                                    className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-red-500/30 disabled:opacity-50"
                                  >
                                    {isVoiding === trx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                    Void
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
