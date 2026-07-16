'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Trash2, Loader2, Shield, Calendar, UserCheck } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function DelegationsPage() {
  const [delegations, setDelegations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ 
    toUserId: '', 
    roleId: '', 
    validUntil: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resDel, resUsers, resRoles] = await Promise.all([
        apiClient.get('/delegations'),
        apiClient.get('/users'),
        apiClient.get('/users/roles')
      ]);
      if (resDel.data.success) setDelegations(resDel.data.data);
      if (resUsers.data.success) setUsers(resUsers.data.data);
      if (resRoles.data.success) setRoles(resRoles.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load delegations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClick = () => {
    setFormData({ toUserId: '', roleId: '', validUntil: '' });
    setFormOpen(true);
  };

  const handleRevokeClick = async (id: string) => {
    if (window.confirm('Are you sure you want to revoke this delegation early?')) {
      try {
        await apiClient.patch(`/delegations/${id}/revoke`);
        toast.success('Delegation revoked successfully');
        fetchData();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to revoke delegation.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await apiClient.post('/delegations', formData);
      toast.success('Delegation created successfully');
      setFormOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create delegation');
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
            <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-400" /> Role Delegations
            </h1>
            <p className="text-muted text-sm">Temporarily assign roles and permissions to other users.</p>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Delegation
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-glass-bg rounded-3xl border border-glass-border backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border bg-black/20">
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Delegated To</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Role Assigned</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Delegated By</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Valid Until</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                    </td>
                  </tr>
                ) : delegations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">No active delegations found</p>
                    </td>
                  </tr>
                ) : (
                  delegations.map((del) => {
                    const isExpired = new Date(del.validUntil) < new Date();
                    const status = !del.isActive ? 'Revoked' : isExpired ? 'Expired' : 'Active';
                    const statusColor = status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                        status === 'Revoked' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        'bg-gray-500/20 text-gray-400 border-gray-500/30';
                    return (
                      <tr key={del.id} className="hover:bg-nav-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-indigo-400" />
                            {del.toUser?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                            {del.role?.name || 'Unknown Role'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted">{del.fromUser?.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {new Date(del.validUntil).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-2">
                            {del.isActive && !isExpired && (
                              <button 
                                onClick={() => handleRevokeClick(del.id)}
                                title="Revoke Delegation"
                                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

      {/* Modal Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-glass-border shrink-0">
              <h2 className="text-xl font-bold text-white">Create Delegation</h2>
              <p className="text-sm text-muted mt-1">Assign a temporary role to a user.</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Delegate To *</label>
                  <select 
                    required 
                    value={formData.toUserId} 
                    onChange={e => setFormData({...formData, toUserId: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="">-- Select User --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Role to Assign *</label>
                  <select 
                    required 
                    value={formData.roleId} 
                    onChange={e => setFormData({...formData, roleId: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="">-- Select Role --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Valid Until *</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={formData.validUntil} 
                    onChange={e => setFormData({...formData, validUntil: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-indigo-500 outline-none transition-all" 
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-glass-border flex justify-end gap-3 bg-black/20">
                <button 
                  type="button" 
                  onClick={() => setFormOpen(false)}
                  className="px-5 py-2.5 text-muted hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 transition-all font-medium"
                >
                  {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Create Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
