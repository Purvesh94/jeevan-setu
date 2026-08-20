import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Shield, Clock, Search, Filter, RefreshCw,
  User, CheckCircle2, AlertCircle, Activity, Key, Loader2
} from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import type { AuditLog } from '@/types';

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<AuditLog[]>('/api/audit?limit=200');
      setLogs(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Unique actions list for filter
  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set);
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchActor = log.actor_role?.toLowerCase().includes(q);
        const matchResource = log.resource_type?.toLowerCase().includes(q);
        const matchIncident = log.incident_id?.toLowerCase().includes(q);
        return matchAction || matchActor || matchResource || matchIncident;
      }
      return true;
    });
  }, [logs, actionFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-action" />
            Platform Security Audit Trail
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Immutable chronological record of emergency incidents, consent decisions, and cryptographic proofs
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAuditLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface border border-border hover:border-border-strong text-text-primary rounded-[var(--radius-md)] transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh Logs
        </button>
      </div>

      {/* Audit Banner */}
      <div className="p-4 bg-surface border border-border rounded-[var(--radius-xl)] flex items-start gap-3 shadow-sm">
        <Shield className="w-5 h-5 text-action flex-shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary">
          <p className="font-semibold text-text-primary">Append-Only Immutable Ledger</p>
          <p className="mt-0.5">
            Every sensitive action—including incident creation, AI analysis, consent grants, credential verification, and status updates—is permanently recorded with cryptographic actor metadata.
          </p>
        </div>
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
              placeholder="Search by action, role, resource, or incident ID..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="p-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
          >
            <option value="ALL">All Event Types ({logs.length})</option>
            {actionOptions.map((act) => (
              <option key={act} value={act}>
                {act.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-emergency-light border border-emergency/20 text-emergency text-xs rounded-[var(--radius-md)] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAuditLogs} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Audit Log Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted space-y-3">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <p className="text-sm font-medium">Loading audit log entries...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 bg-surface border border-border rounded-[var(--radius-xl)] text-center text-xs text-text-muted">
          No audit entries found matching the filter criteria.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-bg text-text-muted border-b border-border font-semibold">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Event Action</th>
                  <th className="p-3.5">Actor Role</th>
                  <th className="p-3.5">Resource Type</th>
                  <th className="p-3.5">Incident Ref</th>
                  <th className="p-3.5">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg/60 transition-colors">
                    <td className="p-3.5 text-text-muted whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-text-muted" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded-md uppercase whitespace-nowrap',
                          log.action.includes('EMERGENCY')
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : log.action.includes('CONSENT')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : log.action.includes('CREDENTIAL')
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-bg text-text-secondary border border-border'
                        )}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 font-semibold text-text-primary whitespace-nowrap">
                      {log.actor_role || 'SYSTEM'}
                    </td>

                    <td className="p-3.5 text-text-secondary capitalize">
                      {log.resource_type?.replace(/_/g, ' ')}
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-action">
                      {log.incident_id ? log.incident_id.slice(0, 8) : '—'}
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-text-muted max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
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
