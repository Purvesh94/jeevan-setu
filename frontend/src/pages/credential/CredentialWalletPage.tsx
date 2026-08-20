import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Shield, Plus, QrCode, Eye, CheckCircle2, AlertCircle,
  Clock, ShieldCheck, Heart, AlertTriangle, User, Phone,
  FileText, Copy, Check, X, Loader2, Sparkles
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Credential, CredentialType } from '@/types';

const CREDENTIAL_TYPE_CONFIG: Record<
  CredentialType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  BLOOD_GROUP: { label: 'Blood Group Credential', icon: Heart, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  ALLERGY: { label: 'Allergy Warning', icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  EMERGENCY_CONTACT: { label: 'Emergency Contact', icon: Phone, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  IDENTITY: { label: 'Identity Verification', icon: User, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  INSURANCE: { label: 'Medical Insurance', icon: FileText, color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
};

interface QRDataResponse {
  type: string;
  credential_id: string;
  credential_type: string;
  subject: string;
  issuer: string;
  verification_hash: string;
}

interface VerificationResult {
  verified: boolean;
  issuer?: string;
  subject?: string;
  type?: string;
  issued_at?: string;
  expires_at?: string;
  status: string;
  reason?: string;
}

export function CredentialWalletPage() {
  const { profile } = useAuth();

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingCredential, setViewingCredential] = useState<Credential | null>(null);
  const [qrModalData, setQrModalData] = useState<{ cred: Credential; qrData: QRDataResponse } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Verification state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ id: string; result: VerificationResult } | null>(null);

  // New Credential Form state
  const [credType, setCredType] = useState<CredentialType>('BLOOD_GROUP');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [expiresInDays, setExpiresInDays] = useState(365);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Fetch Credentials
  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Credential[]>('/api/credentials');
      setCredentials(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Handle Verify Credential
  const handleVerify = async (credId: string) => {
    setVerifyingId(credId);
    try {
      const res = await api.post<VerificationResult>(`/api/credentials/verify?credential_id=${credId}`);
      setVerificationResult({ id: credId, result: res });
    } catch (err: unknown) {
      setVerificationResult({
        id: credId,
        result: {
          verified: false,
          status: 'ERROR',
          reason: err instanceof Error ? err.message : 'Verification request failed',
        },
      });
    } finally {
      setVerifyingId(null);
    }
  };

  // Handle Open QR Modal
  const handleOpenQR = async (cred: Credential) => {
    setQrLoading(true);
    try {
      const qrData = await api.get<QRDataResponse>(`/api/credentials/qr/${cred.id}`);
      setQrModalData({ cred, qrData });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR data');
    } finally {
      setQrLoading(false);
    }
  };

  // Handle Submit New Credential
  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');

    try {
      await api.post('/api/credentials', {
        credential_type: credType,
        credential_data: formData,
        expires_in_days: Number(expiresInDays),
      });

      setShowAddModal(false);
      setFormData({});
      await fetchCredentials();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create credential');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-action" />
            My Emergency Credentials
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            W3C Verifiable Credentials with cryptographic proof and consent-controlled sharing
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormData({});
            setFormError('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)] transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Credential
        </button>
      </div>

      {/* Security Info Banner */}
      <div className="p-4 bg-action-light border border-action/20 rounded-[var(--radius-xl)] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-action flex-shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary space-y-0.5">
          <p className="font-semibold text-text-primary">
            Cryptographically Signed & Zero-Knowledge Verification
          </p>
          <p>
            Emergency medical credentials are signed by the JeevanSetu platform DID. QR codes contain secure reference hashes and never expose raw unencrypted medical data publicly.
          </p>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 bg-emergency-light border border-emergency/20 text-emergency text-sm rounded-[var(--radius-md)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchCredentials} className="text-xs font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* Credentials List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted space-y-3">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <p className="text-sm font-medium">Decrypting verifiable credentials...</p>
        </div>
      ) : credentials.length === 0 ? (
        /* Empty State */
        <div className="p-12 bg-surface border border-border rounded-[var(--radius-xl)] text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-action-light flex items-center justify-center mx-auto text-action">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-text-primary">No Credentials Issued Yet</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            Add your blood group, known allergies, emergency contacts, or insurance credentials. In an emergency, first responders can request verified access with your consent.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Issue First Credential
          </button>
        </div>
      ) : (
        /* Credentials Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {credentials.map((cred) => {
            const config = CREDENTIAL_TYPE_CONFIG[cred.credential_type] || {
              label: cred.credential_type,
              icon: Shield,
              color: 'text-action',
              bgColor: 'bg-blue-50 border-blue-200',
            };
            const Icon = config.icon;
            const isVerifiedState = verificationResult?.id === cred.id;

            return (
              <motion.div
                key={cred.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Icon, Title, Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border', config.bgColor)}>
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary leading-tight">
                          {config.label}
                        </h3>
                        <span className="text-[11px] text-text-muted">
                          W3C Verifiable Credential
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase',
                        cred.status === 'ACTIVE'
                          ? 'badge-verified'
                          : cred.status === 'EXPIRED'
                          ? 'badge-medium'
                          : 'badge-critical'
                      )}
                    >
                      {cred.status}
                    </span>
                  </div>

                  {/* Highlight Data Fields */}
                  <div className="p-3 bg-bg border border-border rounded-[var(--radius-lg)] space-y-1.5 text-xs">
                    {Object.entries(cred.credential_data || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-baseline gap-2">
                        <span className="text-text-muted capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-semibold text-text-primary text-right truncate max-w-[160px]">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Verification inline banner if tested */}
                  {isVerifiedState && (
                    <div
                      className={cn(
                        'mt-2.5 p-2 rounded-[var(--radius-md)] text-xs font-semibold flex items-center gap-1.5 border',
                        verificationResult.result.verified
                          ? 'bg-success-light text-success border-success/20'
                          : 'bg-emergency-light text-emergency border-emergency/20'
                      )}
                    >
                      {verificationResult.result.verified ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>HMAC Signature & Proof Verified ✓</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{verificationResult.result.reason || 'Verification Failed'}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
                    <span className="flex items-center gap-1 truncate max-w-[140px]" title={cred.did_issuer}>
                      <Shield className="w-3 h-3 text-action" /> {cred.did_issuer.replace('did:jeevansetu:issuer:', 'Issuer: ')}
                    </span>
                    {cred.expires_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Exp: {new Date(cred.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-border flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingCredential(cred)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-semibold text-text-primary bg-bg border border-border hover:border-border-strong rounded-[var(--radius-md)] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-text-muted" /> View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerify(cred.id)}
                    disabled={verifyingId === cred.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-semibold text-action bg-action-light hover:bg-action/15 border border-action/20 rounded-[var(--radius-md)] transition-colors"
                  >
                    {verifyingId === cred.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    Verify
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenQR(cred)}
                    className="p-2 text-text-primary bg-bg border border-border hover:bg-surface rounded-[var(--radius-md)] transition-colors"
                    title="Generate QR Share Proof"
                  >
                    <QrCode className="w-4 h-4 text-action" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ 1. ADD CREDENTIAL MODAL ═══ */}
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
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-action" />
                  <h3 className="text-base font-bold text-text-primary">Issue Verifiable Credential</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-emergency-light border border-emergency/20 text-emergency text-xs rounded-[var(--radius-md)] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateCredential} className="space-y-4">
                {/* Credential Type Select */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Credential Type</label>
                  <select
                    value={credType}
                    onChange={(e) => {
                      setCredType(e.target.value as CredentialType);
                      setFormData({});
                    }}
                    className="w-full p-2.5 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-medium"
                  >
                    <option value="BLOOD_GROUP">🩸 Blood Group</option>
                    <option value="ALLERGY">🔴 Medical Allergy Alert</option>
                    <option value="EMERGENCY_CONTACT">📞 Emergency Contact</option>
                    <option value="IDENTITY">🪪 Identity Verification</option>
                    <option value="INSURANCE">🛡️ Medical Insurance</option>
                  </select>
                </div>

                {/* Dynamic Fields Based on Type */}
                {credType === 'BLOOD_GROUP' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Blood Group</label>
                      <select
                        required
                        value={formData.blood_group || ''}
                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                        className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                      >
                        <option value="">Select Blood Group...</option>
                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Verified By Lab / Doctor</label>
                      <input
                        type="text"
                        placeholder="e.g. AIIMS PathLab / Dr. Sharma"
                        value={formData.verified_by || ''}
                        onChange={(e) => setFormData({ ...formData, verified_by: e.target.value })}
                        className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                      />
                    </div>
                  </div>
                )}

                {credType === 'ALLERGY' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Known Allergies (Medications / Food)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Penicillin, Peanuts, Aspirin, Latex"
                        value={formData.allergies || ''}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Severity Level</label>
                      <select
                        value={formData.severity || 'SEVERE'}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                        className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                      >
                        <option value="CRITICAL / ANAPHYLACTIC">Critical / Anaphylactic</option>
                        <option value="SEVERE">Severe</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="MILD">Mild</option>
                      </select>
                    </div>
                  </div>
                )}

                {credType === 'EMERGENCY_CONTACT' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Contact Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={formData.contact_name || ''}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Relationship</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Spouse / Parent"
                          value={formData.relationship || ''}
                          onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                          className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {credType === 'IDENTITY' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name as on Govt ID"
                        value={formData.full_name || profile?.full_name || ''}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">ID Document Type</label>
                        <select
                          value={formData.id_type || 'AADHAAR_MASKED'}
                          onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                          className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                        >
                          <option value="AADHAAR_MASKED">Masked Aadhaar</option>
                          <option value="PASSPORT">Passport</option>
                          <option value="DRIVING_LICENSE">Driving License</option>
                          <option value="VOTER_ID">Voter ID</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Last 4 Digits</label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="XXXX"
                          value={formData.id_last4 || ''}
                          onChange={(e) => setFormData({ ...formData, id_last4: e.target.value })}
                          className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {credType === 'INSURANCE' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Insurance Provider</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Star Health / HDFC ERGO"
                        value={formData.provider || ''}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Policy / Member ID</label>
                        <input
                          type="text"
                          required
                          placeholder="POL-123456"
                          value={formData.policy_number || ''}
                          onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                          className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Emergency TPA Helpline</label>
                        <input
                          type="tel"
                          placeholder="1800-XXX-XXXX"
                          value={formData.tpa_helpline || ''}
                          onChange={(e) => setFormData({ ...formData, tpa_helpline: e.target.value })}
                          className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Validity */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Credential Validity</label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="w-full p-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action"
                  >
                    <option value={90}>90 Days (3 Months)</option>
                    <option value={180}>180 Days (6 Months)</option>
                    <option value={365}>365 Days (1 Year)</option>
                    <option value={730}>730 Days (2 Years)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-text-secondary bg-bg hover:bg-border/50 rounded-[var(--radius-md)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-action hover:bg-action-dark disabled:opacity-50 rounded-[var(--radius-md)] shadow-sm"
                  >
                    {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {creating ? 'Signing Credential...' : 'Issue & Sign Credential'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ 2. VIEW CREDENTIAL JSON / VC MODAL ═══ */}
      <AnimatePresence>
        {viewingCredential && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4 text-action" />
                    W3C Verifiable Credential Structure
                  </h3>
                  <p className="text-xs text-text-muted">ID: {viewingCredential.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCredential(null)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-text-primary">DID Subject:</span>
                  <p className="font-mono bg-bg p-2 rounded border border-border text-text-secondary mt-1 break-all">
                    {viewingCredential.did_subject}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-text-primary">DID Issuer:</span>
                  <p className="font-mono bg-bg p-2 rounded border border-border text-text-secondary mt-1 break-all">
                    {viewingCredential.did_issuer}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-text-primary">Claims Data (JSON):</span>
                  <pre className="font-mono bg-bg p-2.5 rounded border border-border text-text-primary mt-1 overflow-x-auto text-[11px]">
                    {JSON.stringify(viewingCredential.credential_data, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="font-semibold text-text-primary">Cryptographic Proof:</span>
                  <pre className="font-mono bg-bg p-2.5 rounded border border-border text-text-muted mt-1 overflow-x-auto text-[11px]">
                    {JSON.stringify(viewingCredential.proof, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setViewingCredential(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ 3. QR SHARING MODAL ═══ */}
      <AnimatePresence>
        {qrModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-2xl text-center space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-left">
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-action" />
                    Emergency QR Proof
                  </h3>
                  <p className="text-xs text-text-muted">
                    {CREDENTIAL_TYPE_CONFIG[qrModalData.cred.credential_type]?.label || qrModalData.cred.credential_type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQrModalData(null)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* QR Code Container */}
              <div className="p-6 bg-white border border-border rounded-[var(--radius-xl)] inline-block shadow-inner mx-auto">
                <QRCodeSVG
                  value={JSON.stringify(qrModalData.qrData)}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="p-3 bg-bg border border-border rounded-[var(--radius-lg)] text-left text-xs space-y-1 font-mono">
                <p className="text-text-muted flex justify-between">
                  <span>Proof Hash:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(qrModalData.qrData.verification_hash)}
                    className="text-action hover:underline text-[11px] flex items-center gap-0.5"
                  >
                    {copiedText ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    {copiedText ? 'Copied' : 'Copy'}
                  </button>
                </p>
                <p className="text-text-primary truncate">{qrModalData.qrData.verification_hash}</p>
              </div>

              <p className="text-xs text-text-secondary">
                First responders scan this QR to verify platform cryptographic proofs via the Medical Affiliate verification terminal.
              </p>

              <button
                type="button"
                onClick={() => setQrModalData(null)}
                className="w-full py-2.5 text-xs font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)]"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
