import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, User, Stethoscope, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

export function RoleSelectPage() {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setRole, profile } = useAuth();
  const navigate = useNavigate();

  // If already has role, redirect
  if (profile?.role) {
    const dest = profile.role === 'ADMIN' ? '/admin/dashboard' : profile.role === 'MEDICAL_AFFILIATE' ? '/affiliate/dashboard' : '/dashboard';
    navigate(dest, { replace: true });
    return null;
  }

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      await setRole(selected);
      navigate(selected === 'MEDICAL_AFFILIATE' ? '/affiliate/dashboard' : '/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="text-lg font-bold text-text-primary">JeevanSetu</span>
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-1">What describes you best?</h2>
        <p className="text-text-secondary mb-8">This helps us personalize your experience</p>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-6 text-sm text-emergency bg-emergency-light rounded-[var(--radius-md)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => setSelected('USER')}
            className={`w-full p-5 text-left rounded-[var(--radius-xl)] border-2 transition-all ${
              selected === 'USER' ? 'border-action bg-action-light shadow-md' : 'border-border bg-surface hover:border-border-strong'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center ${selected === 'USER' ? 'bg-action text-white' : 'bg-bg text-text-secondary'}`}>
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">I need emergency help</h3>
                <p className="text-sm text-text-secondary mt-1">Report emergencies, find hospitals, manage medical credentials</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelected('MEDICAL_AFFILIATE')}
            className={`w-full p-5 text-left rounded-[var(--radius-xl)] border-2 transition-all ${
              selected === 'MEDICAL_AFFILIATE' ? 'border-action bg-action-light shadow-md' : 'border-border bg-surface hover:border-border-strong'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center ${selected === 'MEDICAL_AFFILIATE' ? 'bg-action text-white' : 'bg-bg text-text-secondary'}`}>
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">Medical Affiliate</h3>
                <p className="text-sm text-text-secondary mt-1">Respond to emergencies, verify credentials, coordinate medical response</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full mt-6 py-3 text-sm font-semibold text-white bg-action hover:bg-action-dark disabled:opacity-40 rounded-[var(--radius-md)] transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Setting up...' : 'Continue'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </motion.div>
    </div>
  );
}
