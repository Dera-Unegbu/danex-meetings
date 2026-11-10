import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Confidence } from '@/lib/briefing-types';

const STYLES: Record<Confidence, { container: string; dot: string; label: string }> = {
  High: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-500',
    label: 'High grounding',
  },
  Medium: {
    container: 'border-amber-200 bg-amber-50 text-amber-900',
    dot: 'bg-amber-500',
    label: 'Medium grounding',
  },
  Low: {
    container: 'border-rose-200 bg-rose-50 text-rose-800',
    dot: 'bg-rose-500',
    label: 'Low grounding',
  },
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const style = STYLES[confidence];
  const Icon = confidence === 'High' ? ShieldCheck : ShieldAlert;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${style.container}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}
