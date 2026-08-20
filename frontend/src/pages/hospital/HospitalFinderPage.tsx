import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, MapPin, Phone, Navigation, CheckCircle2,
  AlertTriangle, Search, Filter, Sparkles, Clock, Shield,
  Activity, Flame, Baby, ExternalLink, Loader2, RefreshCw
} from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import type { Hospital, EmergencyCategory } from '@/types';

const SPECIALTY_FILTERS = [
  { key: 'all', label: 'All Hospitals', icon: Building2 },
  { key: 'emergency', label: 'Emergency (24/7)', icon: Activity },
  { key: 'trauma', label: 'Trauma Center', icon: Shield },
  { key: 'cardiology', label: 'Cardiology', icon: Activity },
  { key: 'maternity', label: 'Maternity', icon: Baby },
  { key: 'pediatric', label: 'Pediatrics', icon: Baby },
  { key: 'burns', label: 'Burns Unit', icon: Flame },
];

const EMERGENCY_CATEGORIES: { key: EmergencyCategory; label: string }[] = [
  { key: 'ROAD_ACCIDENT', label: 'Road Accident (Trauma Priority)' },
  { key: 'MEDICAL', label: 'General Medical Emergency' },
  { key: 'FIRE', label: 'Fire & Burn Emergency' },
  { key: 'DISASTER', label: 'Mass Casualty / Disaster' },
];

export function HospitalFinderPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [radiusKm, setRadiusKm] = useState(25);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Recommendation mode state
  const [isRecommendMode, setIsRecommendMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>('ROAD_ACCIDENT');

  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');

  // Detect GPS
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocLoading(true);
    setLocError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLocLoading(false);
      },
      (err) => {
        // Fallback default coordinates (Delhi NCR center where demo data is located)
        setUserLocation({ lat: 28.6139, lon: 77.2090 });
        setLocError(`Location detection: ${err.message}. Using default NCR coordinates.`);
        setLocLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Fetch Hospitals
  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (isRecommendMode && userLocation) {
        // Use smart recommendation endpoint
        const data = await api.get<Hospital[]>(
          `/api/hospitals/recommend?lat=${userLocation.lat}&lon=${userLocation.lon}&category=${selectedCategory}`
        );
        setHospitals(data || []);
      } else {
        // Use standard list endpoint with query params
        const params = new URLSearchParams();
        if (userLocation) {
          params.append('lat', userLocation.lat.toString());
          params.append('lon', userLocation.lon.toString());
          params.append('radius_km', radiusKm.toString());
        }
        if (selectedSpecialty !== 'all') {
          params.append('specialty', selectedSpecialty);
        }

        const endpoint = `/api/hospitals${params.toString() ? `?${params.toString()}` : ''}`;
        const data = await api.get<Hospital[]>(endpoint);
        setHospitals(data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch hospital records';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isRecommendMode, userLocation, selectedCategory, radiusKm, selectedSpecialty]);

  // Initial load: trigger GPS and initial hospital fetch
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // Client-side text and verification filter
  const filteredHospitals = hospitals.filter((h) => {
    if (verifiedOnly && !h.verified) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = h.name.toLowerCase().includes(q);
      const matchAddress = h.address.toLowerCase().includes(q);
      return matchName || matchAddress;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="w-6 h-6 text-action" />
            Hospital Discovery & Capabilities
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Locate nearest hospitals, trauma units, and specialized emergency infrastructure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:112"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emergency hover:bg-emergency-dark rounded-[var(--radius-md)] transition-colors shadow-sm"
          >
            <Phone className="w-4 h-4" />
            CALL 112
          </a>
        </div>
      </div>

      {/* Demo Data Disclaimer (Required by PRD §21) */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] text-amber-900 text-xs font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          DEMO DATA — NOT LIVE HOSPITAL AVAILABILITY. In a life-threatening emergency, always dial 112.
        </span>
      </div>

      {/* Mode Switcher & Location Bar */}
      <div className="p-4 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          {/* Mode Tabs */}
          <div className="flex items-center gap-2 p-1 bg-bg border border-border rounded-[var(--radius-lg)] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsRecommendMode(false)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] transition-all',
                !isRecommendMode
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              Standard Search
            </button>
            <button
              type="button"
              onClick={() => setIsRecommendMode(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] transition-all',
                isRecommendMode
                  ? 'bg-action text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Recommendation
            </button>
          </div>

          {/* Location status & refresh */}
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {userLocation ? (
              <span className="flex items-center gap-1 text-success font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {userLocation.lat.toFixed(2)}°N, {userLocation.lon.toFixed(2)}°E
              </span>
            ) : (
              <span className="text-text-muted">Location not active</span>
            )}
            <button
              type="button"
              onClick={detectLocation}
              disabled={locLoading}
              className="p-1.5 rounded-[var(--radius-sm)] border border-border hover:bg-bg transition-colors"
              title="Refresh GPS location"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-text-secondary', locLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {locError && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-[var(--radius-sm)] border border-amber-200">
            {locError}
          </p>
        )}

        {/* AI Recommendation Controls */}
        {isRecommendMode ? (
          <div className="p-3 bg-action-light border border-action/20 rounded-[var(--radius-lg)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-action flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Match for Emergency Category:
              </label>
              <span className="text-[11px] text-action/80 font-medium">
                Multi-factor scoring based on trauma, burns, 24/7 readiness & distance
              </span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as EmergencyCategory)}
              className="w-full p-2 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
            >
              {EMERGENCY_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          /* Standard Search Controls */
          <div className="space-y-3">
            {/* Search Input & Radius */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by hospital name or address..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-1 focus:ring-action/20 transition-all"
                />
              </div>

              {/* Radius Select */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-text-secondary whitespace-nowrap">Radius:</label>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="py-2 px-3 text-xs font-medium bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                >
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                  <option value={35}>35 km</option>
                  <option value={50}>50 km</option>
                </select>

                {/* Verified Toggle */}
                <button
                  type="button"
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-[var(--radius-md)] border transition-all whitespace-nowrap',
                    verifiedOnly
                      ? 'bg-success-light text-success border-success/30'
                      : 'bg-bg text-text-secondary border-border hover:text-text-primary'
                  )}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Verified Only
                </button>
              </div>
            </div>

            {/* Specialty Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {SPECIALTY_FILTERS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSelectedSpecialty(s.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap',
                    selectedSpecialty === s.key
                      ? 'bg-action text-white border-action shadow-xs'
                      : 'bg-surface text-text-secondary border-border hover:border-border-strong hover:text-text-primary'
                  )}
                >
                  <s.icon className="w-3 h-3" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-emergency-light border border-emergency/20 rounded-[var(--radius-lg)] text-emergency text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchHospitals}
            className="text-xs underline font-semibold hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          {isRecommendMode ? 'AI Recommended Hospitals' : 'Hospital Results'}{' '}
          <span className="text-text-muted font-normal">({filteredHospitals.length})</span>
        </h2>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted space-y-3">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <p className="text-sm font-medium">Scanning emergency hospital network...</p>
        </div>
      ) : filteredHospitals.length === 0 ? (
        /* Empty State */
        <div className="p-12 bg-surface border border-border rounded-[var(--radius-xl)] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center mx-auto text-text-muted">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">No Matching Hospitals Found</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Try expanding your search radius, selecting a different specialty filter, or enabling location permissions.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedSpecialty('all');
              setVerifiedOnly(false);
              setRadiusKm(50);
            }}
            className="px-4 py-2 text-xs font-semibold text-action bg-action-light hover:bg-action/10 rounded-[var(--radius-md)] transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>
      ) : (
        /* Hospital Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHospitals.map((hospital, idx) => {
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

            return (
              <motion.div
                key={hospital.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className={cn(
                  'p-5 bg-surface border rounded-[var(--radius-xl)] transition-all flex flex-col justify-between space-y-4 hover:shadow-card-hover',
                  hospital.rank === 1
                    ? 'border-action/40 ring-1 ring-action/20 bg-gradient-to-br from-surface to-action-light/20'
                    : 'border-border'
                )}
              >
                <div>
                  {/* Top Bar: Badges & Distance */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {hospital.rank && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-action text-white">
                          #{hospital.rank} Ranked
                        </span>
                      )}
                      {hospital.verified && (
                        <span className="badge-verified px-2 py-0.5 text-[11px] font-semibold rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[11px] font-semibold rounded-full',
                          hospital.open_24x7
                            ? 'bg-success-light text-success border border-success/20'
                            : 'bg-bg text-text-secondary border border-border'
                        )}
                      >
                        {hospital.open_24x7 ? 'Open 24/7' : 'Regular Hours'}
                      </span>
                    </div>

                    {hospital.distance_km !== undefined && (
                      <span className="px-2 py-1 text-xs font-bold text-action bg-action-light rounded-[var(--radius-sm)] border border-action/20 whitespace-nowrap">
                        {hospital.distance_km} km
                      </span>
                    )}
                  </div>

                  {/* Hospital Name & Address */}
                  <h3 className="text-base font-bold text-text-primary leading-tight">
                    {hospital.name}
                  </h3>
                  <p className="text-xs text-text-secondary flex items-start gap-1 mt-1 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                    <span>{hospital.address}</span>
                  </p>

                  {/* Why Recommended Callout (PRD §21) */}
                  {hospital.match_reasons && hospital.match_reasons.length > 0 && (
                    <div className="mt-3 p-2.5 bg-action-light/60 border border-action/15 rounded-[var(--radius-md)] space-y-1">
                      <p className="text-[11px] font-bold text-action flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Why Recommended?
                      </p>
                      <ul className="text-xs text-text-primary space-y-0.5">
                        {hospital.match_reasons.map((reason, i) => (
                          <li key={i} className="flex items-center gap-1 text-[11px]">
                            <span className="text-action">•</span> {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Capabilities Badges */}
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
                    {hospital.emergency_available && (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 rounded-md">
                        Emergency Dept
                      </span>
                    )}
                    {hospital.trauma_available && (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                        Trauma Care
                      </span>
                    )}
                    {hospital.cardiology_available && (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                        Cardiology
                      </span>
                    )}
                    {hospital.maternity_available && (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-pink-50 text-pink-700 border border-pink-200 rounded-md">
                        Maternity
                      </span>
                    )}
                    {hospital.pediatric_available && (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md">
                        Pediatrics
                      </span>
                    )}
                    {hospital.burns_available && (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-md">
                        Burns Unit
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-border flex items-center gap-2">
                  {hospital.phone ? (
                    <a
                      href={`tel:${hospital.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-text-primary bg-bg border border-border hover:border-border-strong rounded-[var(--radius-md)] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-action" />
                      {hospital.phone}
                    </a>
                  ) : (
                    <span className="flex-1 text-center text-xs text-text-muted py-2">No direct phone</span>
                  )}

                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)] transition-colors shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Directions
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
