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

  const canManage = ['Super Admin', 'Finance', 'Management', 'Warehouse', 'Admin', 'Leader'].includes(userRole);
  const totalModal = (Number(product.buyPrice) || 0) + (Number(product.developmentCost) || 0);
  const marginProfit = (Number(product.sellPrice) || 0) - totalModal;

  const formattedSpecStr = [
    product.processor || '-',
    product.ram || '-',
    product.gpu || '-',
    product.storage || '-',
    product.screenSize || '-'
  ].join('/');

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-2xl shadow-2xl my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Detail & Modal Produk
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
              <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                  {product.status || 'Available'}
                </span>
                <span className="text-muted text-sm">{product.category?.name || product.categoryName || 'Laptop'}</span>
                {product.color && (
                  <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium">
                    Warna: {product.color}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {canManage && (
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
              <button 
                onClick={onClose}
                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-glass-bg/50 p-4 rounded-2xl border border-glass-border">
              <div className="flex items-center gap-2 text-muted mb-1 text-sm">
                <Hash className="w-4 h-4" />
                ID Produk (SKU)
              </div>
              <div className="text-white font-mono">{product.sku || product.id}</div>
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
                Lokasi Cabang / Gudang
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

          {/* Specifications */}
          <div className="bg-glass-bg/50 p-5 rounded-2xl border border-glass-border space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Spesifikasi Detail</h3>
              <span className="text-xs font-mono bg-black/40 px-3 py-1 rounded-lg border border-glass-border text-emerald-400">
                {formattedSpecStr}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Cpu className="w-3 h-3"/> Processor</div>
                <div className="text-sm text-gray-200 font-medium">{product.processor || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><HardDrive className="w-3 h-3"/> RAM</div>
                <div className="text-sm text-gray-200 font-medium">{product.ram || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Monitor className="w-3 h-3"/> VGA / GPU</div>
                <div className="text-sm text-gray-200 font-medium">{product.gpu || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><HardDrive className="w-3 h-3"/> Storage</div>
                <div className="text-sm text-gray-200 font-medium">{product.storage || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Monitor className="w-3 h-3"/> Ukuran Layar</div>
                <div className="text-sm text-gray-200 font-medium">{product.screenSize || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Tag className="w-3 h-3"/> Warna</div>
                <div className="text-sm text-gray-200 font-medium">{product.color || '-'}</div>
              </div>
            </div>
          </div>

          {/* Pricing & Modal Breakdown Structure */}
          <div className="bg-gradient-to-br from-blue-950/40 via-teal-950/20 to-slate-900/40 p-5 rounded-2xl border border-blue-500/20 space-y-4 mt-4">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-4 h-4" /> Rincian Modal & Harga Jual Unit Second
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-black/30 p-3.5 rounded-xl border border-glass-border">
                <div className="text-[11px] text-muted mb-1 font-medium">1. Harga HPP (Supplier)</div>
                <div className="text-base font-bold text-white">{formatRupiah(product.buyPrice)}</div>
              </div>
              <div className="bg-black/30 p-3.5 rounded-xl border border-glass-border">
                <div className="text-[11px] text-muted mb-1 font-medium">2. Modal Pengembang (QC/Service)</div>
                <div className="text-base font-bold text-amber-400">{formatRupiah(product.developmentCost || 0)}</div>
              </div>
              <div className="bg-black/30 p-3.5 rounded-xl border border-glass-border">
                <div className="text-[11px] text-muted mb-1 font-medium">3. Harga Jual (Konsumen)</div>
                <div className="text-base font-bold text-emerald-400">{formatRupiah(product.sellPrice)}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-glass-border">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Total Modal Fisik Unit:</span>
                <span className="text-sm font-extrabold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  {formatRupiah(totalModal)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Estimasi Gross Margin:</span>
                <span className={`text-sm font-extrabold px-3 py-1 rounded-lg border ${marginProfit >= 0 ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-red-300 bg-red-500/10 border-red-500/20'}`}>
                  {formatRupiah(marginProfit)}
                </span>
              </div>
            </div>
          </div>

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
