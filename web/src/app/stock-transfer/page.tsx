'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  Package, Search, Plus, Filter, LayoutGrid, X, 
  CheckCircle2, CheckCircle, AlertCircle, ArrowRightLeft, 
  Truck, Inbox, PlayCircle, ClipboardCheck, Clock, FileText, Download, Loader2,
  Play, PackageCheck, ArrowRight, Ban, Upload, Printer
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import * as XLSX from 'xlsx';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import DeliveryOrderPrinter from '@/components/Print/DeliveryOrderPrinter';

const STATUS_STEPS = [
  'Draft', 'Approved', 'Ready to Pick', 'Picking', 'Ready to Ship', 
  'Dispatched', 'In Transit', 'Received', 'Completed'
];

export default function StockTransferPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [transferOrders, setTransferOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form states
  const [fromBranchId, setFromBranchId] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkItems, setBulkItems] = useState<any[]>([]);
  const [selectedTOId, setSelectedTOId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [availableInventory, setAvailableInventory] = useState<any[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');

  // Surat Jalan print state
  const suratJalanRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [isPrintLoading, setIsPrintLoading] = useState(false);

  const handlePrintSuratJalan = useReactToPrint({
    contentRef: suratJalanRef,
    documentTitle: `SuratJalan_${printData?.batchId || 'ZIS'}`,
  });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    fetchBranches();
    if (activeTab === 'history') fetchTransfers();
  }, [activeTab]);

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get('/branches');
      if (res.data.success) {
        setBranches(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory/transfers');
      if (res.data.success) {
        setTransferOrders(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchProduct = async () => {
    const activeBranchId = fromBranchId || (user?.branchId || user?.branch_id);
    if (!activeBranchId) {
      toast.error('Pilih Cabang Asal terlebih dahulu');
      return;
    }
    if (!searchQuery) {
      toast.error('Masukkan Serial Number (SN) barang');
      return;
    }
    try {
      const res = await apiClient.post('/inventory/validate-sn', {
        serial_number: searchQuery,
        branch_id: activeBranchId
      });
      if (res.data.success) {
        const p = res.data.data;
        if (selectedItems.find(i => i.sn === p.sn)) {
          toast.error('Produk sudah ditambahkan');
        } else {
          // Default transfer qty is 1, but we cap it at max available qty
          setSelectedItems([...selectedItems, { ...p, transferQty: 1, maxQty: p.qty }]);
          setSearchQuery('');
          toast.success('Produk ditambahkan');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Produk tidak ditemukan atau tidak tersedia');
      console.error(error);
    }
  };

  const openInventoryModal = async () => {
    setIsInventoryModalOpen(true);
    try {
      const res = await apiClient.get('/inventory/stock', { params: { category: 'all', branch_id: fromBranchId || (user?.branchId || user?.branch_id) } });
      if (res.data.success) {
        setAvailableInventory(res.data.data.filter((p: any) => p.status === 'Available'));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddFromInventory = (product: any) => {
    if (selectedItems.find(i => i.id === product.id)) {
      toast.error('Produk sudah ditambahkan');
    } else {
      setSelectedItems([...selectedItems, product]);
      toast.success('Ditambahkan ke daftar');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const activeBranchId = fromBranchId || (user?.branchId || user?.branch_id);
    if (!activeBranchId) {
      toast.error('Pilih Cabang Asal terlebih dahulu sebelum upload');
      e.target.value = '';
      return;
    }

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) throw new Error('Excel file is empty');

      const identifiers = jsonData.map(row => String(row['SN'] || row['ID Produk'] || row['Serial Number'] || row['id'] || row['serialNumber'] || '')).filter(Boolean);

      if (identifiers.length === 0) throw new Error('Tidak ada Serial Number yang ditemukan di file Excel');

      const res = await apiClient.post('/inventory/validate-bulk-sn', { 
        serial_numbers: identifiers,
        branch_id: activeBranchId
      });
      
      if (res.data.success) {
        const validItems = res.data.data;
        const newItems = validItems.filter((m: any) => !selectedItems.find((s: any) => s.sn === m.sn));
        
        if (newItems.length > 0) {
          const itemsWithTransferQty = newItems.map((p: any) => ({ ...p, transferQty: 1, maxQty: p.qty }));
          setSelectedItems([...selectedItems, ...itemsWithTransferQty]);
          toast.success(`${newItems.length} produk berhasil ditambahkan dari Excel`);
        } else {
          toast.error('Semua produk dari Excel sudah ada di daftar atau tidak valid');
        }
      }
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.message || 'Gagal membaca file Excel';
      toast.error(errMsg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateTransfer = async () => {
    const activeBranchId = fromBranchId || (user?.branchId || user?.branch_id);
    if (!activeBranchId) {
      return toast.error('Pilih Cabang Asal terlebih dahulu');
    }
    if (!selectedBranch || selectedItems.length === 0) {
      return toast.error('Lengkapi form transfer (Cabang Tujuan & Item)');
    }
    
    try {
      setLoading(true);
      const res = await apiClient.post('/inventory/transfers', {
        fromBranchId: activeBranchId,
        toBranchId: selectedBranch,
        items: selectedItems.map(i => ({ sn: i.sn, qty: i.transferQty || 1 })),
        notes
      });
      if (res.data.success) {
        toast.success('Draft Transfer Order berhasil dibuat');
        setSelectedItems([]);
        setNotes('');
        setActiveTab('history');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat Transfer Order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, reason?: string) => {
    try {
      const res = await apiClient.put(`/inventory/transfers/${id}/status`, { status: newStatus, reason });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchTransfers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal mengubah status');
    }
  };

  const handleCancelTransfer = (id: string) => {
    const reason = prompt('Masukkan alasan pembatalan:');
    if (reason) {
      handleUpdateStatus(id, 'Cancelled', reason);
    }
  };

  const openBulkModal = (transferOrder: any) => {
    const pendingItems = transferOrder.items.filter((t: any) => t.status === 'Shipped');
    if (pendingItems.length === 0) {
      toast.error('Tidak ada item yang perlu divalidasi');
      return;
    }
    setBulkItems(pendingItems.map((t: any) => ({ id: t.id, product: t.product, accepted: true, reason: '' })));
    setSelectedTOId(transferOrder.id);
    setIsBulkModalOpen(true);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingReason = bulkItems.find(i => !i.accepted && !i.reason.trim());
    if (missingReason) return toast.error('Harap isi alasan untuk barang yang tidak diterima');

    setBulkLoading(true);
    try {
      const res = await apiClient.post(`/inventory/transfers/${selectedTOId}/receive`, {
        items: bulkItems.map(i => ({ id: i.id, accepted: i.accepted, reason: i.reason }))
      });
      if (res.data.success) {
        toast.success('Penerimaan berhasil diproses');
        setIsBulkModalOpen(false);
        fetchTransfers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memproses penerimaan');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCetakSuratJalan = async (transferId: string) => {
    setIsPrintLoading(true);
    try {
      const encodedId = encodeURIComponent(transferId);
      const res = await apiClient.get(`/inventory/surat-jalan/${encodedId}`);
      if (res.data.success) {
        const { batchId, transfers, transferOrder } = res.data.data;
        setPrintData({
          batchId: batchId || transferOrder?.transferNumber,
          date: transferOrder?.createdAt || new Date().toISOString(),
          fromBranch: transferOrder?.fromBranch || { name: 'Gudang' },
          toBranch: transferOrder?.toBranch || { name: '-' },
          items: transfers,
          notes: transferOrder?.notes,
        });
        setTimeout(() => {
          handlePrintSuratJalan();
        }, 300);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memuat data Surat Jalan');
    } finally {
      setIsPrintLoading(false);
    }
  };

  // Helper for step bar
  const getStepIndex = (status: string) => {
    if (['Partially Received', 'Returned'].includes(status)) return STATUS_STEPS.indexOf('Received');
    return STATUS_STEPS.indexOf(status);
  };

  const renderActionButtons = (to: any) => {
    const isAdmin = ['Super Admin', 'Management', 'Admin', 'Manager'].includes(user?.role || '');
    const isDest = to.toBranchId === (user?.branchId || user?.branch_id);
    const isSource = to.fromBranchId === (user?.branchId || user?.branch_id);
    const isWarehouse = user?.role === 'Warehouse' || isAdmin;

    const btns = [];

    if (to.status === 'Draft' && isAdmin) {
      btns.push(<button key="approve" onClick={() => handleUpdateStatus(to.id, 'Approved')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>);
    }
    if (to.status === 'Approved' && isWarehouse) {
      btns.push(<button key="pick" onClick={() => handleUpdateStatus(to.id, 'Ready to Pick')} className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Pick</button>);
    }
    if (to.status === 'Ready to Pick' && isWarehouse) {
      btns.push(<button key="picking" onClick={() => handleUpdateStatus(to.id, 'Picking')} className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Start Picking</button>);
    }
    if (to.status === 'Picking' && isWarehouse) {
      btns.push(<button key="ready" onClick={() => handleUpdateStatus(to.id, 'Ready to Ship')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"><PackageCheck className="w-3.5 h-3.5" /> Ready</button>);
    }
    if (to.status === 'Ready to Ship' && isWarehouse) {
      btns.push(<button key="dispatch" onClick={() => handleUpdateStatus(to.id, 'Dispatched')} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Dispatch</button>);
    }
    if (to.status === 'Dispatched' && (isWarehouse || isAdmin)) {
      btns.push(<button key="intransit" onClick={() => handleUpdateStatus(to.id, 'In Transit')} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> In Transit</button>);
    }
    if (['In Transit', 'Dispatched'].includes(to.status) && (isDest || isAdmin)) {
      btns.push(<button key="receive" onClick={() => openBulkModal(to)} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Receive</button>);
    }
    if (['Partially Received', 'Received'].includes(to.status) && isAdmin) {
      btns.push(<button key="complete" onClick={() => handleUpdateStatus(to.id, 'Completed')} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Complete</button>);
    }
    if (!['Completed', 'Received', 'Partially Received', 'Cancelled'].includes(to.status) && (isAdmin || isSource)) {
      btns.push(<button key="cancel" onClick={() => handleCancelTransfer(to.id)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5"><Ban className="w-3.5 h-3.5" /> Cancel</button>);
    }

    return btns;
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-6xl mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Transfer Stok Cabang (WMS)</h1>
            <p className="text-muted text-sm">Kelola pengiriman barang antar cabang dengan siklus persetujuan.</p>
          </div>
          <div className="flex bg-glass-bg p-1 rounded-xl border border-glass-border">
            <button 
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'text-muted hover:text-white'}`}
            >
              Buat Transfer Baru
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-muted hover:text-white'}`}
            >
              Daftar Transfer Order
            </button>
          </div>
        </div>

        {activeTab === 'create' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 bg-glass-bg border border-glass-border p-6 rounded-3xl h-fit">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" /> Item yang akan dikirim
              </h3>
              
              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input 
                    type="text" 
                    placeholder="Scan SN / Masukkan Batch ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchProduct()}
                    className="w-full bg-glass-bg border border-glass-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <button 
                  onClick={handleSearchProduct}
                  className="px-4 py-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" /> Import
                </button>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </div>

              {selectedItems.length > 0 ? (
                <div className="space-y-3">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-glass-border">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-xs text-muted">SN: {item.sn} • Tersedia: {item.maxQty}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.maxQty > 1 ? (
                          <div className="flex items-center bg-black/40 rounded-lg border border-white/10">
                            <button 
                              onClick={() => {
                                const newItems = [...selectedItems];
                                newItems[idx].transferQty = Math.max(1, (newItems[idx].transferQty || 1) - 1);
                                setSelectedItems(newItems);
                              }}
                              className="px-2 py-1 text-gray-400 hover:text-white"
                            >-</button>
                            <span className="text-sm font-medium w-8 text-center">{item.transferQty || 1}</span>
                            <button 
                              onClick={() => {
                                const newItems = [...selectedItems];
                                newItems[idx].transferQty = Math.min(item.maxQty, (newItems[idx].transferQty || 1) + 1);
                                setSelectedItems(newItems);
                              }}
                              className="px-2 py-1 text-gray-400 hover:text-white"
                            >+</button>
                          </div>
                        ) : null}
                        <button onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-black/10 rounded-xl border border-dashed border-glass-border">
                  <p className="text-gray-500 text-sm">Belum ada item ditambahkan</p>
                </div>
              )}
            </div>

            <div className="bg-glass-bg border border-glass-border p-6 rounded-3xl h-fit">
              <h3 className="text-lg font-bold text-white mb-4">Detail Pengiriman</h3>
              
              <div className="space-y-4">
                {['Super Admin', 'Management', 'Admin', 'Warehouse', 'Manager'].includes(user?.role) && (
                  <div>
                    <label className="block text-sm text-muted mb-2">Cabang Asal</label>
                    <select 
                      value={fromBranchId}
                      onChange={(e) => setFromBranchId(e.target.value)}
                      className="w-full bg-glass-bg border border-glass-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors mb-4"
                    >
                      <option value="">-- Pilih Cabang Asal --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-muted mb-2">Cabang Tujuan</label>
                  <select 
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full bg-glass-bg border border-glass-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Pilih Cabang...</option>
                    {branches.filter(b => b.id !== (fromBranchId || (user?.branchId || user?.branch_id))).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted mb-2">Catatan</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan transfer..."
                    className="w-full bg-glass-bg border border-glass-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-glass-border">
                  <button 
                    onClick={handleCreateTransfer}
                    disabled={loading || selectedItems.length === 0 || !selectedBranch}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                  >
                    Buat Draft Transfer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {transferOrders.map((to) => (
              <div key={to.id} className="bg-glass-bg border border-glass-border rounded-3xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {to.transferNumber} 
                      {to.doNumber && <span className="text-sm font-normal text-muted bg-white/5 px-2 py-1 rounded-lg">DO: {to.doNumber}</span>}
                    </h3>
                    <div className="text-sm text-muted mt-1 flex items-center gap-2">
                      <span>{to.fromBranch?.name}</span>
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>{to.toBranch?.name}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(to.createdAt).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <span>{to.items.length} Item</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderActionButtons(to)}
                    {getStepIndex(to.status) >= STATUS_STEPS.indexOf('Ready to Ship') && to.status !== 'Cancelled' && (
                      <button 
                        onClick={() => handleCetakSuratJalan(to.id)}
                        disabled={isPrintLoading}
                        className="px-3 py-1.5 bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Printer className="w-3.5 h-3.5" /> Cetak DO
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="mb-6 overflow-x-auto pb-4">
                  <div className="flex items-center min-w-[600px]">
                    {STATUS_STEPS.map((step, idx) => {
                      const isActive = getStepIndex(to.status) >= idx;
                      const isCancelled = to.status === 'Cancelled';
                      const isError = isCancelled && step === to.status;

                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className={`flex flex-col items-center gap-2 relative z-10 w-full`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                              isError ? 'bg-red-900 border-red-500 text-red-500' :
                              isActive ? 'bg-blue-900 border-blue-500 text-blue-400' : 
                              'bg-black/50 border-gray-700 text-gray-500'
                            }`}>
                              {isError ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>
                              {step}
                            </span>
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 -mx-4 z-0 ${getStepIndex(to.status) > idx && !isCancelled ? 'bg-blue-500' : 'bg-gray-800'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {to.status === 'Cancelled' && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm"><span className="font-bold">Dibatalkan:</span> {to.notes}</p>
                  </div>
                )}
                {to.status === 'Partially Received' && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-yellow-400 text-sm">Transfer diterima sebagian. Ada barang yang diretur.</p>
                  </div>
                )}

              </div>
            ))}
            {transferOrders.length === 0 && !loading && (
              <EmptyState title="Riwayat Kosong" description="Belum ada riwayat transfer saat ini." />
            )}
          </div>
        )}

      </div>

      {/* Bulk Validation Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Validasi Penerimaan Fisik</h3>
                <p className="text-sm text-gray-400 mt-1">Checklist kesesuaian barang yang datang dengan Surat Jalan.</p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {bulkItems.map((item, idx) => (
                  <div key={item.id} className={`p-4 rounded-2xl border transition-colors ${item.accepted ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium text-lg">{item.productItem?.product?.brand} {item.productItem?.product?.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.accepted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {item.accepted ? 'DITERIMA' : 'DITOLAK'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>SN: <span className="text-gray-200">{item.productItem?.sn || '-'}</span> | Qty: <span className="text-gray-200">{item.qty}</span></p>
                          <p>ID: <span className="text-gray-200">{item.productItem?.product?.sku || item.productItem?.product?.id}</span></p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 min-w-[250px]">
                        <div className="flex bg-black/40 rounded-xl p-1 border border-gray-800">
                          <button 
                            type="button"
                            onClick={() => {
                              const newItems = [...bulkItems];
                              newItems[idx].accepted = true;
                              newItems[idx].reason = '';
                              setBulkItems(newItems);
                            }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${item.accepted ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'text-gray-400 hover:text-white'}`}
                          >
                            ✓ Terima
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              const newItems = [...bulkItems];
                              newItems[idx].accepted = false;
                              setBulkItems(newItems);
                            }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!item.accepted ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-400 hover:text-white'}`}
                          >
                            ✕ Tolak (Retur)
                          </button>
                        </div>

                        {!item.accepted && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <input 
                              type="text"
                              value={item.reason}
                              onChange={(e) => {
                                const newItems = [...bulkItems];
                                newItems[idx].reason = e.target.value;
                                setBulkItems(newItems);
                              }}
                              placeholder="Alasan ditolak wajib diisi..."
                              className="w-full bg-black/40 border border-red-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
                              required
                            />
                            <div className="flex gap-2 flex-wrap">
                              {['Fisik tidak ada', 'Barang rusak', 'Tidak sesuai pesanan', 'SN berbeda'].map(reason => (
                                <button
                                  key={reason}
                                  type="button"
                                  onClick={() => {
                                    const newItems = [...bulkItems];
                                    newItems[idx].reason = reason;
                                    setBulkItems(newItems);
                                  }}
                                  className="px-2 py-1 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 rounded-md text-[10px] transition-colors"
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 bg-gray-900/50 rounded-b-3xl">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm">
                  <span className="text-gray-400">Total: {bulkItems.length} | </span>
                  <span className="text-green-400 font-medium">{bulkItems.filter(i => i.accepted).length} diterima</span>
                  <span className="text-gray-400"> | </span>
                  <span className="text-red-400 font-medium">{bulkItems.filter(i => !i.accepted).length} ditolak</span>
                </div>
              </div>
              <button 
                onClick={handleBulkSubmit}
                disabled={bulkLoading || bulkItems.some(i => !i.accepted && !i.reason.trim())}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {bulkLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Konfirmasi Penerimaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Search Modal */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-glass-bg border border-glass-border rounded-2xl w-full max-w-2xl">
            <div className="p-4 border-b border-glass-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Pilih dari Stok</h3>
              <button onClick={() => setIsInventoryModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-4">
              <input 
                type="text" 
                placeholder="Cari nama, model, SN..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full bg-black/20 border border-glass-border rounded-lg px-4 py-2 text-white mb-4"
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableInventory.filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.serialNumber?.toLowerCase().includes(inventorySearch.toLowerCase())).map(product => (
                  <div key={product.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-glass-border cursor-pointer" onClick={() => handleAddFromInventory(product)}>
                    <div>
                      <p className="text-white text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">SN: {product.serialNumber}</p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        <div ref={suratJalanRef}>
          {printData && <DeliveryOrderPrinter {...printData} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
