'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Target, Loader2, Edit3, CheckCircle2, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SalesTargetsPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Set Target State
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    month: filterMonth,
    year: filterYear,
    targetAmount: '',
    targetItemQty: '',
    targetServiceAmount: '',
    targetAksesorisAmount: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resTarget, resBranch] = await Promise.all([
        apiClient.get('/sales-targets', { params: { month: filterMonth, year: filterYear } }),
        apiClient.get('/branches')
      ]);
      
      if(resTarget.data.success) setTargets(resTarget.data.data);
      if(resBranch.data.success) {
        setBranches(resBranch.data.data);
        if(!formData.branchId && resBranch.data.data.length > 0) {
          setFormData(prev => ({ ...prev, branchId: resBranch.data.data[0].id }));
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil data target');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/sales-targets', formData);
      toast.success('Target penjualan berhasil disetel');
      setShowModal(false);
      setFormData(prev => ({ ...prev, targetAmount: '', targetItemQty: '', targetServiceAmount: '', targetAksesorisAmount: '' }));
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyimpan target');
    } finally {
      setFormLoading(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const calculateOverallProgress = (keyCurrent: string, keyTarget: string) => {
    if(targets.length === 0) return 0;
    const totalTarget = targets.reduce((acc, curr) => acc + (curr[keyTarget] || 0), 0);
    const totalCurrent = targets.reduce((acc, curr) => acc + (curr[keyCurrent] || 0), 0);
    if(totalTarget === 0) return 0;
    return (totalCurrent / totalTarget) * 100;
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header & Filter */}
        <div className="bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Sales Targets</h1>
            <p className="text-muted text-sm">Pantau target omzet bulanan setiap cabang.</p>
          </div>
          
          <div className="flex gap-4">
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>Bulan {i+1}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button 
              onClick={() => {
                setFormData(prev => ({...prev, month: filterMonth, year: filterYear}));
                setShowModal(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Setel Target
            </button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10">
            <h2 className="text-muted font-medium mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400"/> Progress Target Keseluruhan (Bulan {filterMonth} - {filterYear})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Omzet */}
              <div>
                <p className="text-sm text-muted mb-1">Target Omzet Produk</p>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-bold text-white">
                    {calculateOverallProgress('currentSales', 'targetAmount').toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted">
                    {formatRupiah(targets.reduce((acc, curr) => acc + curr.currentSales, 0))} / {formatRupiah(targets.reduce((acc, curr) => acc + curr.targetAmount, 0))}
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-glass-border">
                  <div className={`h-full rounded-full transition-all duration-1000 ${calculateOverallProgress('currentSales', 'targetAmount') >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                    style={{ width: `${Math.min(calculateOverallProgress('currentSales', 'targetAmount'), 100)}%` }}></div>
                </div>
              </div>

              {/* Unit */}
              <div>
                <p className="text-sm text-muted mb-1">Target Item Terjual</p>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-bold text-white">
                    {calculateOverallProgress('currentItemsSold', 'targetItemQty').toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted">
                    {targets.reduce((acc, curr) => acc + curr.currentItemsSold, 0)} / {targets.reduce((acc, curr) => acc + curr.targetItemQty, 0)} Unit
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-glass-border">
                  <div className={`h-full rounded-full transition-all duration-1000 ${calculateOverallProgress('currentItemsSold', 'targetItemQty') >= 100 ? 'bg-green-500' : 'bg-purple-500'}`} 
                    style={{ width: `${Math.min(calculateOverallProgress('currentItemsSold', 'targetItemQty'), 100)}%` }}></div>
                </div>
              </div>

              {/* Service */}
              <div>
                <p className="text-sm text-muted mb-1">Target Omzet Service</p>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-bold text-white">
                    {calculateOverallProgress('currentServiceSales', 'targetServiceAmount').toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted">
                    {formatRupiah(targets.reduce((acc, curr) => acc + curr.currentServiceSales, 0))} / {formatRupiah(targets.reduce((acc, curr) => acc + curr.targetServiceAmount, 0))}
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-glass-border">
                  <div className={`h-full rounded-full transition-all duration-1000 ${calculateOverallProgress('currentServiceSales', 'targetServiceAmount') >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                    style={{ width: `${Math.min(calculateOverallProgress('currentServiceSales', 'targetServiceAmount'), 100)}%` }}></div>
                </div>
              </div>

              {/* Aksesoris */}
              <div>
                <p className="text-sm text-muted mb-1">Target Omzet Aksesoris</p>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-bold text-white">
                    {calculateOverallProgress('currentAksesorisSales', 'targetAksesoris').toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted">
                    {formatRupiah(targets.reduce((acc, curr) => acc + (curr.currentAksesorisSales || 0), 0))} / {formatRupiah(targets.reduce((acc, curr) => acc + (curr.targetAksesoris || 0), 0))}
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-glass-border">
                  <div className={`h-full rounded-full transition-all duration-1000 ${calculateOverallProgress('currentAksesorisSales', 'targetAksesoris') >= 100 ? 'bg-green-500' : 'bg-pink-500'}`} 
                    style={{ width: `${Math.min(calculateOverallProgress('currentAksesorisSales', 'targetAksesoris'), 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branches Grid */}
        <div className="flex-1 overflow-y-auto pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : branches.map(branch => {
              const target = targets.find(t => t.branchId === branch.id) || { targetAmount: 0, targetItemQty: 0, targetServiceAmount: 0, targetAksesoris: 0, currentSales: 0, currentItemsSold: 0, currentServiceSales: 0, currentAksesorisSales: 0, progressPercentage: 0, progressItemsPercentage: 0, progressServicePercentage: 0, progressAksesorisPercentage: 0 };
              const isAchieved = target.progressPercentage >= 100 && target.progressItemsPercentage >= 100 && target.progressServicePercentage >= 100 && (target.targetAksesoris ? target.progressAksesorisPercentage >= 100 : true);
              
              return (
                <div key={branch.id} className="bg-glass-bg border border-glass-border p-6 rounded-3xl hover:bg-nav-hover transition-colors relative group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{branch.name}</h3>
                      <p className="text-xs text-muted">Target Bulan {filterMonth}</p>
                    </div>
                    {isAchieved && target.targetAmount > 0 ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Target className="w-6 h-6 text-blue-500/50" />
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Omzet */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">Omzet Produk</span>
                        <span className="font-medium text-white">{formatRupiah(target.currentSales)} / {formatRupiah(target.targetAmount)}</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-1.5">
                        <div className={`h-full rounded-full ${target.progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(target.progressPercentage, 100)}%` }}></div>
                      </div>
                    </div>

                    {/* Unit */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">Item Terjual</span>
                        <span className="font-medium text-white">{target.currentItemsSold} / {target.targetItemQty} Unit</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-1.5">
                        <div className={`h-full rounded-full ${target.progressItemsPercentage >= 100 ? 'bg-green-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(target.progressItemsPercentage, 100)}%` }}></div>
                      </div>
                    </div>

                    {/* Service */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">Omzet Service</span>
                        <span className="font-medium text-white">{formatRupiah(target.currentServiceSales)} / {formatRupiah(target.targetServiceAmount)}</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-1.5">
                        <div className={`h-full rounded-full ${target.progressServicePercentage >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(target.progressServicePercentage, 100)}%` }}></div>
                      </div>
                    </div>

                    {/* Aksesoris */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">Omzet Aksesoris</span>
                        <span className="font-medium text-white">{formatRupiah(target.currentAksesorisSales)} / {formatRupiah(target.targetAksesoris)}</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-1.5">
                        <div className={`h-full rounded-full ${target.progressAksesorisPercentage >= 100 ? 'bg-green-500' : 'bg-pink-500'}`} style={{ width: `${Math.min(target.progressAksesorisPercentage || 0, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setFormData({ 
                        branchId: branch.id, month: filterMonth, year: filterYear, 
                        targetAmount: target.targetAmount || '',
                        targetItemQty: target.targetItemQty || '',
                        targetServiceAmount: target.targetServiceAmount || '',
                        targetAksesorisAmount: target.targetAksesoris || ''
                      });
                      setShowModal(true);
                    }}
                    className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-2 bg-blue-500/20 text-blue-400 rounded-xl transition-all hover:bg-blue-500 hover:text-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">Setel Target Penjualan</h2>
              <p className="text-sm text-muted mt-1">Bulan {formData.month} Tahun {formData.year}</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Cabang *</label>
                  <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none">
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Target Omzet Produk (Rp) *</label>
                  <input 
                    type="number" 
                    required min="0" 
                    value={formData.targetAmount} 
                    onChange={e => setFormData({...formData, targetAmount: e.target.value})} 
                    placeholder="Misal: 100000000" 
                    className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" 
                  />
                  {formData.targetAmount && (
                    <p className="text-xs text-blue-400 mt-1">Format: {formatRupiah(Number(formData.targetAmount))}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Target Jumlah Item Terjual (Unit) *</label>
                  <input 
                    type="number" 
                    required min="0" 
                    value={formData.targetItemQty} 
                    onChange={e => setFormData({...formData, targetItemQty: e.target.value})} 
                    placeholder="Misal: 50" 
                    className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Target Omzet Service (Rp) *</label>
                  <input 
                    type="number" 
                    required min="0" 
                    value={formData.targetServiceAmount} 
                    onChange={e => setFormData({...formData, targetServiceAmount: e.target.value})} 
                    placeholder="Misal: 15000000" 
                    className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" 
                  />
                  {formData.targetServiceAmount && (
                    <p className="text-xs text-yellow-400 mt-1">Format: {formatRupiah(Number(formData.targetServiceAmount))}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Target Omzet Aksesoris (Rp)</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={formData.targetAksesorisAmount} 
                    onChange={e => setFormData({...formData, targetAksesorisAmount: e.target.value})} 
                    placeholder="Misal: 5000000" 
                    className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" 
                  />
                  {formData.targetAksesorisAmount && (
                    <p className="text-xs text-pink-400 mt-1">Format: {formatRupiah(Number(formData.targetAksesorisAmount))}</p>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 rounded-b-3xl">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">Batal</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
