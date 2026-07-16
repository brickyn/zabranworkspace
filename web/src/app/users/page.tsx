'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Plus, Edit, Trash2, Loader2, Users } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    role: 'User', 
    jobTitle: '',
    division: '',
    permissions: [] as string[],
    branchId: '' 
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resUsers, resBranches] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/branches')
      ]);
      if (resUsers.data.success) setUsers(resUsers.data.data);
      if (resBranches.data.success) setBranches(resBranches.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClick = () => {
    setSelectedUser(null);
    setFormData({ email: '', password: '', name: '', role: 'User', jobTitle: '', division: '', permissions: [], branchId: branches[0]?.id || '' });
    setFormOpen(true);
  };

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setFormData({ 
      email: user.email, 
      password: '', // blank password when editing
      name: user.name, 
      role: user.role, 
      jobTitle: user.jobTitle || '',
      division: user.division || '',
      permissions: user.permissions ? (Array.isArray(user.permissions) ? user.permissions : JSON.parse(user.permissions)) : [],
      branchId: user.branchId || '' 
    });
    setFormOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiClient.delete(`/users/${id}`);
        toast.success('User deleted successfully');
        fetchData();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete user.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = { ...formData };
      if (selectedUser && !payload.password) {
        delete (payload as any).password;
      }
      
      if (selectedUser) {
        await apiClient.put(`/users/${selectedUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        await apiClient.post('/users', payload);
        toast.success('User created successfully');
      }
      setFormOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save user.');
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
            <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
            <p className="text-muted text-sm">Manage staff accounts, roles, and branch assignments.</p>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 bg-glass-bg border border-glass-border rounded-3xl backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-muted uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-4 font-medium">ID / NIP</th>
                  <th className="px-6 py-4 font-medium">Name & Divisi</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Access Level</th>
                  <th className="px-6 py-4 font-medium">Branch</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">No users found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-nav-hover transition-colors">
                      <td className="px-6 py-4 font-mono text-muted text-xs">{user.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-muted">{user.jobTitle} • {user.division}</div>
                      </td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${user.role === 'Super Admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted">{user.branch?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(user.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-glass-bg border border-glass-border rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-glass-border shrink-0">
              <h2 className="text-xl font-bold text-white">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Full Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Email Address *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted ml-1">Password {selectedUser && '(Leave blank to keep current)'}</label>
                  <input type="password" required={!selectedUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Access Level (Role)</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all appearance-none">
                      {['Super Admin', 'Management', 'Admin', 'Manager', 'User'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Branch</label>
                    <select value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all appearance-none">
                      <option value="">-- No Branch (Pusat) --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Division</label>
                    <select value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all appearance-none">
                      <option value="">-- Select Division --</option>
                      {['Management', 'Marketing Pusat', 'Finance', 'HC/GA', 'BSB', 'B2B', 'CRM', 'Marketing Communication', 'Toko/Cabang'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted ml-1">Job Title</label>
                    <input type="text" placeholder="e.g. Finance Staff" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full px-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-foreground focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-glass-border">
                  <label className="text-sm text-muted ml-1">Module Permissions (Custom Access)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Dashboard', 'CRM', 'B2B', 'BSB', 'POS', 'Laporan', 'Inventory', 'Master Data', 'Users', 'Promos'].map(perm => (
                      <label key={perm} className="flex items-center gap-2 text-sm text-muted bg-glass-bg/50 p-2 rounded-lg cursor-pointer border border-glass-border hover:border-white/20 transition-all">
                        <input 
                          type="checkbox" 
                          className="rounded bg-black border-gray-600 text-blue-500 shrink-0"
                          checked={formData.permissions.includes(perm)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData({ ...formData, permissions: [...formData.permissions, perm] });
                            } else {
                              setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) });
                            }
                          }}
                        />
                        <span className="truncate">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-glass-border bg-black/20 flex justify-end gap-3 shrink-0 rounded-b-3xl">
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
