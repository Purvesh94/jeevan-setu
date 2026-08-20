import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Globe, Shield, Clock,
  CheckCircle2, AlertCircle, Loader2, KeyRound, Copy, Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
];

export function ProfilePage() {
  const { profile, user, refreshProfile, resetPassword } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'en');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const [copiedDid, setCopiedDid] = useState(false);

  // Sync state when profile loads/updates
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setPreferredLanguage(profile.preferred_language || 'en');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await api.put<Profile>('/api/auth/profile', {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        preferred_language: preferredLanguage,
      });

      await refreshProfile();
      setSuccessMsg('Profile updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    const emailToReset = profile?.email || user?.email;
    if (!emailToReset) {
      setResetError('No email found for password reset.');
      return;
    }

    setResetLoading(true);
    setResetSuccess(false);
    setResetError('');

    try {
      await resetPassword(emailToReset);
      setResetSuccess(true);
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const copyDidToClipboard = () => {
    const did = profile?.did_identifier || (profile?.id ? `did:jeevansetu:user:${profile.id.slice(0, 8)}` : '');
    if (did) {
      navigator.clipboard.writeText(did);
      setCopiedDid(true);
      setTimeout(() => setCopiedDid(false), 2000);
    }
  };

  const roleLabel =
    profile?.role === 'ADMIN'
      ? 'Administrator'
      : profile?.role === 'MEDICAL_AFFILIATE'
      ? 'Medical Affiliate'
      : 'Citizen User';

  const didString =
    profile?.did_identifier ||
    (profile?.id ? `did:jeevansetu:user:${profile.id.slice(0, 8)}` : 'Generating DID...');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <User className="w-6 h-6 text-action" />
          My Profile & Settings
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Manage your personal details, language preferences, and decentralized identity
        </p>
      </div>

      {/* Identity Banner Card */}
      <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md',
                profile?.role === 'ADMIN'
                  ? 'bg-navy'
                  : profile?.role === 'MEDICAL_AFFILIATE'
                  ? 'bg-action'
                  : 'bg-action'
              )}
            >
              {profile?.full_name?.[0]?.toUpperCase() ||
                profile?.email?.[0]?.toUpperCase() ||
                'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-text-primary">
                  {profile?.full_name || 'Anonymous User'}
                </h2>
                <span
                  className={cn(
                    'px-2.5 py-0.5 text-xs font-semibold rounded-full',
                    profile?.role === 'ADMIN'
                      ? 'bg-navy text-white'
                      : profile?.role === 'MEDICAL_AFFILIATE'
                      ? 'bg-action text-white'
                      : 'bg-action-light text-action border border-action/20'
                  )}
                >
                  {roleLabel}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-0.5">{profile?.email || user?.email}</p>
            </div>
          </div>

          {/* DID Badge */}
          <div className="p-3 bg-bg border border-border rounded-[var(--radius-lg)] sm:max-w-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                <Shield className="w-3 h-3 text-action" /> Decentralized ID (DID)
              </span>
              <button
                type="button"
                onClick={copyDidToClipboard}
                className="text-[11px] text-action hover:text-action-dark flex items-center gap-0.5"
                title="Copy DID"
              >
                {copiedDid ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                {copiedDid ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs font-mono text-text-primary truncate">{didString}</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm">
        <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-action" />
          Personal Details
        </h3>

        {/* Feedback Banners */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 p-3 mb-4 text-sm text-success bg-success-light border border-success/20 rounded-[var(--radius-md)]"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 p-3 mb-4 text-sm text-emergency bg-emergency-light border border-emergency/20 rounded-[var(--radius-md)]"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Preferred Language for Emergency AI & Translations
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all appearance-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-text-muted mt-1">
              AI emergency analysis and incoming notifications will prioritize this language.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-action hover:bg-action-dark disabled:opacity-50 rounded-[var(--radius-md)] transition-colors shadow-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Account Information Card */}
      <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm space-y-5">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-action" />
          Security & Credentials
        </h3>

        {/* Readonly Email */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Registered Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="email"
              disabled
              value={profile?.email || user?.email || ''}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-border rounded-[var(--radius-md)] text-text-secondary cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-text-muted mt-1">
            Email address is tied to your cryptographic authentication and cannot be edited.
          </p>
        </div>

        {/* Password Reset Section */}
        <div className="p-4 bg-bg border border-border rounded-[var(--radius-lg)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Password Management</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Send a secure password reset link to your registered email
            </p>
            {resetSuccess && (
              <p className="text-xs font-medium text-success mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Password reset link sent to your inbox.
              </p>
            )}
            {resetError && (
              <p className="text-xs font-medium text-emergency mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {resetError}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={resetLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-text-primary bg-surface border border-border hover:border-border-strong rounded-[var(--radius-md)] transition-colors whitespace-nowrap self-start sm:self-center"
          >
            {resetLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {resetLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>

        {/* Metadata */}
        {profile?.created_at && (
          <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>Member since {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
