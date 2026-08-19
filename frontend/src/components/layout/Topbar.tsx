import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { profile } = useAuth();

  return (
    <header className="flex items-center h-16 px-4 md:px-6 bg-surface border-b border-border flex-shrink-0">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 mr-2 rounded-[var(--radius-sm)] hover:bg-bg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-text-secondary" />
      </button>

      {/* Search (placeholder) */}
      <div className="hidden md:flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search emergencies, hospitals..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action focus:ring-1 focus:ring-action/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 md:hidden" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-[var(--radius-sm)] hover:bg-bg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emergency rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-border">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white",
            profile?.role === 'ADMIN' ? "bg-navy" :
            profile?.role === 'MEDICAL_AFFILIATE' ? "bg-action" :
            "bg-action"
          )}>
            {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-text-primary leading-tight">
              {profile?.full_name || profile?.email || 'User'}
            </p>
            <p className="text-xs text-text-muted leading-tight">
              {profile?.role === 'MEDICAL_AFFILIATE' ? 'Medical Affiliate' :
               profile?.role === 'ADMIN' ? 'Administrator' : 'User'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
