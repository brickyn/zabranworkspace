import React from 'react';
import { X, Edit, Package, Tag, Hash, Box, Cpu, HardDrive, Monitor, DollarSign } from 'lucide-react';

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product: any;
  userRole: string;
  onEdit: (product: any) => void;
}

export default function ProductDetailModal({ open, onClose, product, userRole, onEdit }: ProductDetailModalProps) {
  if (!open || !product) return null;

  const isAdmin = ['Super Admin', 'Finance', 'Management'].includes(userRole);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-2xl shadow-2xl my-8">
        
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Product Details
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{product.name}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                  {product.status || 'Available'}
                </span>
                <span className="text-muted text-sm">{product.category || 'Laptop'}</span>
              </div>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Edit className="w-4 h-4" />
                Edit Product
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-glass-bg/50 p-4 rounded-2xl border border-glass-border">
              <div className="flex items-center gap-2 text-muted mb-1 text-sm">
                <Hash className="w-4 h-4" />
                ID Produk (Kode-YYMMDD-XXX)
              </div>
              <div className="text-white font-mono">{product.id}</div>
            </div>
            
            <div className="bg-glass-bg/50 p-4 rounded-2xl border border-glass-border">
              <div className="flex items-center gap-2 text-muted mb-1 text-sm">
                <Tag className="w-4 h-4" />
                Brand & Model
              </div>
              <div className="text-white">{product.brand || '-'} {product.model || ''}</div>
            </div>

            <div className="bg-glass-bg/50 p-4 rounded-2xl border border-glass-border">
              <div className="flex items-center gap-2 text-muted mb-1 text-sm">
                <Box className="w-4 h-4" />
                Branch Location
              </div>
              <div className="text-white">{product.branch?.name || '-'}</div>
            </div>

            <div className="bg-glass-bg/50 p-4 rounded-2xl border border-glass-border">
              <div className="flex items-center gap-2 text-muted mb-1 text-sm">
                <Hash className="w-4 h-4" />
                Serial Number
              </div>
              <div className="text-white font-mono">{product.serialNumber || '-'}</div>
            </div>
          </div>

          <div className="bg-glass-bg/50 p-5 rounded-2xl border border-glass-border space-y-4 mt-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Specifications</h3>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Cpu className="w-3 h-3"/> Processor</div>
                <div className="text-sm text-gray-200">{product.processor || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><HardDrive className="w-3 h-3"/> RAM</div>
                <div className="text-sm text-gray-200">{product.ram || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><HardDrive className="w-3 h-3"/> Storage</div>
                <div className="text-sm text-gray-200">{product.storage || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Monitor className="w-3 h-3"/> GPU</div>
                <div className="text-sm text-gray-200">{product.gpu || '-'}</div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-blue-900/10 p-5 rounded-2xl border border-blue-500/20 space-y-4 mt-4">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Pricing (Admin Only)</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted mb-1">Buy Price</div>
                  <div className="text-sm font-medium text-white">{formatRupiah(product.buyPrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Sell Price</div>
                  <div className="text-sm font-medium text-green-400">{formatRupiah(product.sellPrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Promo Price</div>
                  <div className="text-sm font-medium text-yellow-400">{product.promoPrice ? formatRupiah(product.promoPrice) : '-'}</div>
                </div>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-glass-bg/50 p-5 rounded-2xl border border-glass-border flex justify-between items-center mt-4">
              <span className="text-muted">Harga Jual</span>
              <div className="text-right">
                {product.promoPrice ? (
                  <>
                    <div className="font-bold text-xl text-green-400">{formatRupiah(product.promoPrice)}</div>
                    <div className="text-sm text-gray-500 line-through">{formatRupiah(product.sellPrice)}</div>
                  </>
                ) : (
                  <div className="font-bold text-xl text-blue-400">{formatRupiah(product.sellPrice)}</div>
                )}
              </div>
            </div>
          )}

          {product.description && (
            <div className="mt-4">
              <h3 className="text-xs text-gray-500 mb-2">Description / Notes</h3>
              <p className="text-sm text-muted bg-glass-bg/50 p-4 rounded-xl border border-glass-border leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}
          
        </div>

      </div>
    </div>
  );
}
