'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Crown, Loader2, Download, Upload, Plus, Edit3, Search, Database } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import CRMFilter from '@/components/CRMFilter';

export default function LoyalCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterType, setFilterType] = useState('all'); // exact, month, year, all (default 'all' to show all imported historical data)
  const [filterExactDate, setFilterExactDate] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  // Modals & Forms
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({ 
    id: '', customerName: '', phone: '', branchId: '', purchaseDate: '', purchaseDetails: '', 
    purchaseQty: 1, purchaseAmount: 0,
    isActive: true, lastFollowUp: '', followUpResult: '' 
  });
  const [formLoading, setFormLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(35);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch(e) {}
    }
  }, []);

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
      } else if (filterType === 'all') {
        params.append('filterType', 'all');
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const [leaderboardRes, branchRes] = await Promise.all([
        apiClient.get(`/crm/leaderboard${query}`),
        apiClient.get('/branches')
      ]);

      if (leaderboardRes.data.success) {
        // Show repeat/loyal customers
        const repeatCustomers = (leaderboardRes.data.data.topLoyal || []);
        setCustomers(repeatCustomers);
        setCurrentPage(1);
      }
      if (branchRes.data.success) {
        setBranches(branchRes.data.data || []);
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

  // Excel Export
  const handleExportExcel = () => {
    const dataToExport = filteredCustomers.map(c => ({
      'Nama Pelanggan': c.customerName || 'Tanpa Nama',
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

  // Excel Import
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);
        
        if (rows.length === 0) {
          toast.error('File Excel kosong');
          setLoading(false);
          return;
        }

        const defaultBranchId = branches.length > 0 ? branches[0].id : '';

        const formattedCustomers = rows.map(r => {
          const bName = r['Cabang'] || r['cabang'] || r['Brand'] || r['Toko'] || '';
          const foundBranch = branches.find(b => b.name.toLowerCase().includes(bName.toLowerCase()));
          const bId = foundBranch ? foundBranch.id : defaultBranchId;

          const isActive = r['Status']?.toString().toLowerCase().includes('aktif') && !r['Status']?.toString().toLowerCase().includes('tidak');
          
          let parsedDate = new Date();
          const rawDate = r['Tanggal Pembelian'] || r['Tanggal'] || r['Date'];
          if (rawDate) {
            if (typeof rawDate === 'number') {
               parsedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            } else {
               parsedDate = new Date(rawDate);
            }
          }

          return {
            customerName: r['Nama Customer'] || r['Nama Pelanggan'] || r['Nama'] || r['Customer'] || 'Tanpa Nama',
            phone: r['Nomor Telfon'] || r['Nomor WA'] || r['No. WhatsApp'] || r['Telepon'] || r['Phone'] || r['WA'] || '-',
            branchId: bId,
            purchaseDate: isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
            purchaseDetails: r['Keterangan Pembelian'] || r['Laptop'] || r['Keterangan'] || 'Repeat Order',
            purchaseQty: Number(r['Jumlah Unit'] || r['Qty'] || r['Total Pembelian (Qty)'] || 1),
            purchaseAmount: Number(r['Nominal Belanja (Rp)'] || r['Total Nominal (Rp)'] || r['Total'] || r['Nominal'] || r['Amount'] || 0),
            isActive: isActive !== undefined ? isActive : true,
            picName: currentUser?.name || 'CRM Staff'
          };
        });

        const res = await apiClient.post('/crm/customers/import', { customers: formattedCustomers });
        toast.success(`Berhasil mengimport ${res.data?.count || formattedCustomers.length} data pelanggan loyal!`);
        setFilterType('all');
        fetchData();
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.error || 'Gagal mengimport file excel. Pastikan format sesuai.');
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // reset input
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Nama Customer": "Budi Santoso",
        "Nomor Telfon": "081234567890",
        "Cabang": "Republic Laptop",
        "Status": "Aktif",
        "Tanggal Pembelian": "2024-01-20",
        "Keterangan Pembelian": "Laptop Asus ROG (Repeat Order)",
        "Jumlah Unit": 2,
        "Nominal Belanja (Rp)": 25000000
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Loyal Customers");
    XLSX.writeFile(wb, "Template_Import_Loyal_Customers.xlsx");
  };

  const resetCustomerForm = () => {
    setCustomerForm({ 
      id: '', customerName: '', phone: '', branchId: branches[0]?.id || '', purchaseDate: new Date().toISOString().split('T')[0], purchaseDetails: '', 
      purchaseQty: 1, purchaseAmount: 0,
      isActive: true, lastFollowUp: '', followUpResult: '' 
    });
  };

  const handleEditCustomer = (c: any) => {
    setCustomerForm({
      id: c.id || '',
      customerName: c.customerName || '',
      phone: c.phone || '',
      branchId: c.branchId || (branches[0]?.id || ''),
      purchaseDate: c.purchaseDate ? c.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0],
      purchaseDetails: c.purchaseDetails || 'Repeat Order',
      purchaseQty: c.yearlyQty || c.purchaseQty || 1,
      purchaseAmount: c.yearlyAmount || c.purchaseAmount || 0,
      isActive: c.isActive !== undefined ? c.isActive : true,
      lastFollowUp: c.lastFollowUp ? c.lastFollowUp.split('T')[0] : '',
      followUpResult: c.followUpResult || ''
    });
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        ...customerForm,
        picName: currentUser?.name || 'CRM Staff',
      };
      if (customerForm.id) {
        await apiClient.put(`/crm/customers/${customerForm.id}`, payload);
        toast.success('Data pelanggan loyal berhasil diupdate');
      } else {
        await apiClient.post('/crm/customers', payload);
        toast.success('Data pelanggan loyal berhasil ditambahkan');
      }
      setShowCustomerModal(false);
      resetCustomerForm();
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan data pelanggan');
    } finally {
      setFormLoading(false);
    }
  };

  // Filter Search Query
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    const name = (c.customerName || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const badge = (c.loyaltyBadge || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || badge.includes(q);
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

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
            <p className="text-muted text-sm">Daftar pelanggan setia yang telah berbelanja secara berulang & berprestasi.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
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
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 px-2">
          
          {/* Search & Counter */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Cari nama, no WA, badge..."
                className="w-full bg-glass-bg/80 border border-glass-border rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-400 placeholder:text-muted"
              />
            </div>
            <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20 text-yellow-400 shrink-0">
              <Database className="w-4 h-4" />
              <span className="text-sm font-semibold">{filteredCustomers.length} Loyal Customers</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3.5 py-2 rounded-xl transition-all text-xs font-medium shadow-md shadow-gray-500/20"
              title="Unduh format file Excel untuk import"
            >
              <Download className="w-4 h-4" />
              Template
            </button>

            <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl transition-all text-xs font-medium cursor-pointer shadow-md shadow-green-500/20">
              <Upload className="w-4 h-4" />
              Import Excel
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
            </label>

            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl transition-all text-xs font-medium shadow-md shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>

            <button 
              onClick={() => { resetCustomerForm(); setShowCustomerModal(true); }}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl transition-all text-xs shadow-md shadow-yellow-500/20"
            >
              <Plus className="w-4 h-4" />
              Input Pelanggan Loyal
            </button>
          </div>

        </div>

        {/* Table */}
        <div className="bg-glass-bg border border-glass-border rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
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
                    <th className="px-6 py-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {currentCustomers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-500">Belum ada pelanggan loyal yang sesuai filter/pencarian</td></tr>
                  ) : (
                    currentCustomers.map((c, i) => (
                      <tr key={i} className="hover:bg-nav-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white mb-1">{c.customerName || 'Tanpa Nama'}</div>
                          <div className="text-xs text-gray-500 font-mono">{c.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-white text-lg">
                          {c.yearlyQty}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-green-400">
                          Rp {c.yearlyAmount?.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {c.loyaltyBadge === 'Platinum' && <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">💎 Platinum</span>}
                          {c.loyaltyBadge === 'Gold' && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">🥇 Gold</span>}
                          {c.loyaltyBadge === 'Silver' && <span className="px-3 py-1 bg-gray-400/20 text-muted text-xs rounded-full border border-gray-400/30">🥈 Silver</span>}
                          {c.loyaltyBadge === 'Bronze' && <span className="px-3 py-1 bg-orange-700/20 text-orange-300 text-xs rounded-full border border-orange-700/30">🥉 Bronze</span>}
                          {c.loyaltyBadge === 'Loyal' && <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">⭐ Loyal</span>}
                          {(!c.loyaltyBadge || c.loyaltyBadge === 'Reguler') && <span className="px-3 py-1 bg-gray-500/20 text-muted text-xs rounded-full border border-gray-500/30">Reguler</span>}
                        </td>
                        <td className="px-6 py-4">
                          {c.lastFollowUp ? new Date(c.lastFollowUp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleEditCustomer(c)} 
                            className="p-2 bg-white/5 hover:bg-yellow-500/20 text-muted hover:text-yellow-400 rounded-lg transition-all"
                            title="Edit data pelanggan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-glass-bg p-4 rounded-2xl border border-glass-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Tampilkan</span>
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-glass-bg border border-glass-border text-foreground text-sm rounded-lg px-2 py-1 outline-none"
              >
                <option value={20}>20</option>
                <option value={35}>35</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-muted">data per halaman</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-muted rounded-lg text-sm transition-colors"
              >
                Prev
              </button>
              <span className="text-sm text-muted">
                Hal {currentPage} dari {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-muted rounded-lg text-sm transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Customer Input/Edit Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
            <div className="p-6 md:p-8 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                {customerForm.id ? 'Edit Pelanggan Loyal' : 'Input Pelanggan Loyal'}
              </h2>
              <p className="text-sm text-muted mt-1">Data pembelian & status loyalitas pelanggan</p>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Nama Customer *</label>
                  <input 
                    type="text" 
                    required 
                    value={customerForm.customerName} 
                    onChange={e => setCustomerForm({...customerForm, customerName: e.target.value})} 
                    className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-yellow-400" 
                    placeholder="Misal: Budi Santoso" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Nomor WhatsApp *</label>
                  <input 
                    type="text" 
                    required 
                    value={customerForm.phone} 
                    onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} 
                    className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-yellow-400 font-mono" 
                    placeholder="Misal: 08123456789" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Cabang *</label>
                  <select 
                    required 
                    value={customerForm.branchId} 
                    onChange={e => setCustomerForm({...customerForm, branchId: e.target.value})} 
                    className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-yellow-400"
                  >
                    <option value="">-- Pilih Cabang --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Tanggal Pembelian *</label>
                  <input 
                    type="date" 
                    required 
                    value={customerForm.purchaseDate} 
                    onChange={e => setCustomerForm({...customerForm, purchaseDate: e.target.value})} 
                    className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-yellow-400 [color-scheme:dark]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Keterangan Produk</label>
                  <input 
                    type="text" 
                    required 
                    value={customerForm.purchaseDetails} 
                    onChange={e => setCustomerForm({...customerForm, purchaseDetails: e.target.value})} 
                    className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-yellow-400" 
                    placeholder="Misal: Laptop Asus ROG (Repeat)" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Jumlah Unit (Qty) *</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={customerForm.purchaseQty} 
                    onChange={e => setCustomerForm({...customerForm, purchaseQty: Number(e.target.value)})} 
                    className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-yellow-400" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Total Harga / Nominal (Rp) *</label>
                <input 
                  type="number" 
                  required 
                  min="0" 
                  value={customerForm.purchaseAmount} 
                  onChange={e => setCustomerForm({...customerForm, purchaseAmount: Number(e.target.value)})} 
                  className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-yellow-400 font-bold" 
                  placeholder="Misal: 15000000" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-glass-border pt-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Status Customer</label>
                  <select 
                    required 
                    value={customerForm.isActive ? 'true' : 'false'} 
                    onChange={e => setCustomerForm({...customerForm, isActive: e.target.value === 'true'})} 
                    className={`w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl outline-none focus:border-yellow-400 font-semibold ${customerForm.isActive ? 'text-green-400' : 'text-red-400'}`}
                  >
                    <option value="true" className="text-green-400">Aktif</option>
                    <option value="false" className="text-red-400">Tidak Aktif</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Tanggal Follow-up Terakhir</label>
                  <input 
                    type="date" 
                    value={customerForm.lastFollowUp} 
                    onChange={e => setCustomerForm({...customerForm, lastFollowUp: e.target.value})} 
                    className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-yellow-400 [color-scheme:dark]" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Hasil Follow-up</label>
                <textarea 
                  value={customerForm.followUpResult} 
                  onChange={e => setCustomerForm({...customerForm, followUpResult: e.target.value})} 
                  className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-yellow-400 min-h-[80px]" 
                  placeholder="Misal: Customer respon baik, berencana beli unit tambahan..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-glass-border">
                <button 
                  type="button" 
                  onClick={() => setShowCustomerModal(false)} 
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-white hover:bg-nav-hover transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading} 
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-950 transition-colors flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
