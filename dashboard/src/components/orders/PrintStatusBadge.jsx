import { Printer, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const KOT_CONFIG = {
  pending:  { label: 'Sending to printer...', classes: 'bg-cream-100 text-ink-500 border-ink-200', icon: Loader2, spin: true },
  printing: { label: 'Printing...',            classes: 'bg-blue-50 text-blue-700 border-blue-200', icon: Loader2, spin: true },
  printed:  { label: 'KOT Printed',            classes: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  failed:   { label: 'Print Failed',           classes: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
};

// Shows the live status of the automatic kitchen-ticket print for this order,
// with a manual retry action when the local print agent reported a failure.
const PrintStatusBadge = ({ kot, onRetry, isRetrying }) => {
  if (!kot || !kot.status || kot.status === 'not_required') return null;

  const config = KOT_CONFIG[kot.status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        title={kot.status === 'failed' ? kot.lastError || 'Printing failed' : undefined}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold text-xs ${config.classes}`}
      >
        <Icon size={12} className={config.spin ? 'animate-spin' : ''} />
        {config.label}
      </span>
      {kot.status === 'failed' && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50 transition-colors"
        >
          <Printer size={12} />
          {isRetrying ? 'Retrying...' : 'Retry Print'}
        </button>
      )}
    </div>
  );
};

export default PrintStatusBadge;
