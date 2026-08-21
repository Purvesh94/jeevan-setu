-- ============================================================
-- JEEVAN SETU — FULL DATABASE MIGRATION SCRIPT
-- Consolidated Schema, Triggers, Storage, and RLS Policies
-- Safe to execute in Supabase SQL Editor on a fresh project
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TRIGGER FUNCTION: update_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. TABLE: PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. TABLE: ORGANIZATIONS
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

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(verification_status);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. TABLE: MEDICAL AFFILIATES
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    designation TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_profile ON medical_affiliates(profile_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_org ON medical_affiliates(organization_id);

-- ============================================================
-- 5. TABLE: HOSPITALS
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

CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status);

DROP TRIGGER IF EXISTS update_hospitals_updated_at ON hospitals;
CREATE TRIGGER update_hospitals_updated_at
    BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. TABLE: EMERGENCY INCIDENTS
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

CREATE INDEX IF NOT EXISTS idx_emergencies_user ON emergency_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergency_incidents(status);
CREATE INDEX IF NOT EXISTS idx_emergencies_priority ON emergency_incidents(priority);
CREATE INDEX IF NOT EXISTS idx_emergencies_code ON emergency_incidents(incident_code);
CREATE INDEX IF NOT EXISTS idx_emergencies_created ON emergency_incidents(created_at DESC);

DROP TRIGGER IF EXISTS update_emergencies_updated_at ON emergency_incidents;
CREATE TRIGGER update_emergencies_updated_at
    BEFORE UPDATE ON emergency_incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. TABLE: EMERGENCY MEDIA
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

CREATE INDEX IF NOT EXISTS idx_media_incident ON emergency_media(incident_id);

-- ============================================================
-- 8. TABLE: EMERGENCY STATUS HISTORY
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

CREATE INDEX IF NOT EXISTS idx_status_history_incident ON emergency_status_history(incident_id);

-- ============================================================
-- 9. TABLE: CREDENTIALS
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

CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON credentials(status);

-- ============================================================
-- 10. TABLE: CREDENTIAL ISSUERS
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
-- 11. TABLE: CONSENTS
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

CREATE INDEX IF NOT EXISTS idx_consents_user ON consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_requester ON consents(requester_id);
CREATE INDEX IF NOT EXISTS idx_consents_incident ON consents(incident_id);
CREATE INDEX IF NOT EXISTS idx_consents_status ON consents(status);

-- ============================================================
-- 12. TABLE: AUDIT LOGS
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

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_incident ON audit_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- 13. TABLE: NOTIFICATIONS
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

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- ============================================================
-- 14. TABLE: HOSPITAL RECOMMENDATIONS
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

CREATE INDEX IF NOT EXISTS idx_recommendations_incident ON hospital_recommendations(incident_id);

-- ============================================================
-- 15. STORAGE BUCKET: emergency-media
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('emergency-media', 'emergency-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Authenticated users can upload emergency media" ON storage.objects;
CREATE POLICY "Authenticated users can upload emergency media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'emergency-media');

DROP POLICY IF EXISTS "Anyone can view emergency media" ON storage.objects;
CREATE POLICY "Anyone can view emergency media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'emergency-media');

-- ============================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all 13 application tables
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

-- ------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
CREATE POLICY "Service role full access profiles" 
ON profiles FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- HOSPITALS POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view hospitals" ON hospitals;
CREATE POLICY "Anyone can view hospitals" 
ON hospitals FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Service role manage hospitals" ON hospitals;
CREATE POLICY "Service role manage hospitals" 
ON hospitals FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- EMERGENCY INCIDENTS POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own emergencies" ON emergency_incidents;
CREATE POLICY "Users view own emergencies" 
ON emergency_incidents FOR SELECT 
USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert own emergencies" ON emergency_incidents;
CREATE POLICY "Users insert own emergencies" 
ON emergency_incidents FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Affiliates view emergencies" ON emergency_incidents;
CREATE POLICY "Affiliates view emergencies" 
ON emergency_incidents FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('MEDICAL_AFFILIATE', 'ADMIN')));

DROP POLICY IF EXISTS "Service role full access emergencies" ON emergency_incidents;
CREATE POLICY "Service role full access emergencies" 
ON emergency_incidents FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- EMERGENCY MEDIA POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own media" ON emergency_media;
CREATE POLICY "Users view own media" 
ON emergency_media FOR SELECT 
USING (
    incident_id IN (
        SELECT id FROM emergency_incidents 
        WHERE user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('MEDICAL_AFFILIATE', 'ADMIN'))
);

DROP POLICY IF EXISTS "Users insert own emergency media" ON emergency_media;
CREATE POLICY "Users insert own emergency media" 
ON emergency_media FOR INSERT 
WITH CHECK (
    incident_id IN (
        SELECT id FROM emergency_incidents 
        WHERE user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Service role full access media" ON emergency_media;
CREATE POLICY "Service role full access media" 
ON emergency_media FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- EMERGENCY STATUS HISTORY POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "View status history" ON emergency_status_history;
CREATE POLICY "View status history" 
ON emergency_status_history FOR SELECT 
USING (
    incident_id IN (
        SELECT id FROM emergency_incidents 
        WHERE user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('MEDICAL_AFFILIATE', 'ADMIN'))
);

DROP POLICY IF EXISTS "Service role full access status history" ON emergency_status_history;
CREATE POLICY "Service role full access status history" 
ON emergency_status_history FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- CREDENTIALS POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own credentials" ON credentials;
CREATE POLICY "Users view own credentials" 
ON credentials FOR SELECT 
USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage own credentials" ON credentials;
CREATE POLICY "Users manage own credentials" 
ON credentials FOR ALL 
USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access credentials" ON credentials;
CREATE POLICY "Service role full access credentials" 
ON credentials FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- CREDENTIAL ISSUERS POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view issuers" ON credential_issuers;
CREATE POLICY "Anyone can view issuers" 
ON credential_issuers FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Service role manage issuers" ON credential_issuers;
CREATE POLICY "Service role manage issuers" 
ON credential_issuers FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- CONSENTS POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own consents" ON consents;
CREATE POLICY "Users view own consents" 
ON consents FOR SELECT 
USING (
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) 
    OR requester_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Affiliates insert consent requests" ON consents;
CREATE POLICY "Affiliates insert consent requests" 
ON consents FOR INSERT 
WITH CHECK (
    requester_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users update own consent response" ON consents;
CREATE POLICY "Users update own consent response" 
ON consents FOR UPDATE 
USING (
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Service role full access consents" ON consents;
CREATE POLICY "Service role full access consents" 
ON consents FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- ORGANIZATIONS POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "View organizations" ON organizations;
CREATE POLICY "View organizations" 
ON organizations FOR SELECT 
USING (
    id IN (
        SELECT organization_id FROM medical_affiliates 
        WHERE profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'ADMIN')
);

DROP POLICY IF EXISTS "Service role full access orgs" ON organizations;
CREATE POLICY "Service role full access orgs" 
ON organizations FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- MEDICAL AFFILIATES POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "View affiliate records" ON medical_affiliates;
CREATE POLICY "View affiliate records" 
ON medical_affiliates FOR SELECT 
USING (
    profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'ADMIN')
);

DROP POLICY IF EXISTS "Service role full access affiliates" ON medical_affiliates;
CREATE POLICY "Service role full access affiliates" 
ON medical_affiliates FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- AUDIT LOGS POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Affiliates and admins view audit logs" ON audit_logs;
CREATE POLICY "Affiliates and admins view audit logs" 
ON audit_logs FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('MEDICAL_AFFILIATE', 'ADMIN'))
);

DROP POLICY IF EXISTS "Service role full access audit" ON audit_logs;
CREATE POLICY "Service role full access audit" 
ON audit_logs FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" 
ON notifications FOR SELECT 
USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" 
ON notifications FOR UPDATE 
USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access notifications" ON notifications;
CREATE POLICY "Service role full access notifications" 
ON notifications FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- ------------------------------------------------------------
-- HOSPITAL RECOMMENDATIONS POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "View own recommendations" ON hospital_recommendations;
CREATE POLICY "View own recommendations" 
ON hospital_recommendations FOR SELECT 
USING (
    incident_id IN (
        SELECT id FROM emergency_incidents 
        WHERE user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role IN ('MEDICAL_AFFILIATE', 'ADMIN'))
);

DROP POLICY IF EXISTS "Service role full access recommendations" ON hospital_recommendations;
CREATE POLICY "Service role full access recommendations" 
ON hospital_recommendations FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
