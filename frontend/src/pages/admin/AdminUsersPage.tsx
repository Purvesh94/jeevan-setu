import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, Filter, Shield, Mail, Phone, Globe,
  Clock, RefreshCw, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import type { Profile, UserRole } from '@/types';

export function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Profile[]>('/api/admin/users');
      setUsers(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.full_name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchPhone = u.phone?.toLowerCase().includes(q);
        const matchDid = u.did_identifier?.toLowerCase().includes(q);
        return Boolean(matchName || matchEmail || matchPhone || matchDid);
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-action" />
            User Directory Management
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Overview of registered citizen users, medical affiliates, and system administrators
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface border border-border hover:border-border-strong text-text-primary rounded-[var(--radius-md)] transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh Users
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, or DID..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="USER">Citizen Users</option>
            <option value="MEDICAL_AFFILIATE">Medical Affiliates</option>
            <option value="ADMIN">Administrators</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-emergency-light border border-emergency/20 text-emergency text-xs rounded-[var(--radius-md)] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted space-y-3">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <p className="text-sm font-medium">Loading user profiles...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 bg-surface border border-border rounded-[var(--radius-xl)] text-center text-xs text-text-muted">
          No users found matching the search criteria.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-bg text-text-muted border-b border-border font-semibold">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Platform Role</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Preferred Language</th>
                  <th className="p-3.5">Decentralized ID (DID)</th>
                  <th className="p-3.5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-bg/60 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                            user.role === 'ADMIN'
                              ? 'bg-navy'
                              : user.role === 'MEDICAL_AFFILIATE'
                              ? 'bg-action'
                              : 'bg-action-dark'
                          )}
                        >
                          {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">
                            {user.full_name || 'Unnamed User'}
                          </p>
                          <p className="text-[11px] text-text-muted">{user.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase',
                          user.role === 'ADMIN'
                            ? 'bg-navy text-white'
                            : user.role === 'MEDICAL_AFFILIATE'
                            ? 'bg-action text-white'
                            : 'bg-action-light text-action border border-action/20'
                        )}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="p-3.5 text-text-secondary">
                      {user.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-text-muted" /> {user.phone}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>

                    <td className="p-3.5 text-text-secondary uppercase">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-text-muted" />
                        {user.preferred_language || 'en'}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-text-muted max-w-xs truncate" title={user.did_identifier || ''}>
                      {user.did_identifier || `did:jeevansetu:user:${user.id.slice(0, 8)}`}
                    </td>

                    <td className="p-3.5 text-text-muted whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
