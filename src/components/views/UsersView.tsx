import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Shield,
  ShieldCheck,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Car,
  Check,
  X,
  AlertCircle,
  Download,
} from 'lucide-react';
import { User } from '../../types';
import { formatDate } from '../../utils';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    phone_number: '',
    bio: '',
    location: '',
    dream_car: 'Porsche 911 GT3 RS',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    preferred_currency: 'USD',
    unit_system: 'METRIC',
    is_admin: false,
    auth_provider: 'email',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchUsers = async (isRetry = false) => {
    try {
      setLoading(true);
      setLoadError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) {
        if (!isRetry) {
          setTimeout(() => fetchUsers(true), 1200);
          return;
        }
        setLoadError('Database connection warming up. Click to reconnect.');
        return;
      }
      const data = await res.json();
      setUsers(data || []);
    } catch (err: any) {
      if (!isRetry) {
        setTimeout(() => fetchUsers(true), 1200);
      } else {
        setLoadError('Database connection temporarily interrupted. Tap retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleToggleAdmin = async (user: User) => {
    const newAdminStatus = !user.is_admin;
    try {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_admin: newAdminStatus } : u))
      );
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: newAdminStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchUsers();
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ ...user });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        bio: 'AutoVerse driver & collector',
        location: 'Global',
        dream_car: 'Porsche 911 GT3 RS',
        avatar_url:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        preferred_currency: 'USD',
        unit_system: 'METRIC',
        is_admin: false,
        auth_provider: 'email',
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Email address is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update user');
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create user');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user from AutoVerse?')) return;
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            User & Role Administration
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Managing registered drivers, profile credentials, and admin security permissions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/neon_users?format=csv"
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export Users CSV</span>
          </a>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, phone number..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['all', 'admin', 'member'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                roleFilter === r
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              {r === 'all' ? 'All Roles' : `${r}s`}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={() => fetchUsers(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-400 text-neutral-950 font-semibold hover:bg-amber-300 transition-colors whitespace-nowrap"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[11px] font-medium">
              <tr>
                <th className="py-3.5 pl-4 pr-3 min-w-[220px]">Member</th>
                <th className="py-3.5 px-3">Contact</th>
                <th className="py-3.5 px-3">Dream Vehicle</th>
                <th className="py-3.5 px-3">Location & Currency</th>
                <th className="py-3.5 px-3">Role & Permissions</th>
                <th className="py-3.5 px-3">Joined Date</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-6 bg-neutral-800 rounded" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-400">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-800/30 transition-colors">
                    {/* User Identity */}
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.avatar_url ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span className="truncate">{u.name || 'Anonymous Driver'}</span>
                            {u.is_admin && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-[10px] font-mono text-amber-400">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono truncate">
                            {u.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-3">
                      <div className="text-neutral-200 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-neutral-500" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone_number && (
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span className="font-mono">{u.phone_number}</span>
                        </div>
                      )}
                    </td>

                    {/* Dream Car */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <Car className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {u.dream_car || 'Porsche 911 GT3 RS'}
                        </span>
                      </div>
                      {u.bio && (
                        <div className="text-[11px] text-neutral-500 truncate max-w-[180px] mt-0.5">
                          {u.bio}
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3 text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-neutral-500" />
                        <span>{u.location || 'Global'}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        {u.preferred_currency || 'USD'} · {u.unit_system || 'METRIC'}
                      </div>
                    </td>

                    {/* Role & Toggle */}
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => handleToggleAdmin(u)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                          u.is_admin
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        {u.is_admin ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Administrator</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Member Driver</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                      {formatDate(u.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {editingUser ? 'Edit Member Profile' : 'Register New Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Adil Zaman"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="name@autoverse.com"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone_number || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, phone_number: e.target.value }))}
                    placeholder="03345866715"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Dubai / London / Global"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Dream Supercar
                </label>
                <input
                  type="text"
                  value={formData.dream_car || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, dream_car: e.target.value }))}
                  placeholder="Porsche 911 GT3 RS"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={formData.avatar_url || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, avatar_url: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 p-3 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.is_admin)}
                    onChange={(e) => setFormData((p) => ({ ...p, is_admin: e.target.checked }))}
                    className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-white block">
                      Grant Administrator Privileges
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      Allows full read/write access to fleet inventory and database queries
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{editingUser ? 'Save Member' : 'Register User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
