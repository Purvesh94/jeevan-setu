import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, CheckCircle2, XCircle, Clock, AlertCircle,
  Loader2, RefreshCw, FileText, Ban, Eye, Calendar, Sparkles
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Consent } from '@/types';

export function ConsentPage() {
  const { profile } = useAuth();

  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Consents
  const fetchConsents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Consent[]>('/api/consent');
      setConsents(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch consent records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  // Respond to Consent (Approve or Deny)
  const handleRespond = async (consentId: string, status: 'APPROVED' | 'DENIED') => {
    setActionLoadingId(consentId);
    setSuccessMessage('');
    setError('');
    try {
      await api.put(`/api/consent/${consentId}/respond`, { status });
      setSuccessMessage(
        status === 'APPROVED'
          ? 'Consent granted for requested medical data (valid 30 mins).'
          : 'Access request was denied.'
      );
      await fetchConsents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${status.toLowerCase()} consent request`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Revoke Approved Consent
  const handleRevoke = async (consentId: string) => {
    setActionLoadingId(consentId);
    setSuccessMessage('');
    setError('');
    try {
      await api.post(`/api/consent/${consentId}/revoke`);
      setSuccessMessage('Medical information access was revoked immediately.');
      await fetchConsents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke consent');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Categorize Consents
  const pendingRequests = consents.filter((c) => c.status === 'PENDING');
  const activeConsents = consents.filter(
    (c) => c.status === 'APPROVED' && (!c.expires_at || new Date(c.expires_at) > new Date())
  );
  const historicalConsents = consents.filter(
    (c) =>
      c.status === 'DENIED' ||
      c.status === 'REVOKED' ||
      (c.status === 'APPROVED' && c.expires_at && new Date(c.expires_at) <= new Date())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Lock className="w-6 h-6 text-action" />
            Consent & Data Sharing Control
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Granular, time-bound consent management for emergency responders and hospitals
          </p>
        </div>
        <button
          type="button"
          onClick={fetchConsents}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface border border-border hover:border-border-strong text-text-primary rounded-[var(--radius-md)] transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh Requests
        </button>
      </div>

      {/* Core Principle Banner */}
      <div className="p-4 bg-action-light border border-action/20 rounded-[var(--radius-xl)] flex items-start gap-3">
        <Shield className="w-5 h-5 text-action flex-shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary space-y-0.5">
          <p className="font-semibold text-text-primary">
            "Share only what is necessary, with the right responder, for the right emergency."
          </p>
          <p>
            No medical records or credentials are shared silently. You have complete control to approve, deny, or revoke access at any time. All granted permissions expire automatically after 30 minutes.
          </p>
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

      {/* ═══ 1. PENDING REQUESTS (TOP PRIORITY) ═══ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-action" />
          Pending Authorization Requests ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] text-center text-xs text-text-muted">
            No pending medical information requests at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((consent) => (
              <motion.div
                key={consent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-surface border-2 border-action/40 ring-1 ring-action/10 rounded-[var(--radius-xl)] shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-action text-white">
                        ACTION REQUIRED
                      </span>
                      <span className="text-xs text-text-muted">
                        Requested {new Date(consent.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-text-primary mt-1">
                      Medical Information Request
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      <span className="font-semibold text-text-primary">Purpose: </span>
                      {consent.purpose || 'Emergency Treatment & Trauma Care'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-text-muted bg-bg px-2.5 py-1.5 rounded-[var(--radius-md)] border border-border self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-action" />
                    <span>Duration: {consent.access_duration_minutes || 30} mins</span>
                  </div>
                </div>

                {/* Requested Fields Checklist */}
                <div className="p-3 bg-bg border border-border rounded-[var(--radius-lg)]">
                  <p className="text-xs font-bold text-text-primary mb-2">
                    Requested Credential Fields:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {consent.requested_fields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-action-light text-action border border-action/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {field.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleRespond(consent.id, 'DENIED')}
                    disabled={actionLoadingId === consent.id}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-text-secondary hover:text-emergency bg-bg border border-border hover:border-emergency/30 rounded-[var(--radius-md)] transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Deny Access
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRespond(consent.id, 'APPROVED')}
                    disabled={actionLoadingId === consent.id}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)] transition-colors shadow-sm"
                  >
                    {actionLoadingId === consent.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Allow Access ({consent.access_duration_minutes || 30}m)
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ 2. ACTIVE GRANTED CONSENTS ═══ */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-success" />
          Active Granted Consents ({activeConsents.length})
        </h2>

        {activeConsents.length === 0 ? (
          <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] text-center text-xs text-text-muted">
            No active granted consents at this moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeConsents.map((consent) => (
              <div
                key={consent.id}
                className="p-5 bg-surface border border-success/30 rounded-[var(--radius-xl)] shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-success-light text-success border border-success/20">
                      ACTIVE ACCESS
                    </span>
                    {consent.expires_at && (
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-action" />
                        Expires: {new Date(consent.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-text-primary mt-2">
                    Purpose: {consent.purpose}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {consent.requested_fields.map((f) => (
                      <span key={f} className="px-2 py-0.5 text-[11px] font-medium bg-bg border border-border rounded text-text-secondary">
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRevoke(consent.id)}
                    disabled={actionLoadingId === consent.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emergency bg-emergency-light hover:bg-emergency/15 border border-emergency/20 rounded-[var(--radius-md)] transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Revoke Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ 3. CONSENT HISTORY ═══ */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-muted" />
          Consent History ({historicalConsents.length})
        </h2>

        {historicalConsents.length === 0 ? (
          <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] text-center text-xs text-text-muted">
            No historical records.
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-[var(--radius-xl)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-bg text-text-muted border-b border-border font-semibold">
                  <tr>
                    <th className="p-3">Status</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Fields</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historicalConsents.map((c) => (
                    <tr key={c.id} className="hover:bg-bg/50">
                      <td className="p-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase',
                            c.status === 'APPROVED'
                              ? 'bg-text-muted/10 text-text-muted'
                              : c.status === 'REVOKED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          )}
                        >
                          {c.status === 'APPROVED' ? 'EXPIRED' : c.status}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-text-primary max-w-xs truncate">
                        {c.purpose || 'Emergency Care'}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {c.requested_fields.join(', ')}
                      </td>
                      <td className="p-3 text-text-muted whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
