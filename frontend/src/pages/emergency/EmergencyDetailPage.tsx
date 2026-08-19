import { useParams } from 'react-router-dom';
import { AlertTriangle, MapPin, Clock, Phone, CheckCircle2 } from 'lucide-react';

export function EmergencyDetailPage() {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-emergency" />
          Emergency Details
        </h1>
        <a href="tel:112" className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emergency rounded-[var(--radius-md)]">
          <Phone className="w-4 h-4" /> 112
        </a>
      </div>

      <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="badge-critical px-3 py-1 rounded-full text-xs font-semibold">EMERGENCY</span>
          <span className="text-sm text-text-muted">ID: {id?.slice(0, 8)}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="w-4 h-4" /> Just created
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin className="w-4 h-4" /> Location detected
          </div>
        </div>

        <div className="mt-6 p-4 bg-success-light rounded-[var(--radius-md)]">
          <p className="text-sm font-medium text-success flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Emergency submitted. Awaiting response from medical affiliates.
          </p>
        </div>
      </div>
    </div>
  );
}
