'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

interface ProductFormProps {
  open: boolean;
  onClose: (saved: boolean) => void;
  product?: any;
}

const STATUS_OPTIONS = ['Available', 'Reserved', 'Sold', 'Return', 'Service', 'Damaged', 'QC_Pending', 'Return_Supplier'];

export default function ProductForm({ open, onClose, product }: ProductFormProps) {
  const [formData, setFormData] = useState<any>({
    status: 'Available',
    buyPrice: 0,
    sellPrice: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      // Set defaults for new product, also fetch branch ID from logged in user if possible
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      setFormData({
        status: 'Available',
        buyPrice: 0,
        sellPrice: 0,
        promoPrice: '',
        name: '',
        sku: '',
        brand: '',
        model: '',
        processor: '',
        ram: '',
        storage: '',
        gpu: '',
        screenSize: '',
        condition: '',
        category: '',
        serialNumber: '',
        imageUrl: '',
        branchId: user?.branchId || '',
      });
    }
    setError(null);
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (['buyPrice', 'sellPrice', 'promoPrice'].includes(name)) {
      let numValue = value === '' ? null : Number(value);
      setFormData((prev: any) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Map sku to id if it's a new product, because the schema uses 'id' for Serial Number
      const payload = { ...formData, id: formData.sku || formData.id };
      delete payload.sku; // sku was just used for the form state

      if (product) {
        await apiClient.put(`/products/${product.id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await apiClient.post('/products', payload);
        toast.success('Product created successfully');
      }
      onClose(true);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'An error occurred while saving.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-3xl shadow-2xl my-8">
        
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <h2 className="text-xl font-bold text-white">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button 
            type="button"
            onClick={() => onClose(false)}
            className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </div>
            )}

            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Product Name *</label>
                  <input required name="name" value={formData.name || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">ID Produk (Kode-YYMMDD-XXX) *</label>
                  <input required name={product ? 'id' : 'sku'} value={product ? formData.id : formData.sku || ''} onChange={handleChange} disabled={!!product} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all disabled:opacity-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Brand</label>
                  <input name="brand" value={formData.brand || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Model</label>
                  <input name="model" value={formData.model || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Category</label>
                  <select name="category" value={formData.category || 'Laptop'} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all appearance-none">
                    <option value="Laptop">Laptop</option>
                    <option value="Aksesoris">Aksesoris</option>
                    <option value="Service">Service</option>
                    <option value="Sewa">Sewa</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Serial Number *</label>
                  <input required name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Processor</label>
                  <input name="processor" value={formData.processor || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">RAM</label>
                  <input name="ram" value={formData.ram || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Storage</label>
                  <input name="storage" value={formData.storage || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* Pricing & Status */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">Pricing & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Buy Price (Modal) *</label>
                  <input required type="number" name="buyPrice" value={formData.buyPrice ?? ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Sell Price (Jual) *</label>
                  <input required type="number" name="sellPrice" value={formData.sellPrice ?? ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Promo Price</label>
                  <input type="number" name="promoPrice" value={formData.promoPrice ?? ''} onChange={handleChange} placeholder="Optional" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Status</label>
                  <select name="status" value={formData.status || 'Available'} onChange={handleChange} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all appearance-none">
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 rounded-b-3xl">
            <button 
              type="button" 
              onClick={() => onClose(false)} 
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
