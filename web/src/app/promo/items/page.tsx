'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Tag, Loader2, Search, Plus, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PromoItemsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [promoType, setPromoType] = useState<'nominal' | 'percent'>('nominal');
  const [promoValue, setPromoValue] = useState<number | ''>('');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [itemTab, setItemTab] = useState<'set' | 'list'>('set');
  const [filterBranchPromo, setFilterBranchPromo] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await apiClient.get('/inventory/stock');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      toast.error('Gagal mengambil data produk');
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) || 
    p.id.toLowerCase().includes(searchProduct.toLowerCase())
  );

  let displayProducts = filteredProducts;
  if (itemTab === 'list') {
    displayProducts = displayProducts
      .filter(p => p.promoPrice && p.promoPrice < p.sellPrice)
      .filter(p => filterBranchPromo === 'all' || p.branchId === filterBranchPromo)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(displayProducts.map(p => p.id)));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const applyItemPromo = async () => {
    if (selectedIds.size === 0) return toast.error('Pilih minimal 1 produk');
    if (promoValue === '' || Number(promoValue) < 0) return toast.error('Masukkan nilai promo yang valid');

    const updates = Array.from(selectedIds).map(id => {
      const product = products.find(p => p.id === id);
      if (!product) return null;
      let newPromoPrice = promoType === 'nominal' 
        ? product.sellPrice - Number(promoValue)
        : product.sellPrice - (product.sellPrice * (Number(promoValue) / 100));
      return { id, updates: { promoPrice: Math.max(0, newPromoPrice) } };
    }).filter(Boolean);

    setIsSubmittingItem(true);
    try {
      const res = await apiClient.patch('/inventory/stock/batch', updates);
      toast.success(res.data.message || 'Promo berhasil diterapkan');
      setSelectedIds(new Set());
      setPromoValue('');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menerapkan promo');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const removeItemPromo = async () => {
    if (selectedIds.size === 0) return toast.error('Pilih minimal 1 produk');
    const updates = Array.from(selectedIds).map(id => ({ id, updates: { promoPrice: null } }));
    setIsSubmittingItem(true);
    try {
      const res = await apiClient.patch('/inventory/stock/batch', updates);
      toast.success(res.data.message || 'Promo berhasil dihapus');
      setSelectedIds(new Set());
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus promo');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="flex justify-between items-center bg-glass-bg p-6 rounded-2xl border border-glass-border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/promo" className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5 text-muted" />
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Diskon Item (Produk)</h1>
            </div>
            <p className="text-muted text-sm ml-10">Atur harga diskon untuk produk tertentu.</p>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex bg-glass-bg p-1 rounded-xl border border-glass-border">
              <button 
                onClick={() => setItemTab('set')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${itemTab === 'set' ? 'bg-blue-600 text-white' : 'text-muted hover:text-white'}`}
              >
                <Plus className="w-4 h-4" /> Atur Diskon
              </button>
              <button 
                onClick={() => setItemTab('list')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${itemTab === 'list' ? 'bg-blue-600 text-white' : 'text-muted hover:text-white'}`}
              >
                <Tag className="w-4 h-4" /> Daftar Diskon
              </button>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  placeholder="Cari SN atau Nama Produk..."
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <GlassCard className="rounded-2xl flex-1 flex flex-col overflow-hidden p-0 border border-glass-border">
            {itemTab === 'set' && (
              <div className="bg-black/5 dark:bg-white/5 p-4 border-b border-glass-border flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2 items-center w-full lg:w-auto">
                  <select 
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as any)}
                    className="bg-glass-bg border border-glass-border text-foreground text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="nominal">Potongan (Rp)</option>
                    <option value="percent">Diskon (%)</option>
                  </select>
                  <input 
                    type="number"
                    value={promoValue}
                    onChange={(e) => setPromoValue(Number(e.target.value))}
                    placeholder={promoType === 'nominal' ? "Misal: 50000" : "Misal: 10"}
                    className="flex-1 lg:w-40 bg-glass-bg border border-glass-border text-foreground text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={applyItemPromo}
                    disabled={isSubmittingItem || selectedIds.size === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSubmittingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Terapkan'}
                  </button>
                </div>
                
                <div className="text-sm text-muted">
                  <span className="font-bold text-white">{selectedIds.size}</span> produk dipilih
                </div>
              </div>
            )}
            
            {itemTab === 'list' && (
              <div className="bg-black/5 dark:bg-white/5 p-4 border-b border-glass-border flex justify-between items-center">
                <h3 className="font-semibold text-foreground">Daftar Produk Sedang Diskon</h3>
                <button 
                  onClick={removeItemPromo}
                  disabled={isSubmittingItem || selectedIds.size === 0}
                  className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmittingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus Diskon'}
                </button>
              </div>
            )}

            <div className="overflow-y-auto flex-1">
              {loadingProducts ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
              ) : displayProducts.length === 0 ? (
                <div className="text-center py-20 text-muted">Data produk tidak ditemukan</div>
              ) : (
                <table className="w-full text-sm text-left text-muted">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/10 dark:bg-black/40 border-b border-glass-border sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-4 text-center w-16">
                        <input type="checkbox" checked={selectedIds.size === displayProducts.length && displayProducts.length > 0} onChange={handleSelectAll} className="w-4 h-4 rounded border-gray-600 accent-blue-600" />
                      </th>
                      <th className="px-6 py-4 font-semibold">Produk</th>
                      <th className="px-6 py-4 font-semibold">Harga Normal</th>
                      <th className="px-6 py-4 font-semibold">Harga Promo</th>
                      <th className="px-6 py-4 font-semibold">Diskon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {displayProducts.map((p) => {
                      const isPromo = p.promoPrice && p.promoPrice < p.sellPrice;
                      const discountVal = isPromo ? p.sellPrice - p.promoPrice : 0;
                      return (
                        <tr key={p.id} className={`transition-colors ${selectedIds.has(p.id) ? 'bg-blue-500/10' : 'hover:bg-nav-hover'}`}>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(p.id)} 
                              onChange={() => handleSelectOne(p.id)} 
                              className="w-4 h-4 rounded border-gray-600 accent-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-xs text-muted">SN: {p.id}</p>
                          </td>
                          <td className={`px-6 py-4 font-medium ${isPromo ? 'line-through text-muted/50' : 'text-foreground'}`}>
                            {formatRupiah(p.sellPrice)}
                          </td>
                          <td className="px-6 py-4 font-medium text-green-500">
                            {isPromo ? formatRupiah(p.promoPrice) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {isPromo ? (
                              <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded-md text-xs font-bold">
                                -{formatRupiah(discountVal)}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
