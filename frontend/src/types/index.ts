/* ============================================================
   JeevanSetu — TypeScript Type Definitions
   ============================================================ */

// ─── Roles ───────────────────────────────────────────────
export type UserRole = 'USER' | 'MEDICAL_AFFILIATE' | 'ADMIN';

// ─── Profile ─────────────────────────────────────────────
export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  preferred_language: string;
  profile_photo_url: string | null;
  role: UserRole;
  did_identifier: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Emergency ───────────────────────────────────────────
export type EmergencyCategory =
  | 'MEDICAL'
  | 'ROAD_ACCIDENT'
  | 'FIRE'
  | 'CRIME'
  | 'WOMEN_SAFETY'
  | 'CHILD_SAFETY'
  | 'MISSING_PERSON'
  | 'FLOOD'
  | 'DISASTER'
  | 'OTHER';

export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type EmergencyStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'IN_TRANSIT'
  | 'REACHED'
  | 'TREATMENT_STARTED'
  | 'CLOSED';

export interface EmergencyIncident {
  id: string;
  incident_code: string;
  user_id: string;
  category: EmergencyCategory;
  priority: EmergencyPriority;
  description: string | null;
  transcript: string | null;
  translation: string | null;
  language: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  address_text: string | null;
  ai_confidence: number | null;
  ai_raw_result: Record<string, unknown> | null;
  required_services: string[] | null;
  status: EmergencyStatus;
  assigned_affiliate_id: string | null;
  recommended_hospital_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Hospital ────────────────────────────────────────────
export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  emergency_available: boolean;
  trauma_available: boolean;
  cardiology_available: boolean;
  maternity_available: boolean;
  pediatric_available: boolean;
  burns_available: boolean;
  open_24x7: boolean;
  verified: boolean;
  status: string;
  distance_km?: number;
  score?: number;
  rank?: number;
  match_reasons?: string[];
}

// ─── Credential ──────────────────────────────────────────
export type CredentialType =
  | 'IDENTITY'
  | 'BLOOD_GROUP'
  | 'ALLERGY'
  | 'EMERGENCY_CONTACT'
  | 'INSURANCE';

export interface Credential {
  id: string;
  user_id: string;
  credential_type: CredentialType;
  did_subject: string;
  did_issuer: string;
  credential_data: Record<string, unknown>;
  proof: Record<string, unknown>;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  issued_at: string;
  expires_at: string | null;
  created_at: string;
}

// ─── Consent ─────────────────────────────────────────────
export type ConsentStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'REVOKED';

export interface Consent {
  id: string;
  incident_id: string | null;
  requester_id: string;
  user_id: string;
  requested_fields: string[];
  purpose: string;
  status: ConsentStatus;
  access_duration_minutes: number;
  created_at: string;
  expires_at: string | null;
  approved_at: string | null;
  revoked_at: string | null;
}

// ─── Notification ────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

// ─── Audit ───────────────────────────────────────────────
export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  incident_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─── AI Response ─────────────────────────────────────────
export interface AIAnalysisResult {
  detected_language: string;
  detected_language_name: string;
  original_text: string;
  translation: string;
  category: EmergencyCategory;
  priority: EmergencyPriority;
  summary: string;
  required_services: string[];
  key_details: string[];
  confidence: number;
  fallback?: boolean;
}

export interface AIImageAnalysis {
  scene_description: string;
  emergency_indicators: string[];
  suggested_category: EmergencyCategory;
  severity_assessment: string;
  confidence: number;
}

// ─── Organization ────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  hospital_name: string;
  license_number: string;
  official_email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  org_type: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  created_at: string;
}
