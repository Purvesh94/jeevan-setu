import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, KeyRound, Search, CheckCircle2,
  XCircle, Clock, User, Building2, AlertCircle, Loader2,
  FileCheck, Shield, Sparkles, RefreshCw
} from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface VerificationResponse {
  verified: boolean;
  issuer?: string;
  subject?: string;
  type?: string;
  issued_at?: string;
  expires_at?: string;
  status: string;
  reason?: string;
  claims?: Record<string, unknown>;
}

export function CredentialVerificationPage() {
  const [credentialIdInput, setCredentialIdInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = credentialIdInput.trim();
    if (!id) return;

    setVerifying(true);
    setError('');
    setResult(null);

    try {
      // If user pasted a JSON QR object, extract the credential_id
      let targetId = id;
      try {
        const parsed = JSON.parse(id);
        if (parsed.credential_id) targetId = parsed.credential_id;
      } catch {
        // Not a JSON string, assume standard UUID
      }

      const data = await api.post<VerificationResponse>(`/api/credentials/verify?credential_id=${targetId}`);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed or credential not found.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-action" />
          Cryptographic Credential Verification Terminal
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Verify W3C digital signatures, DID proofs, and tamper-resistance for emergency health records
        </p>
      </div>

      {/* Zero-Knowledge & Cryptographic Verification Card */}
      <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm space-y-4">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-action" />
          Input Credential Reference or QR Hash
        </h2>
        <p className="text-xs text-text-secondary">
          Enter the Credential ID or paste the raw payload scanned from the patient's Emergency QR Code.
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              required
              value={credentialIdInput}
              onChange={(e) => setCredentialIdInput(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000 or { credential_id: '...' }"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action font-mono"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={verifying || !credentialIdInput.trim()}
              className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-white bg-action hover:bg-action-dark disabled:opacity-50 rounded-[var(--radius-md)] transition-colors shadow-sm"
            >
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
              {verifying ? 'Verifying Signature...' : 'Verify Cryptographic Proof'}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-emergency-light border border-emergency/20 text-emergency text-sm rounded-[var(--radius-xl)] flex items-center gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={cn(
              'p-6 bg-surface border-2 rounded-[var(--radius-xl)] shadow-md space-y-5',
              result.verified
                ? 'border-success/40 ring-1 ring-success/20'
                : 'border-emergency/40 ring-1 ring-emergency/20'
            )}
          >
            {/* Status Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    result.verified
                      ? 'bg-success-light text-success'
                      : 'bg-emergency-light text-emergency'
                  )}
                >
                  {result.verified ? (
                    <ShieldCheck className="w-7 h-7" />
                  ) : (
                    <ShieldAlert className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {result.verified
                      ? '✓ Cryptographically Verified'
                      : '❌ Verification Failed'}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {result.verified
                      ? 'HMAC-SHA256 digital signature is valid and untampered'
                      : result.reason || 'Digital signature check failed or credential expired'}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-full uppercase',
                  result.verified
                    ? 'bg-success-light text-success border border-success/30'
                    : 'bg-emergency-light text-emergency border border-emergency/30'
                )}
              >
                {result.status}
              </span>
            </div>

            {/* Credential Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {result.type && (
                <div className="p-3 bg-bg border border-border rounded-[var(--radius-md)]">
                  <span className="text-text-muted block">Credential Type:</span>
                  <span className="font-bold text-text-primary text-sm mt-0.5 block">
                    {result.type.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {result.subject && (
                <div className="p-3 bg-bg border border-border rounded-[var(--radius-md)]">
                  <span className="text-text-muted block">Subject DID:</span>
                  <span className="font-mono text-text-primary text-[11px] mt-0.5 block truncate">
                    {result.subject}
                  </span>
                </div>
              )}

              {result.issuer && (
                <div className="p-3 bg-bg border border-border rounded-[var(--radius-md)]">
                  <span className="text-text-muted block">Issuer DID:</span>
                  <span className="font-mono text-text-primary text-[11px] mt-0.5 block truncate">
                    {result.issuer}
                  </span>
                </div>
              )}

              {result.expires_at && (
                <div className="p-3 bg-bg border border-border rounded-[var(--radius-md)]">
                  <span className="text-text-muted block">Expiration Date:</span>
                  <span className="font-semibold text-text-primary text-xs mt-0.5 block">
                    {new Date(result.expires_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Audit Confirmation */}
            <div className="p-3 bg-action-light/50 border border-action/20 rounded-[var(--radius-md)] flex items-center justify-between text-xs text-action font-medium">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" /> This verification event has been recorded in the platform audit trail.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
