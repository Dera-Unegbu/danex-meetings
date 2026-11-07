import { CheckCircle2, Globe, Loader2, Sparkles } from 'lucide-react';
import type { BriefingStage } from '@/lib/briefing-generator';

const STEPS: Array<{ stage: BriefingStage; label: string; detail: string; icon: typeof Globe }> = [
  {
    stage: 'searching',
    label: 'Searching Tavily',
    detail: 'Scanning news, launches, hires and funding from the last 30 days.',
    icon: Globe,
  },
  {
    stage: 'synthesizing',
    label: 'Synthesizing with Bifrost',
    detail: 'Writing a cited, one-page briefing from verified sources.',
    icon: Sparkles,
  },
];

export function GenerationProgress({ stage }: { stage: BriefingStage }) {
  const activeIndex = STEPS.findIndex((step) => step.stage === stage);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Building your briefing</p>
      <ol className="mt-6 space-y-6">
        {STEPS.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          const Icon = step.icon;
          return (
            <li key={step.stage} className="flex items-start gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : isActive
                      ? 'border-teal-200 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
              <div>
                <p className={`text-base font-semibold ${isActive || isDone ? 'text-slate-900' : 'text-slate-500'}`}>
                  {step.label}
                </p>
                <p className="mt-1 text-sm text-slate-600">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function EmptyBriefingState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-20 text-center print:hidden">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Sparkles className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900">Your briefing will appear here</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        Enter a company or person, choose your meeting, and generate a one-page executive briefing built from dated, linked sources.
      </p>
    </div>
  );
}
