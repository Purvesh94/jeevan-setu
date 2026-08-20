import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer, TileLayer, Marker, Popup, useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Building2, AlertTriangle, Phone, Navigation,
  Shield, CheckCircle2, RefreshCw, Layers, Crosshair,
  ExternalLink, Eye, Clock, Activity, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Hospital, EmergencyIncident } from '@/types';

// ─── Custom Leaflet DivIcons ─────────────────────────────────
const createUserIcon = () =>
  L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; width: 24px; height: 24px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: radar-pulse 2s infinite;"></div>
        <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #2563EB; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const createHospitalIcon = (verified: boolean) =>
  L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #0F172A; border: 2px solid ${verified ? '#16A34A' : '#2563EB'}; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: white;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 6v12M6 12h12" />
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

const createEmergencyIcon = (priority: string) => {
  const color =
    priority === 'CRITICAL' ? '#DC2626' : priority === 'HIGH' ? '#EA580C' : '#F59E0B';
  return L.divIcon({
    className: 'custom-emergency-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="position: absolute; width: 34px; height: 34px; background: ${color}40; border-radius: 50%; animation: emergency-pulse 1.8s infinite;"></div>
        <div style="position: absolute; top: 3px; left: 3px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 3px 6px rgba(0,0,0,0.35); color: white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};

// Map Recenter Helper Component
function MapViewHandler({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export function EmergencyMapPage() {
  const { profile } = useAuth();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Layer visibility toggles
  const [showHospitals, setShowHospitals] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);

  // Selected item drawer
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyIncident | null>(null);

  // Location state (defaults to Delhi NCR demo center)
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const tileUrl =
    import.meta.env.VITE_MAP_TILE_URL ||
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Detect GPS
  const detectUserGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setMapCenter([coords.lat, coords.lng]);
        setLocLoading(false);
      },
      () => {
        setLocLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch hospitals
      const hospitalList = await api.get<Hospital[]>('/api/hospitals');
      setHospitals(hospitalList || []);

      // 2. Fetch emergencies (affiliates/admins get active emergencies, citizens get their own)
      const isAffiliate = profile?.role === 'MEDICAL_AFFILIATE' || profile?.role === 'ADMIN';
      const emergencyEndpoint = isAffiliate ? '/api/emergency/active/list' : '/api/emergency';
      const emergencyList = await api.get<EmergencyIncident[]>(emergencyEndpoint).catch(() => []);
      setEmergencies(emergencyList || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  }, [profile?.role]);

  useEffect(() => {
    detectUserGPS();
    fetchData();
  }, [detectUserGPS, fetchData]);

  // Valid coordinate filters
  const validHospitals = useMemo(
    () => hospitals.filter((h) => h.latitude && h.longitude),
    [hospitals]
  );

  const validEmergencies = useMemo(
    () => emergencies.filter((e) => e.latitude && e.longitude),
    [emergencies]
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      {/* Top Header & Layer Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <MapPin className="w-5 h-5 text-action" />
            Live Emergency GIS Map
          </h1>
          <p className="text-xs text-text-secondary">
            Spatial view of emergency incidents, partner hospitals, and emergency resources
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Hospitals */}
          <button
            type="button"
            onClick={() => setShowHospitals(!showHospitals)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border transition-all',
              showHospitals
                ? 'bg-navy text-white border-navy shadow-xs'
                : 'bg-surface text-text-muted border-border hover:text-text-primary'
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            Hospitals ({validHospitals.length})
          </button>

          {/* Toggle Emergencies */}
          <button
            type="button"
            onClick={() => setShowEmergencies(!showEmergencies)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border transition-all',
              showEmergencies
                ? 'bg-emergency text-white border-emergency shadow-xs'
                : 'bg-surface text-text-muted border-border hover:text-text-primary'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Emergencies ({validEmergencies.length})
          </button>

          {/* Recenter GPS */}
          <button
            type="button"
            onClick={detectUserGPS}
            disabled={locLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface border border-border hover:border-border-strong text-text-primary rounded-[var(--radius-md)] transition-colors shadow-xs"
            title="Recenter on My Location"
          >
            <Crosshair className={cn('w-3.5 h-3.5 text-action', locLoading && 'animate-spin')} />
            GPS
          </button>

          {/* Refresh Data */}
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-surface border border-border hover:border-border-strong rounded-[var(--radius-md)] text-text-secondary transition-colors shadow-xs"
            title="Refresh map points"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Demo Disclaimer */}
      <div className="p-2 px-3 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] text-amber-900 text-xs font-semibold flex items-center justify-between gap-2 flex-shrink-0">
        <span className="flex items-center gap-1.5 truncate">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          DEMO DATA — NOT LIVE HOSPITAL BED / ER STATUS. Always call 112 for urgent dispatch.
        </span>
        <a href="tel:112" className="text-emergency font-bold hover:underline text-xs flex-shrink-0">
          CALL 112
        </a>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-2.5 bg-emergency-light border border-emergency/20 text-emergency rounded-[var(--radius-md)] text-xs flex items-center gap-2 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Map Container Area */}
      <div className="relative flex-1 rounded-[var(--radius-xl)] overflow-hidden border border-border shadow-sm bg-surface">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-surface/75 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-semibold text-text-primary">
            <Loader2 className="w-5 h-5 text-action animate-spin" />
            Loading GIS Markers...
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
          style={{ minHeight: '380px' }}
        >
          <MapViewHandler center={mapCenter} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={tileUrl}
          />

          {/* User Location Marker */}
          {userCoords && (
            <Marker position={[userCoords.lat, userCoords.lng]} icon={createUserIcon()}>
              <Popup>
                <div className="text-xs p-1">
                  <p className="font-bold text-action">📍 Your Location</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {userCoords.lat.toFixed(4)}°N, {userCoords.lng.toFixed(4)}°E
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Hospital Markers Layer */}
          {showHospitals &&
            validHospitals.map((hospital) => (
              <Marker
                key={`hosp-${hospital.id}`}
                position={[hospital.latitude, hospital.longitude]}
                icon={createHospitalIcon(hospital.verified)}
                eventHandlers={{
                  click: () => {
                    setSelectedHospital(hospital);
                    setSelectedEmergency(null);
                  },
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1 max-w-[200px]">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-text-primary truncate">{hospital.name}</span>
                      {hospital.verified && <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-text-secondary leading-tight">{hospital.address}</p>
                    <div className="flex items-center gap-1 pt-1">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-action font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <Navigation className="w-3 h-3" /> Directions
                      </a>
                      {hospital.phone && (
                        <a
                          href={`tel:${hospital.phone}`}
                          className="ml-auto text-[11px] text-success font-semibold hover:underline flex items-center gap-0.5"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Emergency Incident Markers Layer */}
          {showEmergencies &&
            validEmergencies.map((emergency) => (
              <Marker
                key={`emg-${emergency.id}`}
                position={[emergency.latitude!, emergency.longitude!]}
                icon={createEmergencyIcon(emergency.priority)}
                eventHandlers={{
                  click: () => {
                    setSelectedEmergency(emergency);
                    setSelectedHospital(null);
                  },
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1 max-w-[200px]">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-emergency">{emergency.incident_code}</span>
                      <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[10px] font-bold rounded">
                        {emergency.priority}
                      </span>
                    </div>
                    <p className="font-semibold text-text-primary text-[11px]">{emergency.category}</p>
                    <p className="text-[11px] text-text-secondary line-clamp-2">
                      {emergency.description || emergency.transcript || 'No description'}
                    </p>
                    <div className="pt-1">
                      <Link
                        to={`/emergency/${emergency.id}`}
                        className="text-[11px] text-action font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <Eye className="w-3 h-3" /> View SOS
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Selected Entity Card Drawer */}
        <AnimatePresence>
          {selectedHospital && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-[1000] p-4 bg-surface/95 backdrop-blur-md border border-border rounded-[var(--radius-xl)] shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-action uppercase tracking-wider">
                    Hospital Details
                  </span>
                  <h3 className="text-sm font-bold text-text-primary leading-tight">
                    {selectedHospital.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHospital(null)}
                  className="text-text-muted hover:text-text-primary text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-text-secondary flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                {selectedHospital.address}
              </p>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1">
                {selectedHospital.open_24x7 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-50 text-green-700 rounded">
                    Open 24/7
                  </span>
                )}
                {selectedHospital.emergency_available && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded">
                    Emergency Dept
                  </span>
                )}
                {selectedHospital.trauma_available && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded">
                    Trauma Care
                  </span>
                )}
                {selectedHospital.cardiology_available && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded">
                    Cardiology
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {selectedHospital.phone && (
                  <a
                    href={`tel:${selectedHospital.phone}`}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 text-xs font-semibold text-text-primary bg-bg border border-border hover:border-border-strong rounded-[var(--radius-md)]"
                  >
                    <Phone className="w-3 h-3 text-action" /> Call
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.latitude},${selectedHospital.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 text-xs font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)]"
                >
                  <Navigation className="w-3 h-3" /> Directions
                </a>
              </div>
            </motion.div>
          )}

          {selectedEmergency && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-[1000] p-4 bg-surface/95 backdrop-blur-md border border-emergency/30 rounded-[var(--radius-xl)] shadow-xl space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emergency text-white rounded">
                      {selectedEmergency.priority}
                    </span>
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {selectedEmergency.incident_code}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-text-primary mt-1">
                    {selectedEmergency.category.replace('_', ' ')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEmergency(null)}
                  className="text-text-muted hover:text-text-primary text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-text-secondary line-clamp-3">
                {selectedEmergency.description || selectedEmergency.transcript || 'Emergency reported.'}
              </p>

              {selectedEmergency.address_text && (
                <p className="text-[11px] text-text-muted flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-text-muted flex-shrink-0 mt-0.5" />
                  {selectedEmergency.address_text}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Link
                  to={`/emergency/${selectedEmergency.id}`}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 text-xs font-semibold text-white bg-emergency hover:bg-emergency-dark rounded-[var(--radius-md)]"
                >
                  <Eye className="w-3.5 h-3.5" /> Open Emergency Detail
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
