import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Search, Filter, Phone, MapPin,
  CheckCircle2, Shield, AlertTriangle, RefreshCw, X,
  Loader2, Activity, Flame, Baby, ExternalLink, AlertCircle
} from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import type { Hospital } from '@/types';

export function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Add Hospital Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState<number | string>(28.5672);
  const [longitude, setLongitude] = useState<number | string>(77.2100);
  const [open24x7, setOpen24x7] = useState(true);
  const [verified, setVerified] = useState(true);
  const [emergencyAvailable, setEmergencyAvailable] = useState(true);
  const [traumaAvailable, setTraumaAvailable] = useState(false);
  const [cardiologyAvailable, setCardiologyAvailable] = useState(false);
  const [maternityAvailable, setMaternityAvailable] = useState(false);
  const [pediatricAvailable, setPediatricAvailable] = useState(false);
  const [burnsAvailable, setBurnsAvailable] = useState(false);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Hospital[]>('/api/hospitals');
      setHospitals(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hospital records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // Create Hospital Submit
  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setModalError('');
    setSuccessMessage('');

    try {
      await api.post('/api/hospitals', {
        name: name.trim(),
        address: address.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        phone: phone.trim() || null,
        emergency_available: emergencyAvailable,
        trauma_available: traumaAvailable,
        cardiology_available: cardiologyAvailable,
        maternity_available: maternityAvailable,
        pediatric_available: pediatricAvailable,
        burns_available: burnsAvailable,
        open_24x7: open24x7,
        verified: verified,
      });

      setSuccessMessage('Hospital registered successfully.');
      setShowAddModal(false);
      // Reset form
      setName('');
      setAddress('');
      setPhone('');
      await fetchHospitals();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to register hospital');
    } finally {
      setCreating(false);
    }
  };

  // Filtered List
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      if (verifiedOnly && !h.verified) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = h.name?.toLowerCase().includes(q);
        const matchAddr = h.address?.toLowerCase().includes(q);
        return matchName || matchAddr;
      }
      return true;
    });
  }, [hospitals, verifiedOnly, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="w-6 h-6 text-action" />
            Hospital Infrastructure Registry
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage partner hospitals, verified trauma capabilities, and GIS coordinates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchHospitals}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface border border-border hover:border-border-strong text-text-primary rounded-[var(--radius-md)] transition-colors shadow-xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setModalError('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Hospital
          </button>
        </div>
      </div>

      {/* Demo Disclaimer */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] text-amber-900 text-xs font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>DEMO DATA — NOT LIVE HOSPITAL AVAILABILITY. Verified partner dataset for Delhi NCR pilot.</span>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hospital name or location..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={cn(
              'flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] border transition-all whitespace-nowrap',
              verifiedOnly
                ? 'bg-success-light text-success border-success/30'
                : 'bg-bg text-text-secondary border-border hover:text-text-primary'
            )}
          >
            <Shield className="w-3.5 h-3.5" /> Verified Only
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {successMessage && (
        <div className="p-3 bg-success-light border border-success/20 text-success text-xs font-semibold rounded-[var(--radius-md)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMessage}
        </div>
      )}
      {error && (
        <div className="p-3 bg-emergency-light border border-emergency/20 text-emergency text-xs rounded-[var(--radius-md)] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchHospitals} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Hospital Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted space-y-3">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <p className="text-sm font-medium">Scanning hospital registry...</p>
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="p-12 bg-surface border border-border rounded-[var(--radius-xl)] text-center text-xs text-text-muted">
          No hospital records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHospitals.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm flex flex-col justify-between space-y-4 hover:shadow-card-hover transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {h.verified && (
                      <span className="badge-verified px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-bold rounded-full',
                        h.open_24x7
                          ? 'bg-success-light text-success'
                          : 'bg-bg text-text-secondary border border-border'
                      )}
                    >
                      {h.open_24x7 ? 'Open 24/7' : 'Standard'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-text-muted">
                    {h.latitude.toFixed(2)}°, {h.longitude.toFixed(2)}°
                  </span>
                </div>

                <h3 className="text-base font-bold text-text-primary leading-tight">
                  {h.name}
                </h3>
                <p className="text-xs text-text-secondary flex items-start gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                  <span>{h.address}</span>
                </p>

                {/* Capabilities */}
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1">
                  {h.emergency_available && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded">
                      Emergency
                    </span>
                  )}
                  {h.trauma_available && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded">
                      Trauma
                    </span>
                  )}
                  {h.cardiology_available && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded">
                      Cardiology
                    </span>
                  )}
                  {h.maternity_available && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-pink-50 text-pink-700 rounded">
                      Maternity
                    </span>
                  )}
                  {h.pediatric_available && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-cyan-50 text-cyan-700 rounded">
                      Pediatrics
                    </span>
                  )}
                  {h.burns_available && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-50 text-orange-700 rounded">
                      Burns
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center gap-2">
                {h.phone && (
                  <a
                    href={`tel:${h.phone}`}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-semibold text-text-primary bg-bg border border-border hover:border-border-strong rounded-[var(--radius-md)] transition-colors"
                  >
                    <Phone className="w-3 h-3 text-action" /> {h.phone}
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)] transition-colors shadow-xs"
                >
                  <MapPin className="w-3 h-3" /> Map Directions
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══ ADD HOSPITAL MODAL ═══ */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Plus className="w-5 h-5 text-action" /> Add Hospital to Registry
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-emergency-light border border-emergency/20 text-emergency text-xs rounded-[var(--radius-md)] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateHospital} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-text-primary mb-1">Hospital Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AIIMS Trauma Center"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-bg border border-border rounded-[var(--radius-md)] text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text-primary mb-1">Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Street, City, State"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 bg-bg border border-border rounded-[var(--radius-md)] text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-text-primary mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full p-2.5 bg-bg border border-border rounded-[var(--radius-md)] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-text-primary mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full p-2.5 bg-bg border border-border rounded-[var(--radius-md)] text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-text-primary mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 011-26593677"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-bg border border-border rounded-[var(--radius-md)] text-xs"
                  />
                </div>

                {/* Capability Checkboxes */}
                <div>
                  <label className="block font-semibold text-text-primary mb-2">Hospital Capabilities & Readiness</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={open24x7}
                        onChange={(e) => setOpen24x7(e.target.checked)}
                        className="rounded border-border text-action"
                      />
                      <span>Open 24/7</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={verified}
                        onChange={(e) => setVerified(e.target.checked)}
                        className="rounded border-border text-action"
                      />
                      <span>Verified Partner</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={emergencyAvailable}
                        onChange={(e) => setEmergencyAvailable(e.target.checked)}
                        className="rounded border-border text-action"
                      />
                      <span>Emergency Dept</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={traumaAvailable}
                        onChange={(e) => setTraumaAvailable(e.target.checked)}
                        className="rounded border-border text-action"
                      />
                      <span>Trauma Care</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={cardiologyAvailable}
                        onChange={(e) => setCardiologyAvailable(e.target.checked)}
                        className="rounded border-border text-action"
                      />
                      <span>Cardiology</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={maternityAvailable}
                        onChange={(e) => setMaternityAvailable(e.target.checked)}
                        className="rounded border-border text-action"
                      />
                      <span>Maternity</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={pediatricAvailable}
                        onChange={(e) => setPediatricAvailable(e.target.checked)}
                        className="rounded border-border text-action"
                      />
                      <span>Pediatrics</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={burnsAvailable}
                        onChange={(e) => setBurnsAvailable(e.target.checked)}
                        className="rounded border-border text-action"
                      />
                      <span>Burns Center</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-text-secondary bg-bg rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 text-white bg-action hover:bg-action-dark font-semibold rounded disabled:opacity-50"
                  >
                    {creating ? 'Registering...' : 'Register Hospital'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
