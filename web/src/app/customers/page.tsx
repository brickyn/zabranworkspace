'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  Users, Plus, Edit3, Upload, Loader2, Database, Download
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import CRMFilter from '@/components/CRMFilter';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Forms
  const [customerForm, setCustomerForm] = useState({ 
    id: '', customerName: '', phone: '', branchId: '', purchaseDate: '', purchaseDetails: '', 
    purchaseQty: 1, purchaseAmount: 0,
    isActive: true, lastFollowUp: '', followUpResult: '' 
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Filters & Pagination
  const [filterBranch, setFilterBranch] = useState('');
  const [filterType, setFilterType] = useState('month'); // exact, month, year, all
  const [filterExactDate, setFilterExactDate] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch(e) {}
    }
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const bRes = await apiClient.get('/branches');
      setBranches(bRes.data.data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchData();
  }, [filterBranch, filterType, filterExactDate, filterMonth, filterYear]);

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
      const res = await apiClient.get(`/crm/customers${query}`);
      setCustomers(res.data.data);
      setCurrentPage(1);

      setCustomers(res.data.data);
    } catch (error) {
      toast.error('Gagal mengambil data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        ...customerForm,
        picName: currentUser?.name || 'CRM Staff',
      };
      if (customerForm.id) {
        await apiClient.put(`/crm/customers/${customerForm.id}`, payload);
        toast.success('Data konsumen berhasil diupdate');
      } else {
        await apiClient.post('/crm/customers', payload);
        toast.success('Data konsumen berhasil ditambahkan');
      }
      setShowCustomerModal(false);
      resetCustomerForm();
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan data konsumen');
    } finally {
      setFormLoading(false);
    }
  };

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
          const bName = r['Cabang'] || r['cabang'] || '';
          const foundBranch = branches.find(b => b.name.toLowerCase().includes(bName.toLowerCase()));
          const bId = foundBranch ? foundBranch.id : defaultBranchId;

          const isActive = r['Status']?.toString().toLowerCase().includes('aktif') && !r['Status']?.toString().toLowerCase().includes('tidak');
          
          let parsedDate = new Date();
          if (r['Tanggal Pembelian']) {
            if (typeof r['Tanggal Pembelian'] === 'number') {
               parsedDate = new Date(Math.round((r['Tanggal Pembelian'] - 25569) * 86400 * 1000));
            } else {
               parsedDate = new Date(r['Tanggal Pembelian']);
            }
          }

          return {
            customerName: r['Nama Customer'] || r['Nama'] || 'Tanpa Nama',
            phone: r['Nomor Telfon'] || r['Nomor WA'] || r['Telepon'] || '-',
            branchId: bId,
            purchaseDate: parsedDate.toISOString(),
            purchaseDetails: r['Keterangan Pembelian'] || r['Laptop'] || '-',
            purchaseQty: Number(r['Jumlah Unit'] || r['Qty'] || 1),
            purchaseAmount: Number(r['Nominal Belanja (Rp)'] || r['Total'] || r['Nominal'] || 0),
            isActive: isActive,
            picName: currentUser?.name || 'Imported'
          };
        });

        await apiClient.post('/crm/customers/import', { customers: formattedCustomers });
        toast.success(`Berhasil mengimport ${formattedCustomers.length} data konsumen`);
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengimport file excel. Pastikan format sesuai.');
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // reset
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Nama Customer": "Budi Santoso",
        "Nomor Telfon": "081234567890",
        "Cabang": "Republic Laptop",
        "Status": "Aktif",
        "Tanggal Pembelian": "2024-01-20",
        "Keterangan Pembelian": "Laptop Asus ROG",
        "Jumlah Unit": 1,
        "Nominal Belanja (Rp)": 15000000
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Database_Pelanggan.xlsx");
  };

  const resetCustomerForm = () => {
    setCustomerForm({ 
      id: '', customerName: '', phone: '', branchId: branches[0]?.id || '', purchaseDate: '', purchaseDetails: '', 
      purchaseQty: 1, purchaseAmount: 0,
      isActive: true, lastFollowUp: '', followUpResult: '' 
    });
  }

  const handleEditCustomer = (c: any) => {
    setCustomerForm({
      id: c.id,
      customerName: c.customerName,
      phone: c.phone,
      branchId: c.branchId,
      purchaseDate: c.purchaseDate ? c.purchaseDate.split('T')[0] : '',
      purchaseDetails: c.purchaseDetails,
      purchaseQty: c.purchaseQty || 1,
      purchaseAmount: c.purchaseAmount || 0,
      isActive: c.isActive,
      lastFollowUp: c.lastFollowUp ? c.lastFollowUp.split('T')[0] : '',
      followUpResult: c.followUpResult || ''
    });
    setShowCustomerModal(true);
  }

  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(customers.length / pageSize);

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Database Pelanggan</h1>
            <p className="text-muted text-sm">Kelola seluruh data kontak pelanggan dan riwayat transaksi.</p>
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
            <div className="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>
            <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import Excel</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
            </label>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 text-blue-400">
            <Database className="w-4 h-4" />
            <span className="text-sm font-semibold">{customers.length} Total Data</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium shadow-lg shadow-gray-500/20"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
            <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium cursor-pointer shadow-lg shadow-green-500/20">
              <Upload className="w-4 h-4" />
              Import Excel
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
            </label>
            <button 
              onClick={() => { resetCustomerForm(); setShowCustomerModal(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Input Data Baru
            </button>
          </div>
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
                    <th className="px-6 py-4 font-semibold">Pelanggan & Badge</th>
                    <th className="px-6 py-4 font-semibold">Cabang</th>
                    <th className="px-6 py-4 font-semibold">Pembelian (Qty & Nominal)</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Follow-up Terakhir</th>
                    <th className="px-6 py-4 font-semibold">Hasil Follow-up</th>
                    <th className="px-6 py-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {currentCustomers.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-500">Belum ada database pelanggan</td></tr>
                  ) : (
                    currentCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-nav-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white flex items-center gap-2 flex-wrap mb-1">
                            {c.customerName}
                            {c.loyaltyBadge === 'Platinum' && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded border border-blue-500/30">💎 Platinum</span>}
                            {c.loyaltyBadge === 'Gold' && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-[10px] rounded border border-yellow-500/30">🥇 Gold</span>}
                            {c.loyaltyBadge === 'Silver' && <span className="px-2 py-0.5 bg-gray-400/20 text-muted text-[10px] rounded border border-gray-400/30">🥈 Silver</span>}
                            {c.loyaltyBadge === 'Bronze' && <span className="px-2 py-0.5 bg-orange-700/20 text-orange-300 text-[10px] rounded border border-orange-700/30">🥉 Bronze</span>}
                            {c.loyaltyBadge === 'Loyal' && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded border border-purple-500/30">⭐ Loyal</span>}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{c.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-medium text-muted border border-glass-border">
                            {c.branch?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-muted">{new Date(c.purchaseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div className="text-xs text-blue-400 mt-0.5">{c.purchaseDetails}</div>
                          <div className="text-xs font-semibold text-green-400 mt-1">{c.purchaseQty} Unit - Rp {c.purchaseAmount?.toLocaleString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${c.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {c.isActive ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {c.lastFollowUp ? new Date(c.lastFollowUp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate" title={c.followUpResult}>
                          {c.followUpResult || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleEditCustomer(c)} className="p-2 bg-white/5 hover:bg-blue-600 rounded-lg text-muted hover:text-white transition-all">
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
        {!loading && customers.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 bg-glass-bg p-4 rounded-2xl border border-glass-border">
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
                className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-muted rounded-lg text-sm"
              >
                Prev
              </button>
              <span className="text-sm text-muted">
                Hal {currentPage} dari {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-muted rounded-lg text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Customer Data Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
            <div className="p-6 md:p-8 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">{customerForm.id ? 'Edit Database Konsumen' : 'Input Database Konsumen'}</h2>
              <p className="text-sm text-muted mt-1">Data hasil audit nomor & riwayat pembelian pelanggan</p>
            </div>
            
            <form onSubmit={handleCreateCustomer} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Nama Customer</label>
                  <input type="text" required value={customerForm.customerName} onChange={e => setCustomerForm({...customerForm, customerName: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="Misal: Budi Santoso" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Nomor Telfon (WA)</label>
                  <input type="text" required value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 font-mono" placeholder="Misal: 08123456789" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Cabang Pembelian</label>
                  <select required value={customerForm.branchId} onChange={e => setCustomerForm({...customerForm, branchId: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500">
                    <option value="">-- Pilih Cabang --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Tanggal Pembelian</label>
                  <input type="date" required value={customerForm.purchaseDate} onChange={e => setCustomerForm({...customerForm, purchaseDate: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 [color-scheme:dark]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Keterangan Produk (Laptop dll)</label>
                  <input type="text" required value={customerForm.purchaseDetails} onChange={e => setCustomerForm({...customerForm, purchaseDetails: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" placeholder="Misal: Lenovo Thinkpad T480" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Jumlah Unit</label>
                  <input type="number" required min="1" value={customerForm.purchaseQty} onChange={e => setCustomerForm({...customerForm, purchaseQty: Number(e.target.value)})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Total Harga / Nominal (Rp)</label>
                <input type="number" required min="0" value={customerForm.purchaseAmount} onChange={e => setCustomerForm({...customerForm, purchaseAmount: Number(e.target.value)})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 font-bold" placeholder="Misal: 15000000" />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-glass-border pt-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted">Status Nomor</label>
                  <select required value={customerForm.isActive ? 'true' : 'false'} onChange={e => setCustomerForm({...customerForm, isActive: e.target.value === 'true'})} className={`w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 font-semibold ${customerForm.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    <option value="true" className="text-green-400">Aktif (Hijau)</option>
                    <option value="false" className="text-red-400">Tidak Aktif (Merah)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted">Tanggal Follow-up Terakhir</label>
                  <input type="date" value={customerForm.lastFollowUp} onChange={e => setCustomerForm({...customerForm, lastFollowUp: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 [color-scheme:dark]" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted">Hasil Follow-up</label>
                <textarea value={customerForm.followUpResult} onChange={e => setCustomerForm({...customerForm, followUpResult: e.target.value})} className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 min-h-[80px]" placeholder="Misal: Customer merespon tertarik beli lagi..."></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-glass-border">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-white hover:bg-nav-hover transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
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
