'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Search, Plus, Edit, Trash2, Upload, Loader2, Package, CheckCircle2, Tag, CheckSquare, Square, Download, Eye } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ProductForm from './ProductForm';
import ProductDetailModal from './ProductDetailModal';
import ImportVerificationModal from './ImportVerificationModal';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [userRole, setUserRole] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(undefined);
  
  // Stock Viewer state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState<any>(null);
  
  // Bulk Import & Verification state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: boolean, message: string} | null>(null);
  const [importVerificationOpen, setImportVerificationOpen] = useState(false);
  const [parsedPreviewProducts, setParsedPreviewProducts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchPromoPrice, setBatchPromoPrice] = useState('');
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/products', { params: { search, branchId: selectedBranch } });
      if (res.data.success) {
        setProducts(res.data.data);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get('/branches');
      if (res.data.success) {
        setBranches(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch branches');
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user) {
      setUserRole(user.role);
    }
    if (user && ['Super Admin', 'Finance', 'Management', 'Warehouse', 'Admin', 'Leader'].includes(user.role)) {
      fetchBranches();
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedBranch]);

  // Checkboxes
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Actions
  const handleAddClick = () => {
    setSelectedProduct(undefined);
    setFormOpen(true);
  };

  const handleRowClick = (product: any) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  const handleEditClick = (product: any) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`/products/${id}`);
        toast.success('Product deleted');
        fetchProducts();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete product');
      }
    }
  };

  const handleFormClose = (saved: boolean) => {
    setFormOpen(false);
    setSelectedProduct(undefined);
    if (saved) fetchProducts();
  };

  const handleBatchUpdate = async () => {
    if (selectedIds.length === 0) return;
    if (!batchStatus && !batchPromoPrice) {
      toast.error('Pilih status baru atau masukkan harga promo');
      return;
    }

    setIsBatchUpdating(true);
    try {
      const payload: any = { ids: selectedIds };
      if (batchStatus) payload.status = batchStatus;
      if (batchPromoPrice !== '') payload.promoPrice = Number(batchPromoPrice);

      const res = await apiClient.put('/products/bulk', payload);
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedIds([]);
        setBatchStatus('');
        setBatchPromoPrice('');
        fetchProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memperbarui produk secara massal');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} produk yang dipilih?`)) return;

    setIsBatchUpdating(true);
    try {
      const res = await apiClient.delete('/products/bulk', { data: { ids: selectedIds } });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedIds([]);
        fetchProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus produk secara massal');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, "Inventory_Export.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) throw new Error('Excel file is empty');

      const warehouse = branches.find((b: any) => b.isWarehouse) || 
                        branches.find((b: any) => b.name.toLowerCase().includes('gudang') || b.name.toLowerCase().includes('warehouse')) || 
                        branches.find((b: any) => b.id === 'branch-001') || 
                        branches[0];
      const targetWarehouseBranchId = warehouse ? warehouse.id : 'branch-001';

      const formattedProducts = jsonData.map((row) => {
        const spesifikasiRaw = String(row['SPESIFIKASI'] || row['Spesifikasi'] || row['spek'] || row['SPEK'] || '').trim();
        let processor = row['PROCESSOR'] || row['processor'] || row['Processor'] || undefined;
        let ram = row['RAM'] || row['ram'] || undefined;
        let gpu = row['GPU'] || row['gpu'] || row['VGA'] || row['vga'] || undefined;
        let storage = row['STORAGE'] || row['storage'] || row['Storage'] || undefined;
        let screenSize = row['SCREEN_SIZE'] || row['screenSize'] || row['Ukuran Layar'] || undefined;

        if (spesifikasiRaw && spesifikasiRaw.includes('/')) {
          const parts = spesifikasiRaw.split('/').map(p => p.trim());
          if (parts[0]) processor = parts[0];
          if (parts[1]) ram = parts[1];

          if (parts.length === 4) {
            // Standard 4-part format: Processor / RAM / Storage / GPU
            storage = parts[2];
            gpu = parts[3];
          } else if (parts.length >= 5) {
            // 5-part format: Processor / RAM / Storage / GPU / ScreenSize
            const isP2Gpu = /intel|nvidia|geforce|radeon|rtx|gtx|uhd|hd/i.test(parts[2]);
            if (isP2Gpu) {
              gpu = parts[2];
              storage = parts[3];
            } else {
              storage = parts[2];
              gpu = parts[3];
            }
            screenSize = parts[4];
          } else if (parts.length === 3) {
            storage = parts[2];
          }
        }

        const color = String(row['WARNA'] || row['Warna'] || row['COLOR'] || row['color'] || '').trim() || undefined;

        const buyPrice = Number(row['HARGA HPP'] || row['Harga HPP'] || row['HPP_SUPPLIER'] || row['BASE_PRICE'] || row['basePrice'] || row['Buy Price'] || 0);
        const developmentCost = Number(row['MODAL PENGEMBANG'] || row['Modal Pengembang'] || row['DEVELOPMENT_COST'] || row['modalPengembang'] || 0);
        const sellPrice = Number(row['HARGA JUAL'] || row['Harga Jual'] || row['RETAIL_PRICE'] || row['retailPrice'] || row['Sell Price'] || 0);

        return {
          sku: String(row['SKU'] || row['sku'] || row['ID Produk'] || row['id'] || ''),
          name: String(row['NAME'] || row['name'] || row['Name'] || ''),
          category: String(row['CATEGORY'] || row['category'] || row['Category'] || row['KATEGORI'] || row['Kategori'] || '').trim() || 'Laptop',
          brand: row['BRAND'] || row['brand'] || row['Brand'] || undefined,
          model: row['MODEL'] || row['model'] || row['Model'] || undefined,
          processor,
          ram,
          gpu,
          storage,
          screenSize,
          color,
          buyPrice,
          developmentCost,
          sellPrice,
          serialNumber: row['SERIAL_NUMBER'] || row['serialNumber'] || row['Serial Number'] || undefined,
          qty: Number(row['QTY'] || row['qty'] || 1),
          branchId: targetWarehouseBranchId,
        };
      });

      setParsedPreviewProducts(formattedProducts);
      setImportVerificationOpen(true);
    } catch (error: any) {
      let errMessage = error.response?.data?.error || error.message || 'Gagal membaca file Excel';
      setImportResult({ success: false, message: errMessage });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async (finalProducts: any[]) => {
    if (finalProducts.length === 0) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await apiClient.post('/products/bulk', { products: finalProducts });
      if (res.data.success) {
        setImportResult({ success: true, message: res.data.message });
        toast.success(res.data.message || 'Import stok berhasil');
        setImportVerificationOpen(false);
        fetchProducts();
      }
    } catch (error: any) {
      let errMessage = error.response?.data?.error || error.message || 'Gagal mengimpor data ke server';
      if (error.response?.data?.details) {
        if (Array.isArray(error.response.data.details)) {
          const detailStr = error.response.data.details
            .map((d: any) => (typeof d === 'object' && d !== null ? (d.message || d.error || JSON.stringify(d)) : String(d)))
            .join('; ');
          errMessage += `: ${detailStr}`;
        } else if (typeof error.response.data.details === 'object') {
          errMessage += `: ${JSON.stringify(error.response.data.details)}`;
        } else {
          errMessage += `: ${error.response.data.details}`;
        }
      }
      setImportResult({ success: false, message: errMessage });
      toast.error(errMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'SKU': 'LP-ASUS-001',
        'NAME': 'Laptop Gaming ASUS ROG Strix',
        'CATEGORY': 'Laptop',
        'BRAND': 'ASUS',
        'MODEL': 'ROG Strix G15',
        'SPESIFIKASI': 'Intel Core i7-10750H/16GB/NVIDIA RTX 2060/512GB SSD/15.6" FHD 144Hz',
        'WARNA': 'Hitam Metalik',
        'HARGA HPP': 8500000,
        'MODAL PENGEMBANG': 500000,
        'HARGA JUAL': 11000000,
        'SERIAL_NUMBER': 'SN-ROG-123',
        'QTY': 1
      },
      {
        'SKU': 'LP-LENOVO-002',
        'NAME': 'Lenovo ThinkPad T480',
        'CATEGORY': 'Laptop',
        'BRAND': 'Lenovo',
        'MODEL': 'ThinkPad T480',
        'SPESIFIKASI': 'Intel Core i7-8650U/16GB/Intel HD 620/256GB SSD/14" FHD IPS',
        'WARNA': 'Hitam Matte',
        'HARGA HPP': 4200000,
        'MODAL PENGEMBANG': 300000,
        'HARGA JUAL': 5800000,
        'SERIAL_NUMBER': 'SN-TP-8899',
        'QTY': 1
      },
      {
        'SKU': 'ACC-MS-002',
        'NAME': 'Mouse Wireless Logitech M190',
        'CATEGORY': 'Aksesoris',
        'BRAND': 'Logitech',
        'MODEL': 'M190',
        'SPESIFIKASI': '-/-/-/-/-',
        'WARNA': 'Hitam',
        'HARGA HPP': 120000,
        'MODAL PENGEMBANG': 0,
        'HARGA JUAL': 180000,
        'SERIAL_NUMBER': 'BATCH-M190-001',
        'QTY': 50
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Zabran_Stock_Init_Template.xlsx");
  };

  const warehouseStock = products.reduce((total, p) => {
    if (Array.isArray(p.items) && p.items.length > 0) {
      const wCount = p.items.filter((i: any) => 
        i.branchId === 'branch-001' || 
        i.branch?.isWarehouse || 
        (i.branch?.name && i.branch.name.toLowerCase().includes('gudang'))
      ).reduce((acc: number, item: any) => acc + (item.qty || 1), 0);
      return total + wCount;
    }
    return total + (p.branchId === 'branch-001' || !p.branchId ? (p.totalStock || 0) : 0);
  }, 0);

  const cabangStock = products.reduce((total, p) => {
    if (Array.isArray(p.items) && p.items.length > 0) {
      const cCount = p.items.filter((i: any) => 
        i.branchId !== 'branch-001' && 
        !i.branch?.isWarehouse && 
        !(i.branch?.name && i.branch.name.toLowerCase().includes('gudang'))
      ).reduce((acc: number, item: any) => acc + (item.qty || 1), 0);
      return total + cCount;
    }
    return total + (p.branchId && p.branchId !== 'branch-001' ? (p.totalStock || 0) : 0);
  }, 0);

  const canViewCost = ['Super Admin', 'Finance', 'Management', 'Warehouse', 'Admin', 'Leader'].includes(userRole);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const displaySummary = useMemo(() => {
    const counts: Record<string, number> = { Laptop: 0, Aksesoris: 0, Service: 0, Lainnya: 0 };
    products.forEach((p: any) => {
      let cat = (p.categoryName || p.category?.name || p.category || 'Laptop').trim();
      if (!cat || cat === 'Uncategorized') cat = 'Laptop';
      
      const catLower = cat.toLowerCase();
      if (catLower.includes('laptop') || catLower.includes('unit')) {
        counts['Laptop'] = (counts['Laptop'] || 0) + 1;
      } else if (catLower.includes('aksesoris') || catLower.includes('accessories')) {
        counts['Aksesoris'] = (counts['Aksesoris'] || 0) + 1;
      } else if (catLower.includes('service') || catLower.includes('jasa')) {
        counts['Service'] = (counts['Service'] || 0) + 1;
      } else {
        counts['Lainnya'] = (counts['Lainnya'] || 0) + 1;
      }
    });

    return {
      Laptop: summary['Laptop'] ?? counts['Laptop'],
      Aksesoris: summary['Aksesoris'] ?? counts['Aksesoris'],
      Service: summary['Service'] ?? counts['Service'],
      Lainnya: summary['Lainnya'] ?? counts['Lainnya']
    };
  }, [products, summary]);

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Dedicated Inventory Overview Banner for Operational / Warehouse */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-teal-900/30 to-blue-950/40 p-6 rounded-3xl border border-emerald-500/20 backdrop-blur-md shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white">Overview Operasional Inventaris</h1>
                {userRole === 'Warehouse' && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
                    Divisi Warehouse
                  </span>
                )}
              </div>
              <p className="text-muted text-sm mt-0.5">Pusat kontrol katalog produk, manajemen stok barang, dan transfer inventaris antar cabang.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="px-5 py-3 bg-glass-bg/80 rounded-2xl border border-emerald-500/30 shadow-inner flex-1 min-w-[150px]">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Stok di Warehouse</p>
              <p className="text-xl font-extrabold text-white">{warehouseStock} <span className="text-xs font-normal text-muted">Unit</span></p>
            </div>
            <div className="px-5 py-3 bg-glass-bg/80 rounded-2xl border border-blue-500/30 shadow-inner flex-1 min-w-[150px]">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">Stok di Cabang</p>
              <p className="text-xl font-extrabold text-white">{cabangStock} <span className="text-xs font-normal text-muted">Unit</span></p>
            </div>
            <div className="px-5 py-3 bg-glass-bg/80 rounded-2xl border border-glass-border shadow-inner flex-1 min-w-[130px]">
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Total Katalog</p>
              <p className="text-xl font-extrabold text-white">{products.length} <span className="text-xs font-normal text-muted">Item</span></p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-bold text-white mb-0.5">Katalog & Stok Produk</h2>
            <p className="text-muted text-xs">Kelola ketersediaan stok, harga jual, serta penambahan unit baru.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-64 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Cari SKU, Nama, atau Brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-glass-bg/80 border border-glass-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Branch Filter */}
            {['Super Admin', 'Finance', 'Management', 'Warehouse', 'Admin', 'Leader'].includes(userRole) && (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-glass-bg/80 border border-glass-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-blue-500 text-sm transition-colors"
              >
                <option value="all">Semua Cabang</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            
            {/* Actions for Admin & Warehouse */}
            {['Super Admin', 'Management', 'Finance', 'Warehouse', 'Admin'].includes(userRole) && (
              <div className="flex gap-2">
                <button onClick={handleDownloadTemplate} className="px-4 py-2.5 bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Template
                </button>
                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="px-4 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import Excel
                </button>
                <button 
                  onClick={handleExport}
                  className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            )}
            
            {/* Add Product */}
            <button 
              onClick={handleAddClick}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Category Summary Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-muted text-sm mb-1 font-medium z-10">Total Laptop</span>
            <span className="text-2xl font-bold text-white z-10">
              {displaySummary['Laptop'] || 0} <span className="text-sm font-normal text-gray-500">unit</span>
            </span>
          </div>
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-muted text-sm mb-1 font-medium z-10">Total Aksesoris</span>
            <span className="text-2xl font-bold text-white z-10">
              {displaySummary['Aksesoris'] || 0} <span className="text-sm font-normal text-gray-500">pcs</span>
            </span>
          </div>
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-muted text-sm mb-1 font-medium z-10">Total Jasa Service</span>
            <span className="text-2xl font-bold text-white z-10">
              {displaySummary['Service'] || 0} <span className="text-sm font-normal text-gray-500">items</span>
            </span>
          </div>
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-muted text-sm mb-1 font-medium z-10">Kategori Lainnya</span>
            <span className="text-2xl font-bold text-white z-10">
               {displaySummary['Lainnya'] || 0}
               <span className="text-sm font-normal text-gray-500"> items</span>
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Laptop', 'Aksesoris', 'Service', 'Lainnya'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-glass-bg text-muted hover:bg-white/10 hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {importResult && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${importResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {importResult.success ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center font-bold text-xs">!</div>}
            <span className="text-sm">{importResult.message}</span>
            <button onClick={() => setImportResult(null)} className="ml-auto text-current opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Batch Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-600/20 border border-blue-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between animate-in slide-in-from-top-4">
            <div className="flex items-center gap-2 text-blue-400 font-medium">
              <CheckSquare className="w-5 h-5" />
              <span>{selectedIds.length} items selected</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={batchStatus} 
                onChange={e => setBatchStatus(e.target.value)}
                className="px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-foreground text-sm outline-none"
              >
                <option value="">-- Change Status --</option>
                {['Available', 'Reserved', 'Sold', 'Return', 'Service', 'Damaged', 'QC_Pending', 'Return_Supplier'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input 
                type="number" 
                placeholder="Set Promo Price" 
                value={batchPromoPrice}
                onChange={e => setBatchPromoPrice(e.target.value)}
                className="px-3 py-2 w-40 bg-glass-bg border border-glass-border rounded-lg text-foreground text-sm outline-none"
              />
              <button 
                onClick={handleBatchUpdate}
                disabled={isBatchUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isBatchUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                Apply Batch Edit
              </button>
              <button 
                onClick={handleBatchDelete}
                disabled={isBatchUpdating}
                className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isBatchUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Batch Delete
              </button>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-5 py-4">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={products.length > 0 && selectedIds.length === products.length}
                      className="w-4 h-4 rounded border-gray-600 bg-black/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-4 font-medium">ID Produk</th>
                  <th className="px-5 py-4 font-medium">Nama Produk</th>
                  <th className="px-5 py-4 font-medium">Spesifikasi (Proc/RAM/VGA/Storage/Layar)</th>
                  <th className="px-5 py-4 font-medium text-center">Warna</th>
                  {canViewCost && (
                    <>
                      <th className="px-5 py-4 font-medium text-right">HPP Supplier</th>
                      <th className="px-5 py-4 font-medium text-right">Modal QC/Service</th>
                    </>
                  )}
                  <th className="px-5 py-4 font-medium text-right">Harga Jual</th>
                  <th className="px-5 py-4 font-medium text-center">Stok</th>
                  <th className="px-5 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={canViewCost ? 10 : 8} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={canViewCost ? 10 : 8} className="px-6 py-16 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">No products found</p>
                    </td>
                  </tr>
                ) : (
                  products
                    .filter((p: any) => {
                      if (activeTab === 'All') return true;
                      const cat = (p.categoryName || p.category?.name || '').toLowerCase();
                      if (activeTab === 'Laptop') return cat.includes('laptop') || cat.includes('unit');
                      if (activeTab === 'Aksesoris') return cat.includes('aksesoris') || cat.includes('accessories');
                      if (activeTab === 'Service') return cat.includes('service') || cat.includes('jasa');
                      return !cat.includes('laptop') && !cat.includes('unit') && !cat.includes('aksesoris') && !cat.includes('accessories') && !cat.includes('service') && !cat.includes('jasa');
                    })
                    .map((product) => {
                      const specFormatted = [
                        product.processor,
                        product.ram,
                        product.gpu,
                        product.storage,
                        product.screenSize
                      ].filter(Boolean).join('/');

                      const hpp = Number(product.buyPrice) || 0;
                      const devCost = Number(product.developmentCost) || 0;
                      const sellPrice = Number(product.sellPrice) || 0;

                      return (
                        <tr key={product.id} className={`hover:bg-nav-hover transition-colors ${selectedIds.includes(product.id) ? 'bg-blue-500/5' : ''}`}>
                          <td className="px-5 py-4">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(product.id)}
                              onChange={() => handleSelectOne(product.id)}
                              className="w-4 h-4 rounded border-gray-600 bg-black/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                            />
                          </td>
                          <td className="px-5 py-4 font-mono text-muted text-xs">{product.sku || product.id}</td>
                          <td className="px-5 py-4 font-medium text-white max-w-[200px]">
                            <div className="truncate font-semibold">{product.name}</div>
                            <div className="text-xs text-gray-400 font-normal">{product.brand} {product.model}</div>
                          </td>
                          <td className="px-5 py-4 text-xs font-mono text-emerald-400 max-w-[220px]">
                            <div className="truncate" title={specFormatted || '-'}>
                              {specFormatted || '-'}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-center text-gray-300">
                            {product.color || '-'}
                          </td>
                          {canViewCost && (
                            <>
                              <td className="px-5 py-4 text-right text-xs font-medium text-gray-300">
                                {formatRupiah(hpp)}
                              </td>
                              <td className="px-5 py-4 text-right text-xs font-medium text-amber-400">
                                {formatRupiah(devCost)}
                              </td>
                            </>
                          )}
                          <td className="px-5 py-4 text-right">
                            {product.promoPrice ? (
                              <div className="flex flex-col items-end">
                                <span className="font-medium text-xs text-green-400">{formatRupiah(product.promoPrice)}</span>
                                <span className="text-[10px] text-gray-500 line-through">{formatRupiah(sellPrice)}</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-xs text-emerald-400">{formatRupiah(sellPrice)}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full">
                              {product.totalStock || 0}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-center items-center gap-1.5">
                              <button onClick={(e) => { e.stopPropagation(); setSelectedStockProduct(product); setStockModalOpen(true); }} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors" title="View Stock">
                                <Package className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleRowClick(product); }} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              {['Super Admin', 'Finance', 'Management', 'Warehouse', 'Admin', 'Leader'].includes(userRole) && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleEditClick(product); }} className="p-1.5 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors" title="Edit">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(product.id); }} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formOpen && (
        <ProductForm 
          open={formOpen} 
          onClose={handleFormClose} 
          product={selectedProduct} 
        />
      )}

      {detailOpen && (
        <ProductDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          product={selectedProduct}
          userRole={userRole}
          onEdit={handleEditClick}
        />
      )}

      {stockModalOpen && selectedStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Rincian Stok ({selectedStockProduct.totalStock || 0})</h3>
                <p className="text-sm text-gray-400 font-mono">{selectedStockProduct.sku} - {selectedStockProduct.name}</p>
              </div>
              <button onClick={() => setStockModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-xs uppercase text-gray-500 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 font-medium">Serial Number / Barcode</th>
                    <th className="px-6 py-4 font-medium text-center">Qty</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedStockProduct.items && selectedStockProduct.items.length > 0 ? (
                    selectedStockProduct.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs">{item.sn}</td>
                        <td className="px-6 py-3 text-center font-bold text-blue-400">{item.qty || 1}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 rounded-md uppercase">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                        Belum ada stok fisik yang tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ImportVerificationModal
        open={importVerificationOpen}
        onClose={() => setImportVerificationOpen(false)}
        onConfirm={handleConfirmImport}
        initialProducts={parsedPreviewProducts}
        isSubmitting={isImporting}
      />
    </DashboardLayout>
  );
}
