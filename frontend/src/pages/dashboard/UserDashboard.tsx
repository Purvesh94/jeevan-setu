import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Building2, Shield, FileCheck, History,
  Phone, ArrowRight, Clock, MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const stagger = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export function UserDashboard() {
  const { profile } = useAuth();
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Greeting */}
      <motion.div {...stagger} transition={{ delay: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-text-secondary mt-1">Your emergency dashboard — stay prepared</p>
      </motion.div>

      {/* Emergency SOS Card */}
      <motion.div {...stagger} transition={{ delay: 0.1 }}>
        <Link to="/emergency"
          className="group block p-6 bg-surface border-2 border-emergency/20 rounded-[var(--radius-xl)] hover:border-emergency/40 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[var(--radius-lg)] gradient-emergency flex items-center justify-center emergency-pulse">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emergency">EMERGENCY SOS</h2>
                <p className="text-sm text-text-secondary mt-0.5">Voice, photo, text — in any language</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-emergency opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </motion.div>

      {/* Quick Actions */}
      <motion.div {...stagger} transition={{ delay: 0.2 }}>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/hospitals', icon: Building2, label: 'Find Hospitals', color: 'text-action bg-action-light' },
            { to: '/credentials', icon: Shield, label: 'My Credentials', color: 'text-success bg-success-light' },
            { to: '/consent', icon: FileCheck, label: 'Consent', color: 'text-warning bg-warning-light' },
            { to: '/history', icon: History, label: 'History', color: 'text-text-secondary bg-bg' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-3 p-4 bg-surface border border-border rounded-[var(--radius-lg)] hover:shadow-card-hover hover:border-border-strong transition-all"
            >
              <div className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-text-primary">{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div {...stagger} transition={{ delay: 0.3 }}
          className="p-5 bg-surface border border-border rounded-[var(--radius-xl)]"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Recent Emergencies</h3>
          </div>
          <div className="text-center py-6">
            <p className="text-sm text-text-muted">No recent emergencies</p>
            <p className="text-xs text-text-muted mt-1">Your emergency history will appear here</p>
          </div>
        </motion.div>

        <motion.div {...stagger} transition={{ delay: 0.4 }}
          className="p-5 bg-surface border border-border rounded-[var(--radius-xl)]"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Nearby Hospitals</h3>
          </div>
          <div className="text-center py-6">
            <p className="text-sm text-text-muted">Enable location to see nearby hospitals</p>
            <Link to="/hospitals" className="inline-flex items-center gap-1 mt-2 text-sm text-action hover:text-action-dark">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Safety reminder */}
      <motion.div {...stagger} transition={{ delay: 0.5 }}
        className="flex items-center justify-between p-4 bg-emergency-light border border-emergency/10 rounded-[var(--radius-lg)]"
      >
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-emergency" />
          <div>
            <p className="text-sm font-medium text-text-primary">Emergency? Call 112</p>
            <p className="text-xs text-text-secondary">This platform does not replace emergency professionals</p>
          </div>
        </div>
        <a href="tel:112" className="px-4 py-2 text-sm font-semibold text-white bg-emergency rounded-[var(--radius-md)] hover:bg-emergency-dark transition-colors">
          CALL 112
        </a>
      </motion.div>
    </div>
  );
}
