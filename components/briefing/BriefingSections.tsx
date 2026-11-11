import { Badge } from '@/components/ui/badge';
import {
  Banknote,
  ExternalLink,
  Handshake,
  Newspaper,
  Rocket,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type {
  Confidence,
  Development,
  DevelopmentCategory,
  Source,
} from '@/lib/briefing-types';
import { formatDateKey } from '@/lib/date-window';
import { CitedText } from './CitedText';
import { ConfidenceBadge } from './ConfidenceBadge';

const PRINT_BADGE = 'print:border-slate-300 print:bg-white print:text-slate-700';

export function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="h-4 w-1 rounded-full bg-gradient-to-b from-sky-400 to-indigo-500 print:bg-slate-400"
        />
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 print:text-slate-600">
          {title}
        </h3>
      </div>
      {detail && (
        <span className="font-mono text-[11px] text-slate-500 print:text-slate-600">{detail}</span>
      )}
    </div>
  );
}

export function SummarySection({
  summary,
  confidence,
}: {
  summary: string;
  confidence: Confidence;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40 p-6 print:border-slate-300 print:bg-white">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 to-indigo-500 print:hidden"
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 print:text-slate-600">
          Executive Summary
        </h3>
        <ConfidenceBadge confidence={confidence} />
      </div>
      <p className="text-base leading-[1.75] text-slate-200 print:text-slate-800">
        <CitedText text={summary} />
      </p>
    </section>
  );
}

const CATEGORY_STYLES: Record<DevelopmentCategory, { icon: LucideIcon; className: string }> = {
  Launch: { icon: Rocket, className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' },
  Hire: { icon: UserPlus, className: 'border-sky-500/20 bg-sky-500/10 text-sky-400' },
  Funding: { icon: Banknote, className: 'border-amber-500/20 bg-amber-500/10 text-amber-400' },
  Partnership: { icon: Handshake, className: 'border-purple-500/20 bg-purple-500/10 text-purple-400' },
  Press: { icon: Newspaper, className: 'border-rose-500/20 bg-rose-500/10 text-rose-400' },
};

function CategoryBadge({ category }: { category: DevelopmentCategory }) {
  const style = CATEGORY_STYLES[category];
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style.className} ${PRINT_BADGE}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {category}
    </span>
  );
}

function DateLabel({ date }: { date: string | null }) {
  if (!date) {
    return (
      <Badge
        variant="outline"
        className={`border-slate-700 font-mono text-[10px] uppercase tracking-wide text-slate-400 ${PRINT_BADGE}`}
      >
        Date Unverified
      </Badge>
    );
  }
  return (
    <time
      dateTime={date}
      className="font-mono text-xs font-medium uppercase tracking-wide text-slate-400 print:text-slate-600"
    >
      {formatDateKey(date)}
    </time>
  );
}

export function TimelineSection({ developments }: { developments: Development[] }) {
  return (
    <section>
      <SectionHeading title="Recent Developments" detail={`${developments.length} items`} />
      <ol className="relative space-y-4 before:absolute before:inset-y-2 before:left-[7px] before:w-px before:bg-gradient-to-b before:from-sky-500/50 before:via-slate-700 before:to-transparent print:before:hidden">
        {developments.map((item, index) => (
          <li key={`${item.title}-${index}`} className="relative pl-8 print:break-inside-avoid">
            <span
              className="absolute left-0 top-5 h-[15px] w-[15px] rounded-full border-2 border-slate-950 bg-sky-400 shadow-[0_0_0_3px_rgba(56,189,248,0.15)] print:hidden"
              aria-hidden="true"
            />
            <div className="group rounded-2xl border border-slate-800/70 bg-slate-950/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700/90 hover:bg-slate-900/70 hover:shadow-lg hover:shadow-sky-950/40 print:border-0 print:bg-white print:p-0 print:shadow-none">
              <div className="flex flex-wrap items-center gap-2">
                <DateLabel date={item.date} />
                <CategoryBadge category={item.category} />
              </div>
              <h4 className="mt-2.5 text-base font-semibold tracking-tight text-white print:text-black">
                {item.title}
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400 print:text-slate-700">
                <CitedText text={item.detail} />
              </p>
              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-400 underline-offset-4 transition-colors hover:text-sky-300 hover:underline print:text-slate-700"
                >
                  {item.sourceTitle || item.sourceUrl}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
      {developments.length < 4 && (
        <p className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-300/90 print:border-slate-300 print:bg-white print:text-slate-700">
          Fewer than four developments could be dated within the 30-day window, so coverage is
          limited.
        </p>
      )}
    </section>
  );
}

export function InsightsSection({
  discussionPoints,
  openQuestions,
}: {
  discussionPoints: string[];
  openQuestions: string[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-6 print:border-slate-300 print:bg-white">
        <SectionHeading title="Discussion Points" />
        <ul className="space-y-4">
          {discussionPoints.map((point, index) => (
            <li
              key={index}
              className="flex gap-3 text-sm leading-relaxed text-slate-300 print:text-slate-800"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 font-mono text-xs font-semibold text-sky-400 print:border-slate-300 print:bg-white print:text-slate-700">
                {index + 1}
              </span>
              <span>
                <CitedText text={point} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-6 print:border-slate-300 print:bg-white">
        <SectionHeading title="Strategic Questions" />
        <ol className="space-y-3">
          {openQuestions.map((question, index) => (
            <li
              key={index}
              className="flex gap-3 text-sm leading-relaxed text-slate-300 print:text-slate-800"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 font-mono text-xs font-semibold text-slate-300 print:border-slate-300 print:bg-white print:text-slate-700">
                {index + 1}
              </span>
              <span>{question}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function SourcesSection({ sources }: { sources: Source[] }) {
  return (
    <footer className="border-t border-slate-800/70 pt-6 print:border-slate-300">
      <SectionHeading title="Verified Sources" detail={`${sources.length} references`} />
      <ol className="grid gap-3 sm:grid-cols-2">
        {sources.map((source) => (
          <li
            key={source.id}
            id={`source-${source.id}`}
            className="scroll-mt-28 rounded-xl border border-slate-800/70 bg-slate-950/30 p-3.5 transition-colors hover:border-slate-700 hover:bg-slate-900/60 target:border-sky-500/50 target:bg-sky-500/10 print:border-slate-200 print:bg-white"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-md border border-slate-700/70 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sky-400 print:border-slate-300 print:bg-white print:text-slate-700">
                [{source.id}]
              </span>
              <div className="min-w-0">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-medium text-slate-200 underline-offset-4 transition-colors hover:text-sky-300 hover:underline print:text-slate-800"
                >
                  {source.title}
                </a>
                <p className="truncate font-mono text-[11px] text-slate-500 print:text-slate-600">
                  {formatDateKey(source.publishedDate)} | {source.url}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </footer>
  );
}
