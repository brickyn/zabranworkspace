'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Search, Plus, Edit, Trash2, Upload, Loader2, Package, CheckCircle2, Tag, CheckSquare, Square, Download, Eye } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ProductForm from './ProductForm';
import ProductDetailModal from './ProductDetailModal';

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
  
  // Bulk Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: boolean, message: string} | null>(null);
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
    if (user && ['Super Admin', 'Finance', 'Management'].includes(user.role)) {
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
    setDetailOpen(false);
    setFormOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiClient.delete(`/products/${id}`);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product.');
      }
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedIds.length === 0) return;
    
    const updateData: any = {};
    if (batchStatus) updateData.status = batchStatus;
    if (batchPromoPrice) updateData.promoPrice = Number(batchPromoPrice);

    if (Object.keys(updateData).length === 0) {
      toast.error('Please set a status or promo price to update.');
      return;
    }

    if (window.confirm(`Are you sure you want to update ${selectedIds.length} products?`)) {
      setIsBatchUpdating(true);
      try {
        await apiClient.put('/products/bulk', {
          ids: selectedIds,
          updateData
        });
        setSelectedIds([]);
        setBatchStatus('');
        setBatchPromoPrice('');
        toast.success(`Successfully updated ${selectedIds.length} products`);
        fetchProducts();
      } catch (error) {
        toast.error('Failed to bulk update products.');
      } finally {
        setIsBatchUpdating(false);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) {
      setIsBatchUpdating(true);
      try {
        await apiClient.delete('/products/bulk', {
          data: { ids: selectedIds }
        });
        setSelectedIds([]);
        toast.success(`Successfully deleted ${selectedIds.length} products`);
        fetchProducts();
      } catch (error) {
        toast.error('Failed to batch delete products.');
      } finally {
        setIsBatchUpdating(false);
      }
    }
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, "Inventory_Export.xlsx");
  };

  const handleFormClose = (saved: boolean) => {
    setFormOpen(false);
    if (saved) fetchProducts();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'sold': return 'bg-gray-500/20 text-muted border-gray-500/30';
      case 'reserved': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'service': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) throw new Error('Excel file is empty');

      const warehouse = branches.find((b: any) => b.isWarehouse) || branches.find((b: any) => b.name.toLowerCase().includes('zabran')) || branches[0];
      const defaultBranchId = warehouse ? warehouse.id : '';

      const formattedProducts = jsonData.map((row) => ({
        id: String(row['ID Produk'] || row['id'] || ''),
        serialNumber: row['Serial Number'] || row['serialNumber'] || undefined,
        name: String(row['Name'] || row['name']),
        brand: row['Brand'] || row['brand'] || undefined,
        model: row['Model'] || row['model'] || undefined,
        category: row['Category'] || row['category'] || undefined,
        processor: row['Processor'] || row['processor'] || undefined,
        ram: row['RAM'] || row['ram'] || undefined,
        storage: row['Storage'] || row['storage'] || undefined,
        gpu: row['GPU'] || row['gpu'] || undefined,
        buyPrice: Number(row['Buy Price'] || row['buyPrice'] || 0),
        sellPrice: Number(row['Sell Price'] || row['sellPrice'] || 0),
        branchId: selectedBranch !== 'all' ? selectedBranch : defaultBranchId,
        status: row['Status'] || row['status'] || 'Available',
      }));

      const res = await apiClient.post('/products/bulk', { products: formattedProducts });
      if (res.data.success) {
        setImportResult({ success: true, message: res.data.message });
        fetchProducts(); 
      }
    } catch (error: any) {
      let errMessage = error.response?.data?.error || error.message || 'Failed to import Excel';
      if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        errMessage += `: ${error.response.data.details.join(', ')}`;
      }
      setImportResult({ success: false, message: errMessage });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'ID Produk': 'GH-260707-001',
        'Serial Number': 'SN12345678',
        'Name': 'Laptop Gaming ASUS',
        'Brand': 'ASUS',
        'Model': 'ROG Strix',
        'Category': 'Laptop',
        'Processor': 'Intel i7',
        'RAM': '16GB',
        'Storage': '512GB SSD',
        'GPU': 'RTX 3060',
        'Buy Price': 10000000,
        'Sell Price': 12000000,
        'Branch ID': 'GH-PST',
        'Nama Store': 'Pusat',
        'Nama Brand': 'Gadget House',
        'Warehouse': 'Ya',
        'Status': 'Available'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Zabran_Product_Import_Template.xlsx");
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Master Inventory</h1>
            <p className="text-muted text-sm">Manage your product catalog, stock, and pricing.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-64 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search by ID Produk, Name, or Brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-glass-bg/80 border border-glass-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Branch Filter */}
            {['Super Admin', 'Finance', 'Management'].includes(userRole) && (
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
            
            {/* Actions for Admin */}
            {['Super Admin', 'Management', 'Finance'].includes(userRole) && (
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
              {summary['Laptop'] || 0} <span className="text-sm font-normal text-gray-500">unit</span>
            </span>
          </div>
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-muted text-sm mb-1 font-medium z-10">Total Aksesoris</span>
            <span className="text-2xl font-bold text-white z-10">
              {summary['Aksesoris'] || 0} <span className="text-sm font-normal text-gray-500">pcs</span>
            </span>
          </div>
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-muted text-sm mb-1 font-medium z-10">Total Jasa Service</span>
            <span className="text-2xl font-bold text-white z-10">
              {summary['Service'] || 0} <span className="text-sm font-normal text-gray-500">items</span>
            </span>
          </div>
          <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-muted text-sm mb-1 font-medium z-10">Kategori Lainnya</span>
            <span className="text-2xl font-bold text-white z-10">
               {Object.entries(summary).filter(([k]) => !['Laptop', 'Aksesoris', 'Service'].includes(k)).reduce((acc, [_, v]) => acc + v, 0)} 
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
                  <th className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={products.length > 0 && selectedIds.length === products.length}
                      className="w-4 h-4 rounded border-gray-600 bg-black/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 font-medium">ID Produk</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Specs</th>
                  <th className="px-6 py-4 font-medium">Serial Number</th>
                  <th className="px-6 py-4 font-medium text-right">Price</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">No products found</p>
                    </td>
                  </tr>
                ) : (
                  products
                    .filter(p => {
                      if (activeTab === 'All') return true;
                      const cat = p.category?.toLowerCase() || '';
                      if (activeTab === 'Laptop') return cat.includes('laptop') || cat.includes('unit');
                      if (activeTab === 'Aksesoris') return cat.includes('aksesoris') || cat.includes('accessories');
                      if (activeTab === 'Service') return cat.includes('service') || cat.includes('jasa');
                      return !cat.includes('laptop') && !cat.includes('unit') && !cat.includes('aksesoris') && !cat.includes('accessories') && !cat.includes('service') && !cat.includes('jasa');
                    })
                    .map((product) => (
                    <tr key={product.id} className={`hover:bg-nav-hover transition-colors ${selectedIds.includes(product.id) ? 'bg-blue-500/5' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(product.id)}
                          onChange={() => handleSelectOne(product.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-black/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-mono text-muted text-xs">{product.id}</td>
                      <td className="px-6 py-4 font-medium text-white">
                        {product.name}
                        <div className="text-xs text-gray-500 font-normal">{product.brand} {product.model}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted">
                        {[product.processor, product.ram, product.storage].filter(Boolean).join(' • ')}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {product.serialNumber ? (
                          <span className="px-2 py-1 bg-white/5 border border-glass-border rounded text-muted font-mono">
                            {product.serialNumber}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {product.promoPrice ? (
                          <div className="flex flex-col items-end">
                            <span className="font-medium text-green-400">{formatRupiah(product.promoPrice)}</span>
                            <span className="text-xs text-gray-500 line-through">{formatRupiah(product.sellPrice)}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-blue-400">{formatRupiah(product.sellPrice)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                          {product.status || 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleRowClick(product); }} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          {['Super Admin', 'Finance', 'Management'].includes(userRole) && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); handleEditClick(product); }} className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(product.id); }} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
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
    </DashboardLayout>
  );
}
