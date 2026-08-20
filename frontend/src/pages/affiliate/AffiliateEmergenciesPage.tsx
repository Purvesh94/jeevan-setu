import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Activity, Search, Filter, MapPin, Eye,
  Clock, Shield, Lock, CheckCircle2, RefreshCw, Phone,
  FileText, Building2, ChevronRight, X, Loader2, KeyRound
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { EmergencyIncident, EmergencyPriority, EmergencyStatus } from '@/types';

const STATUS_PROGRESSION: EmergencyStatus[] = [
  'NEW',
  'ACCEPTED',
  'IN_TRANSIT',
  'REACHED',
  'TREATMENT_STARTED',
  'CLOSED',
];

export function AffiliateEmergenciesPage() {
  const { profile } = useAuth();

  const [emergencies, setEmergencies] = useState<EmergencyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Incident & Status update modal
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<EmergencyStatus>('ACCEPTED');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');

  // Consent request modal
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [requestedFields, setRequestedFields] = useState<string[]>(['blood_group', 'allergy']);
  const [consentPurpose, setConsentPurpose] = useState('Emergency Trauma Care & Triage');
  const [consentDuration, setConsentDuration] = useState(30);
  const [requestingConsent, setRequestingConsent] = useState(false);
  const [consentSent, setConsentSent] = useState(false);

  // Fetch Emergencies
  const fetchEmergencies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<EmergencyIncident[]>('/api/emergency/active/list');
      setEmergencies(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch emergency incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  // Handle Status Update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setStatusUpdating(true);
    setStatusSuccess('');
    try {
      await api.put(`/api/emergency/${selectedIncident.id}/status`, {
        status: newStatus,
        notes: statusNotes.trim() || null,
      });

      setStatusSuccess(`Incident status updated to ${newStatus}`);
      await fetchEmergencies();
      setSelectedIncident((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update incident status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle Request Consent for Credentials
  const handleRequestConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setRequestingConsent(true);
    try {
      await api.post('/api/consent/request', {
        incident_id: selectedIncident.id,
        user_id: selectedIncident.user_id,
        requested_fields: requestedFields,
        purpose: consentPurpose,
        access_duration_minutes: Number(consentDuration),
      });

      setConsentSent(true);
      setTimeout(() => {
        setShowConsentModal(false);
        setConsentSent(false);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send consent request');
    } finally {
      setRequestingConsent(false);
    }
  };

  // Filtered Emergencies
  const filteredEmergencies = useMemo(() => {
    return emergencies.filter((e) => {
      if (priorityFilter !== 'ALL' && e.priority !== priorityFilter) return false;
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = e.incident_code.toLowerCase().includes(q);
        const matchCategory = e.category.toLowerCase().includes(q);
        const matchAddress = e.address_text?.toLowerCase().includes(q);
        return matchCode || matchCategory || matchAddress;
      }
      return true;
    });
  }, [emergencies, priorityFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-6 h-6 text-action" />
            Active Emergency Incident Queue
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Monitor, triage, update status, and request authorized credentials for assigned incidents
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchEmergencies}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface border border-border hover:border-border-strong text-text-primary rounded-[var(--radius-md)] transition-colors shadow-xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <a
            href="tel:112"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emergency hover:bg-emergency-dark rounded-[var(--radius-md)] transition-colors shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" /> 112 DISPATCH
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, category, or location..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="p-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">🔴 Critical Only</option>
            <option value="HIGH">🟠 High Priority</option>
            <option value="MEDIUM">🟡 Medium Priority</option>
            <option value="LOW">🔵 Low Priority</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
          >
            <option value="ALL">All Active Statuses</option>
            <option value="NEW">NEW</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="IN_TRANSIT">IN TRANSIT</option>
            <option value="REACHED">REACHED</option>
            <option value="TREATMENT_STARTED">TREATMENT STARTED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-emergency-light border border-emergency/20 text-emergency text-xs rounded-[var(--radius-md)] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchEmergencies} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Incidents Table / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted space-y-3">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <p className="text-sm font-medium">Scanning live emergency network...</p>
        </div>
      ) : filteredEmergencies.length === 0 ? (
        <div className="p-12 bg-surface border border-border rounded-[var(--radius-xl)] text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
          <h3 className="text-base font-bold text-text-primary">No Incidents Found</h3>
          <p className="text-xs text-text-secondary">
            There are no matching emergency reports under the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmergencies.map((emergency) => (
            <motion.div
              key={emergency.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'p-5 bg-surface border rounded-[var(--radius-xl)] shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4 cursor-pointer',
                emergency.priority === 'CRITICAL'
                  ? 'border-red-300 ring-1 ring-red-100 bg-gradient-to-br from-surface to-red-50/20'
                  : 'border-border'
              )}
              onClick={() => {
                setSelectedIncident(emergency);
                setNewStatus(emergency.status);
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-text-primary">
                    {emergency.incident_code}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase',
                      emergency.priority === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : emergency.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    )}
                  >
                    {emergency.priority}
                  </span>
                </div>

                <h3 className="text-base font-bold text-text-primary">
                  {emergency.category.replace(/_/g, ' ')}
                </h3>

                <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                  {emergency.description || emergency.transcript || 'No description provided.'}
                </p>

                {emergency.address_text && (
                  <p className="text-[11px] text-text-muted flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{emergency.address_text}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-semibold text-text-secondary bg-bg px-2 py-0.5 rounded border border-border">
                  {emergency.status}
                </span>

                <button
                  type="button"
                  className="text-xs font-semibold text-action hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Manage Incident
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══ INCIDENT DETAIL DRAWER / MODAL ═══ */}
      <AnimatePresence>
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-action">
                      {selectedIncident.incident_code}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emergency text-white">
                      {selectedIncident.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mt-1">
                    {selectedIncident.category.replace(/_/g, ' ')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              {statusSuccess && (
                <div className="p-2.5 bg-success-light border border-success/20 text-success text-xs font-semibold rounded-[var(--radius-md)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {statusSuccess}
                </div>
              )}

              {/* Incident Information */}
              <div className="space-y-3 text-xs">
                {/* AI Summary / Observation */}
                <div className="p-3 bg-action-light/50 border border-action/20 rounded-[var(--radius-lg)]">
                  <p className="font-bold text-action flex items-center gap-1 mb-1">
                    <Activity className="w-3.5 h-3.5" /> AI Observation & Summary
                  </p>
                  <p className="text-text-primary leading-relaxed">
                    {selectedIncident.description || selectedIncident.transcript || 'No detailed description.'}
                  </p>
                  {selectedIncident.translation && (
                    <p className="text-text-muted mt-1 italic">
                      Translation: "{selectedIncident.translation}"
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="p-3 bg-bg border border-border rounded-[var(--radius-lg)] flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-action flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-text-primary">Emergency Location:</span>
                    <p className="text-text-secondary mt-0.5">
                      {selectedIncident.address_text || 'Coordinates available'}
                    </p>
                    {selectedIncident.latitude && selectedIncident.longitude && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIncident.latitude},${selectedIncident.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-action font-semibold hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        Navigate to GPS Coordinates ({selectedIncident.latitude.toFixed(4)}°, {selectedIncident.longitude.toFixed(4)}°)
                      </a>
                    )}
                  </div>
                </div>

                {/* Credential Data Request Card (PRD §24 & §25) */}
                <div className="p-4 bg-surface border border-action/30 rounded-[var(--radius-lg)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-text-primary font-bold">
                      <Lock className="w-4 h-4 text-action" />
                      Medical Credentials & Health Records
                    </div>
                    <p className="text-text-muted mt-0.5">
                      Protected by Zero-Knowledge Consent. Request patient consent to view blood group, allergies, or emergency contacts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConsentModal(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)] whitespace-nowrap shadow-xs"
                  >
                    Request Credentials
                  </button>
                </div>

                {/* Status Progression Machine (PRD §35) */}
                <form onSubmit={handleUpdateStatus} className="p-4 bg-bg border border-border rounded-[var(--radius-lg)] space-y-3">
                  <span className="font-bold text-text-primary flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-action" />
                    Update Incident Status
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as EmergencyStatus)}
                      className="p-2 bg-surface border border-border rounded-[var(--radius-md)] text-xs font-bold"
                    >
                      {STATUS_PROGRESSION.map((st) => (
                        <option key={st} value={st}>
                          {st.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Status notes (e.g. Unit dispatched)"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      className="p-2 bg-surface border border-border rounded-[var(--radius-md)] text-xs"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={statusUpdating}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-navy hover:bg-navy/90 rounded-[var(--radius-md)] shadow-xs"
                    >
                      {statusUpdating ? 'Updating...' : 'Save Status Update'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary bg-bg hover:bg-border/50 rounded-[var(--radius-md)]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ REQUEST CONSENT MODAL ═══ */}
      <AnimatePresence>
        {showConsentModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-action" /> Request Patient Medical Data
                </h3>
                <button
                  type="button"
                  onClick={() => setShowConsentModal(false)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {consentSent ? (
                <div className="p-6 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
                  <p className="text-sm font-bold text-text-primary">Consent Request Sent!</p>
                  <p className="text-xs text-text-muted">
                    The patient receives an instant notification to authorize emergency credential access.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRequestConsent} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-text-primary mb-1">Select Required Fields:</label>
                    <div className="space-y-1.5">
                      {['blood_group', 'allergy', 'emergency_contact', 'identity', 'insurance'].map((f) => (
                        <label key={f} className="flex items-center gap-2 font-medium text-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={requestedFields.includes(f)}
                            onChange={(e) => {
                              if (e.target.checked) setRequestedFields([...requestedFields, f]);
                              else setRequestedFields(requestedFields.filter((x) => x !== f));
                            }}
                            className="rounded border-border text-action focus:ring-action/20"
                          />
                          <span>{f.replace(/_/g, ' ').toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-text-primary mb-1">Emergency Purpose:</label>
                    <input
                      type="text"
                      required
                      value={consentPurpose}
                      onChange={(e) => setConsentPurpose(e.target.value)}
                      className="w-full p-2 bg-bg border border-border rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-text-primary mb-1">Duration (Minutes):</label>
                    <select
                      value={consentDuration}
                      onChange={(e) => setConsentDuration(Number(e.target.value))}
                      className="w-full p-2 bg-bg border border-border rounded text-xs"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowConsentModal(false)}
                      className="px-4 py-2 text-text-secondary bg-bg rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={requestingConsent || requestedFields.length === 0}
                      className="px-5 py-2 text-white bg-action hover:bg-action-dark rounded font-semibold disabled:opacity-50"
                    >
                      {requestingConsent ? 'Sending...' : 'Send Authorization Request'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
