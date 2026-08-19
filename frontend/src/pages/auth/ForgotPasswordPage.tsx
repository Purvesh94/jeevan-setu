import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="text-lg font-bold text-text-primary">JeevanSetu</span>
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-1">Reset password</h2>
        <p className="text-text-secondary mb-8">Enter your email and we'll send you a reset link</p>

        {sent ? (
          <div className="flex items-center gap-3 p-4 bg-success-light border border-success/10 rounded-[var(--radius-md)]">
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-primary">Reset link sent!</p>
              <p className="text-sm text-text-secondary mt-0.5">Check your email for the password reset link.</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-2 p-3 mb-6 text-sm text-emergency bg-emergency-light rounded-[var(--radius-md)]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 text-sm font-semibold text-white bg-action hover:bg-action-dark disabled:opacity-50 rounded-[var(--radius-md)] transition-colors">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Remember your password?{' '}
          <Link to="/login" className="text-action font-medium hover:text-action-dark transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
