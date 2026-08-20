import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Building2, AlertTriangle, Activity,
  Clock, ArrowRight, RefreshCw, CheckCircle2, AlertCircle,
  FileText, ShieldCheck, ChevronRight, Loader2
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AdminStats {
  total_users: number;
  total_emergencies: number;
  active_emergencies: number;
  total_affiliates: number;
  pending_affiliates: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<AdminStats>('/api/admin/stats');
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-navy text-white">
              System Administration
            </span>
            <span className="text-xs text-text-muted">Platform Oversight & Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mt-1">
            Admin Control Center
          </h1>
          <p className="text-sm text-text-secondary">
            Manage user directories, approve medical affiliate credentials, and review platform-wide emergency telemetry
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface border border-border hover:border-border-strong text-text-primary rounded-[var(--radius-md)] transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh Stats
        </button>
      </div>

      {/* Demo Mode Environment Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-[var(--radius-xl)] flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <p className="font-bold">DEMO ENVIRONMENT ACTIVE — DELHI NCR PILOT</p>
          <p className="mt-0.5">
            This platform operates in Hackathon Demonstration Mode with seeded Delhi NCR trauma hospitals and simulated responders. To reset demo state, re-execute the database seed scripts.
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-emergency-light border border-emergency/20 text-emergency text-xs rounded-[var(--radius-md)] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAdminStats} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Statistics Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-action" />
          <span className="text-xs font-medium">Aggregating system statistics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Registered Users */}
          <Link
            to="/admin/users"
            className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm hover:shadow-card-hover transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider group-hover:text-action transition-colors">
                Total Users
              </p>
              <p className="text-3xl font-extrabold text-text-primary mt-1">
                {stats?.total_users ?? 0}
              </p>
              <span className="text-[11px] text-text-muted">Citizens & Affiliates</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-action-light flex items-center justify-center text-action">
              <Users className="w-6 h-6" />
            </div>
          </Link>

          {/* Pending Affiliates */}
          <Link
            to="/admin/affiliates"
            className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm hover:shadow-card-hover transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider group-hover:underline">
                Pending Affiliates
              </p>
              <p className="text-3xl font-extrabold text-amber-700 mt-1">
                {stats?.pending_affiliates ?? 0}
              </p>
              <span className="text-[11px] text-text-muted">Requires verification</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </Link>

          {/* Active Emergencies */}
          <Link
            to="/affiliate/emergencies"
            className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm hover:shadow-card-hover transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider group-hover:underline">
                Active Emergencies
              </p>
              <p className="text-3xl font-extrabold text-red-700 mt-1">
                {stats?.active_emergencies ?? 0}
              </p>
              <span className="text-[11px] text-text-muted">In transit or treatment</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <Activity className="w-6 h-6" />
            </div>
          </Link>

          {/* Total Emergencies */}
          <div className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Total Lifetime SOS
              </p>
              <p className="text-3xl font-extrabold text-text-primary mt-1">
                {stats?.total_emergencies ?? 0}
              </p>
              <span className="text-[11px] text-text-muted">Reported incidents</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-text-secondary">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Admin Modules Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        {/* User Directory */}
        <Link
          to="/admin/users"
          className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm hover:shadow-card-hover transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-action-light flex items-center justify-center text-action">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-primary group-hover:text-action transition-colors">
            User Directory Management
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Inspect citizen user profiles, role assignments (User, Medical Affiliate, Admin), preferred languages, and DID identifiers.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-action">
            Manage Users <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* Affiliate Verification */}
        <Link
          to="/admin/affiliates"
          className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm hover:shadow-card-hover transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-primary group-hover:text-amber-600 transition-colors">
            Affiliate Verification Queue
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Review hospital and clinic medical affiliate applications, verify license numbers, and approve or suspend operational credentials.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
            Verify Affiliates <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* Hospital Registry */}
        <Link
          to="/admin/hospitals"
          className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm hover:shadow-card-hover transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-primary group-hover:text-emerald-600 transition-colors">
            Hospital Infrastructure Registry
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Manage partner hospital capabilities (trauma, cardiology, maternity, burns, 24/7 readiness), coordinates, and verified statuses.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            View Hospitals <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
