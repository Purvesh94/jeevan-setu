import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, AlertTriangle, Building2, Map, Shield,
  FileCheck, History, User, Settings, LogOut, Phone,
  ChevronLeft, Activity, FileSearch, ClipboardList,
  Users, Building, Bell, BarChart3, Stethoscope, X,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

const userNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/emergency', icon: AlertTriangle, label: 'Emergency SOS' },
  { to: '/hospitals', icon: Building2, label: 'Hospitals' },
  { to: '/map', icon: Map, label: 'Emergency Map' },
  { to: '/credentials', icon: Shield, label: 'My Credentials' },
  { to: '/consent', icon: FileCheck, label: 'Consent' },
  { to: '/history', icon: History, label: 'Emergency History' },
  { to: '/profile', icon: User, label: 'My Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const affiliateNav: NavItem[] = [
  { to: '/affiliate/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/affiliate/emergencies', icon: Activity, label: 'Active Emergencies' },
  { to: '/map', icon: Map, label: 'Emergency Map' },
  { to: '/hospitals', icon: Building2, label: 'Hospitals' },
  { to: '/affiliate/verification', icon: FileSearch, label: 'Credential Verification' },
  { to: '/affiliate/audit', icon: ClipboardList, label: 'Audit Logs' },
  { to: '/profile', icon: Building, label: 'Organization Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const adminNav: NavItem[] = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/affiliates', icon: Stethoscope, label: 'Medical Affiliates' },
  { to: '/admin/hospitals', icon: Building2, label: 'Hospitals' },
  { to: '/admin/emergencies', icon: AlertTriangle, label: 'Emergencies' },
  { to: '/admin/audit', icon: ClipboardList, label: 'Audit Logs' },
  { to: '/settings', icon: Settings, label: 'System Settings' },
];

export function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role || 'USER';

  const navItems = role === 'ADMIN' ? adminNav : role === 'MEDICAL_AFFILIATE' ? affiliateNav : userNav;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-white/10">
          <Heart className="w-5 h-5 text-emergency" fill="currentColor" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-base font-bold text-white tracking-tight">JeevanSetu</h1>
              {role === 'MEDICAL_AFFILIATE' && (
                <p className="text-[10px] text-white/50 -mt-0.5">Medical Response Center</p>
              )}
              {role === 'ADMIN' && (
                <p className="text-[10px] text-white/50 -mt-0.5">Admin Panel</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="ml-auto lg:hidden p-1 rounded-[var(--radius-sm)] hover:bg-white/10 text-white/60"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Desktop collapse */}
        <button
          onClick={onToggle}
          className="ml-auto hidden lg:flex p-1 rounded-[var(--radius-sm)] hover:bg-white/10 text-white/60 transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              )
            }
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {item.badge && !collapsed && (
              <span className="ml-auto text-xs bg-emergency text-white px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-white/10 space-y-1">
        {/* Emergency call */}
        {role !== 'ADMIN' && (
          <a
            href="tel:112"
            className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-emergency bg-emergency/10 hover:bg-emergency/20 transition-colors"
          >
            <Phone className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  CALL 112
                </motion.span>
              )}
            </AnimatePresence>
          </a>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-white/50 hover:text-white hover:bg-white/8 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col bg-navy h-screen flex-shrink-0 sidebar-transition"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-y-0 left-0 z-50 w-[260px] bg-navy lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
