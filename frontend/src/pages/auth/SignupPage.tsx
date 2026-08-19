import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
];

export function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhoneNum] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/\d/.test(pw)) return 'Password must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return 'Password must contain a special character';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await signUp(email, password, fullName, phone);
      navigate('/role-select');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="text-lg font-bold text-text-primary">JeevanSetu</span>
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-1">Create your account</h2>
        <p className="text-text-secondary mb-8">Join JeevanSetu to get emergency assistance</p>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-6 text-sm text-emergency bg-emergency-light border border-emergency/10 rounded-[var(--radius-md)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="tel" value={phone} onChange={(e) => setPhoneNum(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="Min 8 chars"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  placeholder="Confirm"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Preferred Language</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-2 focus:ring-action/20 transition-all appearance-none">
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div className="text-xs text-text-muted">
            Password: min 8 chars, 1 number, 1 special character
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 text-sm font-semibold text-white bg-action hover:bg-action-dark disabled:opacity-50 rounded-[var(--radius-md)] transition-colors">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-action font-medium hover:text-action-dark transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
