import { History } from 'lucide-react';

export function EmergencyHistoryPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 mb-6">
        <History className="w-6 h-6 text-text-secondary" />
        Emergency History
      </h1>
      <div className="p-8 bg-surface border border-border rounded-[var(--radius-xl)] text-center">
        <History className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary">No emergency history yet</p>
        <p className="text-sm text-text-muted mt-1">Your past emergencies will appear here</p>
      </div>
    </div>
  );
}
