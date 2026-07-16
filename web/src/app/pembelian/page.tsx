'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, CheckCircle2, Loader2, PackageOpen, Truck, PlusCircle, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function PembelianPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // New PO State
  const [poData, setPoData] = useState({ supplierId: '', branchId: '' });
  const [poItems, setPoItems] = useState<any[]>([]);

  // New Supplier State
  const [supplierData, setSupplierData] = useState({ name: '', contact: '', address: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPO, resSuppliers, resBranches] = await Promise.all([
        apiClient.get('/purchases?branchId=all'),
        apiClient.get('/purchases/suppliers'),
        apiClient.get('/branches')
      ]);
      if (resPO.data.success) setPurchases(resPO.data.data);
      if (resSuppliers.data.success) setSuppliers(resSuppliers.data.data);
      if (resBranches.data.success) setBranches(resBranches.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/purchases/suppliers', supplierData);
      toast.success('Supplier added successfully');
      setShowSupplierModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add supplier');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddPoItem = () => {
    setPoItems([...poItems, { name: '', category: 'Laptop', brand: '', buyPrice: 0, sellPrice: 0, quantity: 1 }]);
  };

  const handlePoItemChange = (index: number, field: string, value: any) => {
    const newItems = [...poItems];
    newItems[index][field] = value;
    setPoItems(newItems);
  };

  const handleRemovePoItem = (index: number) => {
    const newItems = [...poItems];
    newItems.splice(index, 1);
    setPoItems(newItems);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    setFormLoading(true);
    try {
      await apiClient.post('/purchases', { ...poData, items: poItems });
      toast.success('Purchase Order created successfully');
      setShowPOModal(false);
      setPoItems([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create PO');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCompletePO = async (id: string) => {
    if (!window.confirm('Are you sure you want to receive these items into inventory?')) return;
    try {
      const res = await apiClient.patch(`/purchases/${id}/complete`);
      toast.success(res.data.message || 'PO completed');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete PO');
    }
  };

  const handleCancelPO = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this PO?')) return;
    try {
      await apiClient.patch(`/purchases/${id}/cancel`); // Asumsi endpoint ini akan kita buat
      toast.success('PO cancelled');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel PO');
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Purchasing & Restock</h1>
            <p className="text-muted text-sm">Manage suppliers, purchase orders, and receive new stock.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => { setSupplierData({name: '', contact: '', address: ''}); setShowSupplierModal(true); }}
              className="px-4 py-2.5 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Add Supplier
            </button>
            <button 
              onClick={() => { 
                setPoData({ supplierId: suppliers[0]?.id || '', branchId: branches[0]?.id || '' }); 
                setPoItems([]);
                setShowPOModal(true); 
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create PO
            </button>
          </div>
        </div>

        {/* PO Table */}
        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">PO Number</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Supplier</th>
                  <th className="px-6 py-4 font-medium">Target Branch</th>
                  <th className="px-6 py-4 font-medium">Items</th>
                  <th className="px-6 py-4 font-medium">Total Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                      Loading orders...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                      <PackageOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">No Purchase Orders found</p>
                    </td>
                  </tr>
                ) : (
                  purchases.map((po) => (
                    <tr key={po.id} className="hover:bg-nav-hover transition-colors">
                      <td className="px-6 py-4 font-mono text-muted text-xs">{po.id}</td>
                      <td className="px-6 py-4">{new Date(po.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{po.supplier?.name}</td>
                      <td className="px-6 py-4">{po.branch?.name}</td>
                      <td className="px-6 py-4">{po.items?.length || 0} items</td>
                      <td className="px-6 py-4 font-bold text-green-400">{formatRupiah(po.totalAmount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${po.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                          {po.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          {po.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleCompletePO(po.id)}
                                className="px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-green-500/30"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Terima
                              </button>
                              <button 
                                onClick={() => handleCancelPO(po.id)}
                                className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-red-500/30"
                              >
                                Cancel
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

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#0B0C10] border border-glass-border rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-foreground">Add New Supplier</h2>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Supplier Name *</label>
                  <input required value={supplierData.name} onChange={e => setSupplierData({...supplierData, name: e.target.value})} className="w-full px-4 py-2 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted">Contact Number</label>
                  <input value={supplierData.contact} onChange={e => setSupplierData({...supplierData, contact: e.target.value})} className="w-full px-4 py-2 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none" />
                </div>
              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 rounded-b-3xl">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="px-4 py-2 rounded-xl text-muted hover:text-foreground hover:bg-nav-hover transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#0B0C10] border border-glass-border rounded-3xl w-full max-w-4xl shadow-2xl">
            <div className="p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-foreground">Create Purchase Order</h2>
            </div>
            <form onSubmit={handleCreatePO}>
              <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Supplier *</label>
                    <select required value={poData.supplierId} onChange={e => setPoData({...poData, supplierId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none appearance-none">
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted">Target Branch (To Stock Into) *</label>
                    <select required value={poData.branchId} onChange={e => setPoData({...poData, branchId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground outline-none appearance-none">
                      <option value="">-- Select Branch --</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="border border-glass-border rounded-2xl p-4 bg-black/20">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-foreground">Order Items</h3>
                    <button type="button" onClick={handleAddPoItem} className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1 border border-blue-500/30">
                      <PlusCircle className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>

                  {poItems.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">No items added yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {poItems.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start p-3 border border-glass-border bg-glass-bg rounded-xl">
                          <div className="flex-1 space-y-3">
                            <input required placeholder="Product Name (e.g. Asus ROG Strix)" value={item.name} onChange={e => handlePoItemChange(index, 'name', e.target.value)} className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-foreground outline-none text-sm" />
                            <div className="grid grid-cols-4 gap-3">
                              <select value={item.category} onChange={e => handlePoItemChange(index, 'category', e.target.value)} className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-foreground outline-none text-sm">
                                <option value="Laptop">Laptop</option>
                                <option value="Aksesoris">Aksesoris</option>
                                <option value="Sparepart">Sparepart</option>
                              </select>
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase">Quantity (Unit)</label>
                                <input type="number" required min="1" value={item.quantity} onChange={e => handlePoItemChange(index, 'quantity', parseInt(e.target.value))} className="w-full px-3 py-1.5 bg-glass-bg border border-glass-border rounded-lg text-foreground outline-none text-sm" />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase">Buy Price (HPP)</label>
                                <input type="number" required min="0" value={item.buyPrice} onChange={e => handlePoItemChange(index, 'buyPrice', parseFloat(e.target.value))} className="w-full px-3 py-1.5 bg-glass-bg border border-glass-border rounded-lg text-foreground outline-none text-sm" />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase">Target Sell Price</label>
                                <input type="number" required min="0" value={item.sellPrice} onChange={e => handlePoItemChange(index, 'sellPrice', parseFloat(e.target.value))} className="w-full px-3 py-1.5 bg-glass-bg border border-glass-border rounded-lg text-foreground outline-none text-sm" />
                              </div>
                            </div>
                          </div>
                          <button type="button" onClick={() => handleRemovePoItem(index)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg mt-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-between items-center rounded-b-3xl">
                <div className="text-foreground font-bold">
                  Total: <span className="text-green-400">{formatRupiah(poItems.reduce((acc, item) => acc + (item.buyPrice * item.quantity), 0))}</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPOModal(false)} className="px-6 py-2.5 rounded-xl font-medium text-muted hover:text-foreground hover:bg-nav-hover transition-colors">Cancel</button>
                  <button type="submit" disabled={formLoading || poItems.length === 0} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Save Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
