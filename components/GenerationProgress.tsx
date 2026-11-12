import { CheckCircle2, Globe, Loader2, Sparkles } from 'lucide-react';
import type { BriefingStage } from '@/lib/briefing-generator';

const STEPS: Array<{ stage: BriefingStage; label: string; detail: string; icon: typeof Globe }> = [
  {
    stage: 'generating',
    label: 'Building your briefing',
    detail: 'Searching recent news and synthesizing a cited briefing.',
    icon: Sparkles,
  },
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
  const progress = stage === 'generating' ? 65 : stage === 'searching' ? 50 : 90;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-panel backdrop-blur-md print:hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-sky-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Building your briefing
          </p>
          <span className="font-mono text-[11px] tabular-nums text-slate-500">{progress}%</span>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Briefing generation progress"
          className="relative mt-4 h-2 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-inset ring-slate-700/40"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>

        <ol className="mt-8 space-y-6">
          {STEPS.map((step, index) => {
            const isDone = index < activeIndex;
            const isActive = index === activeIndex;
            const Icon = step.icon;
            return (
              <li
                key={step.stage}
                className={`flex items-start gap-4 transition-opacity duration-300 ${
                  !isActive && !isDone ? 'opacity-45' : 'opacity-100'
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : isActive
                        ? 'animate-pulse-ring border-sky-500/40 bg-sky-500/10 text-sky-400'
                        : 'border-slate-800 bg-slate-950/60 text-slate-500'
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
                <div className="min-w-0 pt-0.5">
                  <p
                    className={`text-base font-semibold tracking-tight ${
                      isDone ? 'text-slate-300' : isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      isActive ? 'animate-fade-in text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {step.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

const EMPTY_STATE_FEATURES = ['30-day search window', 'Dated citations', 'One-page dossier'];

export function EmptyBriefingState() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/40 px-8 py-20 text-center backdrop-blur-md print:hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl"
      />
      <div className="relative mb-6">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse-ring rounded-2xl"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400 shadow-glow-sm">
          <Sparkles className="h-7 w-7" aria-hidden="true" />
        </div>
      </div>
      <h2 className="relative text-2xl font-semibold tracking-tight text-white">
        Your briefing will appear here
      </h2>
      <p className="relative mt-2.5 max-w-md text-sm leading-relaxed text-slate-400">
        Enter a company or person, choose your meeting, and generate a one-page executive briefing
        built from dated, linked sources.
      </p>
      <div className="relative mt-7 flex flex-wrap items-center justify-center gap-2">
        {EMPTY_STATE_FEATURES.map((feature) => (
          <span
            key={feature}
            className="rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-400"
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}
