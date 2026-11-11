import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Confidence } from '@/lib/briefing-types';

const STYLES: Record<Confidence, { container: string; dot: string; label: string }> = {
  High: {
    container: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    label: 'High grounding',
  },
  Medium: {
    container: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    label: 'Medium grounding',
  },
  Low: {
    container: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]',
    label: 'Low grounding',
  },
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const style = STYLES[confidence];
  const Icon = confidence === 'High' ? ShieldCheck : ShieldAlert;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${style.container} print:border-slate-300 print:bg-white print:text-slate-700`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}
