import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ShieldCheck, ShieldAlert, CheckCircle2,
  XCircle, Clock, Search, RefreshCw, AlertCircle,
  Loader2, Phone, Mail, MapPin, FileText, Ban
} from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface AffiliateOrganization {
  id: string;
  name: string;
  type: string;
  license_number: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

interface AffiliateRecord {
  id: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  organizations?: AffiliateOrganization;
}

export function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<AffiliateRecord[]>('/api/admin/affiliates');
      setAffiliates(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medical affiliates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // Handle Verify / Reject / Suspend
  const handleVerify = async (orgId: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') => {
    setActionLoadingId(orgId);
    setSuccessMessage('');
    setError('');
    try {
      await api.put(`/api/admin/affiliates/${orgId}/verify`, { status });
      setSuccessMessage(`Affiliate status updated to ${status}`);
      await fetchAffiliates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to update affiliate status to ${status}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered List
  const filteredAffiliates = affiliates.filter((a) => {
    const org = a.organizations;
    if (!org) return false;
    if (statusFilter !== 'ALL' && org.verification_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrgName = org.name?.toLowerCase().includes(q);
      const matchLicense = org.license_number?.toLowerCase().includes(q);
      const matchEmail = org.email?.toLowerCase().includes(q);
      const matchDoctor = a.profiles?.full_name?.toLowerCase().includes(q);
      return Boolean(matchOrgName || matchLicense || matchEmail || matchDoctor);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="w-6 h-6 text-action" />
            Medical Affiliate Verification Queue
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Audit organization credentials, verify hospital license numbers, and manage affiliate access
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAffiliates}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface border border-border hover:border-border-strong text-text-primary rounded-[var(--radius-md)] transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh List
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
              placeholder="Search by hospital name, license number, or contact..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
          >
            <option value="ALL">All Verification Statuses ({affiliates.length})</option>
            <option value="PENDING">⏳ Pending Review</option>
            <option value="VERIFIED">✓ Verified</option>
            <option value="REJECTED">✕ Rejected</option>
            <option value="SUSPENDED">⊘ Suspended</option>
          </select>
        </div>
      </div>

      {/* Feedback Alerts */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 p-3 text-sm text-success bg-success-light border border-success/20 rounded-[var(--radius-md)]"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2 p-3 text-sm text-emergency bg-emergency-light border border-emergency/20 rounded-[var(--radius-md)]"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Affiliates Grid / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted space-y-3">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <p className="text-sm font-medium">Scanning affiliate registry...</p>
        </div>
      ) : filteredAffiliates.length === 0 ? (
        <div className="p-12 bg-surface border border-border rounded-[var(--radius-xl)] text-center text-xs text-text-muted">
          No medical affiliates found matching the search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAffiliates.map((aff) => {
            const org = aff.organizations;
            if (!org) return null;
            const isPending = org.verification_status === 'PENDING';
            const isVerified = org.verification_status === 'VERIFIED';

            return (
              <motion.div
                key={aff.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'p-5 bg-surface border rounded-[var(--radius-xl)] shadow-sm flex flex-col justify-between space-y-4 transition-all',
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-100 bg-gradient-to-br from-surface to-amber-50/20'
                    : 'border-border'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {org.name}
                      </h3>
                      <span className="text-xs text-text-muted capitalize">
                        {org.type || 'Emergency Healthcare Facility'}
                      </span>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-0.5 text-xs font-bold rounded-full uppercase',
                        org.verification_status === 'VERIFIED'
                          ? 'badge-verified'
                          : org.verification_status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-red-100 text-red-800'
                      )}
                    >
                      {org.verification_status}
                    </span>
                  </div>

                  {/* Organization Metadata */}
                  <div className="p-3 bg-bg border border-border rounded-[var(--radius-lg)] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Medical License:
                      </span>
                      <span className="font-mono font-bold text-text-primary">
                        {org.license_number || 'N/A'}
                      </span>
                    </div>

                    {aff.profiles?.full_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Representative:</span>
                        <span className="font-semibold text-text-primary">
                          {aff.profiles.full_name}
                        </span>
                      </div>
                    )}

                    {org.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> Official Email:
                        </span>
                        <span className="text-text-primary">{org.email}</span>
                      </div>
                    )}

                    {org.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> Phone:
                        </span>
                        <span className="text-text-primary">{org.phone}</span>
                      </div>
                    )}

                    {org.address && (
                      <div className="flex items-start gap-1 pt-1 text-[11px] text-text-muted">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{org.address}, {org.city || ''} {org.state || ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-end gap-2 flex-wrap">
                  {org.verification_status !== 'VERIFIED' && (
                    <button
                      type="button"
                      onClick={() => handleVerify(org.id, 'VERIFIED')}
                      disabled={actionLoadingId === org.id}
                      className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-success hover:bg-success/90 rounded-[var(--radius-md)] shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Verify
                    </button>
                  )}

                  {org.verification_status !== 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => handleVerify(org.id, 'REJECTED')}
                      disabled={actionLoadingId === org.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emergency bg-emergency-light hover:bg-emergency/15 border border-emergency/20 rounded-[var(--radius-md)] transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}

                  {isVerified && (
                    <button
                      type="button"
                      onClick={() => handleVerify(org.id, 'SUSPENDED')}
                      disabled={actionLoadingId === org.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-text-secondary bg-bg hover:bg-border/50 border border-border rounded-[var(--radius-md)] transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" /> Suspend
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
