-- ============================================================
-- JeevanSetu Database Schema — Full Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    preferred_language TEXT DEFAULT 'en',
    profile_photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'MEDICAL_AFFILIATE', 'ADMIN')),
    did_identifier TEXT,
    did_keypair_public JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- 2. ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    hospital_name TEXT,
    license_number TEXT,
    official_email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    org_type TEXT,
    proof_document_url TEXT,
    verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. MEDICAL AFFILIATES
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    designation TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliates_profile ON medical_affiliates(profile_id);

-- ============================================================
-- 4. HOSPITALS
-- ============================================================
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone TEXT,
    emergency_available BOOLEAN DEFAULT TRUE,
    trauma_available BOOLEAN DEFAULT FALSE,
    cardiology_available BOOLEAN DEFAULT FALSE,
    maternity_available BOOLEAN DEFAULT FALSE,
    pediatric_available BOOLEAN DEFAULT FALSE,
    burns_available BOOLEAN DEFAULT FALSE,
    open_24x7 BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hospitals_location ON hospitals(latitude, longitude);

-- ============================================================
-- 5. EMERGENCY INCIDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_code TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id),
    category TEXT DEFAULT 'OTHER',
    priority TEXT DEFAULT 'UNKNOWN' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN')),
    description TEXT,
    transcript TEXT,
    translation TEXT,
    language TEXT DEFAULT 'en',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_accuracy DOUBLE PRECISION,
    address_text TEXT,
    ai_confidence DOUBLE PRECISION,
    ai_raw_result JSONB,
    required_services JSONB,
    status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'ACCEPTED', 'IN_TRANSIT', 'REACHED', 'TREATMENT_STARTED', 'CLOSED')),
    assigned_affiliate_id UUID REFERENCES profiles(id),
    recommended_hospital_id UUID REFERENCES hospitals(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergencies_user ON emergency_incidents(user_id);
CREATE INDEX idx_emergencies_status ON emergency_incidents(status);
CREATE INDEX idx_emergencies_priority ON emergency_incidents(priority);
CREATE INDEX idx_emergencies_code ON emergency_incidents(incident_code);

-- ============================================================
-- 6. EMERGENCY MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES emergency_incidents(id) ON DELETE CASCADE,
    media_type TEXT CHECK (media_type IN ('IMAGE', 'AUDIO', 'VIDEO')),
    storage_path TEXT NOT NULL,
    ai_analysis TEXT,
    ai_analysis_raw JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_incident ON emergency_media(incident_id);

-- ============================================================
-- 7. EMERGENCY STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES emergency_incidents(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_history_incident ON emergency_status_history(incident_id);

-- ============================================================
-- 8. CREDENTIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    credential_type TEXT NOT NULL CHECK (credential_type IN ('IDENTITY', 'BLOOD_GROUP', 'ALLERGY', 'EMERGENCY_CONTACT', 'INSURANCE')),
    did_subject TEXT,
    did_issuer TEXT,
    credential_data JSONB NOT NULL,
    proof JSONB,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credentials_user ON credentials(user_id);
CREATE INDEX idx_credentials_type ON credentials(credential_type);

-- ============================================================
-- 9. CREDENTIAL ISSUERS
-- ============================================================
CREATE TABLE IF NOT EXISTS credential_issuers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    did_identifier TEXT UNIQUE,
    public_key JSONB,
    issuer_type TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. CONSENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES emergency_incidents(id),
    requester_id UUID NOT NULL REFERENCES profiles(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    requested_fields JSONB NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'REVOKED')),
    access_duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_consents_user ON consents(user_id);
CREATE INDEX idx_consents_requester ON consents(requester_id);
CREATE INDEX idx_consents_incident ON consents(incident_id);
CREATE INDEX idx_consents_status ON consents(status);

-- ============================================================
-- 11. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id),
    actor_role TEXT,
    incident_id UUID REFERENCES emergency_incidents(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_incident ON audit_logs(incident_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT CHECK (type IN ('CONSENT_REQUEST', 'EMERGENCY_STATUS', 'CREDENTIAL_SHARE', 'CREDENTIAL_EXPIRY', 'NEW_EMERGENCY', 'CRITICAL_EMERGENCY', 'SYSTEM')),
    priority TEXT DEFAULT 'NORMAL',
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- ============================================================
-- 13. HOSPITAL RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS hospital_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES emergency_incidents(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    distance_km DOUBLE PRECISION,
    match_reasons JSONB,
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_incident ON hospital_recommendations(incident_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_recommendations ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read/update own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- HOSPITALS: Public read
CREATE POLICY "Anyone can view hospitals" ON hospitals FOR SELECT USING (true);
CREATE POLICY "Service role manage hospitals" ON hospitals FOR ALL USING (auth.role() = 'service_role');

-- EMERGENCY INCIDENTS: Users see own, affiliates/admin see all
CREATE POLICY "Users view own emergencies" ON emergency_incidents FOR SELECT 
    USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "Service role full access emergencies" ON emergency_incidents FOR ALL USING (auth.role() = 'service_role');

-- EMERGENCY MEDIA: Linked to incident access
CREATE POLICY "Users view own media" ON emergency_media FOR SELECT 
    USING (incident_id IN (SELECT id FROM emergency_incidents WHERE user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())));
CREATE POLICY "Service role full access media" ON emergency_media FOR ALL USING (auth.role() = 'service_role');

-- CREDENTIALS: Users see own
CREATE POLICY "Users view own credentials" ON credentials FOR SELECT 
    USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "Service role full access credentials" ON credentials FOR ALL USING (auth.role() = 'service_role');

-- CONSENTS: Users see own, requesters see their requests
CREATE POLICY "Users view own consents" ON consents FOR SELECT 
    USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) 
           OR requester_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "Service role full access consents" ON consents FOR ALL USING (auth.role() = 'service_role');

-- NOTIFICATIONS: Users see own
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT 
    USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "Service role full access notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');

-- AUDIT LOGS: Read only for authorized roles
CREATE POLICY "Service role full access audit" ON audit_logs FOR ALL USING (auth.role() = 'service_role');

-- ORGANIZATIONS: Service role access
CREATE POLICY "Service role full access orgs" ON organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "View own org" ON organizations FOR SELECT USING (
    id IN (SELECT organization_id FROM medical_affiliates WHERE profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
);

-- MEDICAL AFFILIATES: Service role access
CREATE POLICY "Service role full access affiliates" ON medical_affiliates FOR ALL USING (auth.role() = 'service_role');

-- STATUS HISTORY: Read via incident
CREATE POLICY "View status history" ON emergency_status_history FOR SELECT USING (
    incident_id IN (SELECT id FROM emergency_incidents WHERE user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "Service role full access status history" ON emergency_status_history FOR ALL USING (auth.role() = 'service_role');

-- CREDENTIAL ISSUERS: Public read
CREATE POLICY "Anyone can view issuers" ON credential_issuers FOR SELECT USING (true);
CREATE POLICY "Service role manage issuers" ON credential_issuers FOR ALL USING (auth.role() = 'service_role');

-- HOSPITAL RECOMMENDATIONS: Linked to incident
CREATE POLICY "View own recommendations" ON hospital_recommendations FOR SELECT USING (
    incident_id IN (SELECT id FROM emergency_incidents WHERE user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "Service role full access recommendations" ON hospital_recommendations FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_emergencies_updated_at BEFORE UPDATE ON emergency_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
