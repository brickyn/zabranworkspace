'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Edit, Trash2, Loader2, MapPin } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({ id: '', name: '', brand: '', isWarehouse: false, address: '', phone: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/branches');
      if (res.data.success) {
        setBranches(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddClick = () => {
    setSelectedBranch(null);
    setFormData({ id: '', name: '', brand: '', isWarehouse: false, address: '', phone: '' });
    setFormOpen(true);
  };

  const handleEditClick = (branch: any) => {
    setSelectedBranch(branch);
    setFormData({ id: branch.id, name: branch.name, brand: branch.brand || '', isWarehouse: branch.isWarehouse || false, address: branch.address || '', phone: branch.phone || '' });
    setFormOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await apiClient.delete(`/branches/${id}`);
        toast.success('Branch deleted successfully');
        fetchBranches();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete branch.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (selectedBranch) {
        await apiClient.put(`/branches/${selectedBranch.id}`, formData);
        toast.success('Branch updated successfully');
      } else {
        await apiClient.post('/branches', formData);
        toast.success('Branch created successfully');
      }
      setFormOpen(false);
      fetchBranches();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save branch.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-glass-bg p-6 rounded-3xl border border-glass-border backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Branch Management</h1>
            <p className="text-muted text-sm">Manage store branches and physical locations.</p>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Branch ID</th>
                  <th className="px-6 py-4 font-medium">Store Name</th>
                  <th className="px-6 py-4 font-medium">Brand</th>
                  <th className="px-6 py-4 font-medium text-center">Type</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                      Loading branches...
                    </td>
                  </tr>
                ) : branches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">No branches found</p>
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-nav-hover transition-colors">
                      <td className="px-6 py-4 font-mono text-blue-400 text-xs font-semibold">{branch.id}</td>
                      <td className="px-6 py-4 font-medium text-white">{branch.name}</td>
                      <td className="px-6 py-4">{branch.brand || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        {branch.isWarehouse ? (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs border border-purple-500/20">Warehouse</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/20">Store</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleEditClick(branch)}
                            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(branch.id)}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-glass-border">
              <h2 className="text-xl font-bold text-white">
                {selectedBranch ? 'Edit Branch' : 'Add New Branch'}
              </h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Branch ID *</label>
                    <input required disabled={!!selectedBranch} value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder="e.g. GH-PST" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all disabled:opacity-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Brand</label>
                    <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="e.g. Gadget House" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Store Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Gadget House Pusat" className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-glass-border mt-2">
                  <input type="checkbox" id="isWarehouse" checked={formData.isWarehouse} onChange={e => setFormData({...formData, isWarehouse: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-glass-bg" />
                  <label htmlFor="isWarehouse" className="text-sm text-white">This branch is a Warehouse (Gudang)</label>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Phone</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Address</label>
                  <textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 rounded-b-3xl">
                <button type="button" onClick={() => setFormOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-white hover:bg-white/10 transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
