import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ShieldCheck, Clock, MapPin,
  Eye, Phone, ArrowRight, RefreshCw, CheckCircle2,
  Building2, Users, FileText, ChevronRight, Loader2
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { EmergencyIncident, Hospital } from '@/types';

export function AffiliateDashboard() {
  const { profile } = useAuth();

  const [emergencies, setEmergencies] = useState<EmergencyIncident[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [emergencyData, hospitalData] = await Promise.all([
        api.get<EmergencyIncident[]>('/api/emergency/active/list'),
        api.get<Hospital[]>('/api/hospitals').catch(() => []),
      ]);

      setEmergencies(emergencyData || []);
      setHospitals(hospitalData || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medical response center data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived stats
  const stats = useMemo(() => {
    const critical = emergencies.filter((e) => e.priority === 'CRITICAL').length;
    const high = emergencies.filter((e) => e.priority === 'HIGH').length;
    const active = emergencies.filter((e) =>
      ['NEW', 'ACCEPTED', 'IN_TRANSIT', 'REACHED', 'TREATMENT_STARTED'].includes(e.status)
    ).length;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const today = emergencies.filter((e) => new Date(e.created_at) >= startOfDay).length;

    return { critical, high, active, today };
  }, [emergencies]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-navy text-white">
              Medical Affiliate
            </span>
            <span className="text-xs text-text-muted">Command & Dispatch</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mt-1">
            Medical Response Center
          </h1>
          <p className="text-sm text-text-secondary">
            Live incident triage, decentralized credential verification, and hospital coordination
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface border border-border hover:border-border-strong text-text-primary rounded-[var(--radius-md)] transition-colors shadow-xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh Feed
          </button>
          <a
            href="tel:112"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emergency hover:bg-emergency-dark rounded-[var(--radius-md)] transition-colors shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" /> 112 DISPATCH
          </a>
        </div>
      </div>

      {/* Top Triage Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Incidents */}
        <div className="p-5 bg-surface border border-red-200 rounded-[var(--radius-xl)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical Priority</p>
            <p className="text-3xl font-extrabold text-red-700 mt-1">{stats.critical}</p>
            <span className="text-[11px] text-text-muted">Requires immediate ER dispatch</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* High Priority */}
        <div className="p-5 bg-surface border border-amber-200 rounded-[var(--radius-xl)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">High Priority</p>
            <p className="text-3xl font-extrabold text-amber-700 mt-1">{stats.high}</p>
            <span className="text-[11px] text-text-muted">Trauma & urgent cases</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Total Active */}
        <div className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-action uppercase tracking-wider">Active Incidents</p>
            <p className="text-3xl font-extrabold text-text-primary mt-1">{stats.active}</p>
            <span className="text-[11px] text-text-muted">In transit or treatment</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-action-light flex items-center justify-center text-action">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Reported Today */}
        <div className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Today's Inflow</p>
            <p className="text-3xl font-extrabold text-text-primary mt-1">{stats.today}</p>
            <span className="text-[11px] text-text-muted">Since midnight</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-text-secondary">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-emergency-light border border-emergency/20 text-emergency text-xs rounded-[var(--radius-md)] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Main Grid: Active Incidents & Rapid Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Emergency Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-action" />
              Active Emergency Triage Queue
            </h2>
            <Link
              to="/affiliate/emergencies"
              className="text-xs font-semibold text-action hover:underline flex items-center gap-1"
            >
              View Full List <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 bg-surface border border-border rounded-[var(--radius-xl)] text-center text-xs text-text-muted flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-action" />
              Loading active emergencies...
            </div>
          ) : emergencies.length === 0 ? (
            <div className="p-10 bg-surface border border-border rounded-[var(--radius-xl)] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
              <h3 className="text-sm font-bold text-text-primary">No Active Emergencies</h3>
              <p className="text-xs text-text-secondary">All reported incidents have been resolved or closed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emergencies.slice(0, 5).map((emergency) => (
                <div
                  key={emergency.id}
                  className={cn(
                    'p-4 bg-surface border rounded-[var(--radius-xl)] transition-all hover:shadow-card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                    emergency.priority === 'CRITICAL'
                      ? 'border-red-300 ring-1 ring-red-100 bg-gradient-to-r from-surface to-red-50/20'
                      : 'border-border'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-bg border border-border rounded text-text-secondary">
                        {emergency.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-text-primary">
                      {emergency.category.replace(/_/g, ' ')}
                    </h3>

                    <p className="text-xs text-text-secondary line-clamp-1">
                      {emergency.description || emergency.transcript || 'No emergency description provided.'}
                    </p>

                    {emergency.address_text && (
                      <p className="text-[11px] text-text-muted flex items-center gap-1 pt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-sm">{emergency.address_text}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                    <span className="text-[11px] text-text-muted">
                      {new Date(emergency.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Link
                      to={`/emergency/${emergency.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)] transition-colors shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Respond
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tools & Hospital Registry Overview */}
        <div className="space-y-5">
          {/* Quick Access Tools */}
          <div className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-text-primary">Affiliate Action Center</h3>
            <div className="space-y-2">
              <Link
                to="/affiliate/verification"
                className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-bg hover:bg-action-light/50 border border-border transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-action" />
                  <div>
                    <p className="text-xs font-bold text-text-primary group-hover:text-action">Verify Credential</p>
                    <p className="text-[11px] text-text-muted">Validate QR proofs and DID signatures</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </Link>

              <Link
                to="/map"
                className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-bg hover:bg-action-light/50 border border-border transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-action" />
                  <div>
                    <p className="text-xs font-bold text-text-primary group-hover:text-action">Live Emergency Map</p>
                    <p className="text-[11px] text-text-muted">GIS view of incidents & beds</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </Link>

              <Link
                to="/affiliate/audit"
                className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-bg hover:bg-action-light/50 border border-border transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-action" />
                  <div>
                    <p className="text-xs font-bold text-text-primary group-hover:text-action">Audit Trail Logs</p>
                    <p className="text-[11px] text-text-muted">Immutable data access history</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </Link>
            </div>
          </div>

          {/* Hospital Readiness Snapshot */}
          <div className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-action" /> Partner Hospitals
              </h3>
              <span className="text-xs text-text-muted">{hospitals.length} active</span>
            </div>

            <div className="space-y-2">
              {hospitals.slice(0, 3).map((h) => (
                <div key={h.id} className="p-2.5 bg-bg rounded-[var(--radius-md)] border border-border text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary truncate max-w-[170px]">{h.name}</span>
                    <span className="text-[10px] font-semibold text-success">24x7 Ready</span>
                  </div>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">{h.address}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
