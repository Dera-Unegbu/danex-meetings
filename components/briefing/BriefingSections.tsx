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

export function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {detail && <span className="text-xs text-slate-500">{detail}</span>}
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
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Executive Summary
        </h3>
        <ConfidenceBadge confidence={confidence} />
      </div>
      <p className="text-base leading-[1.6] text-slate-800">
        <CitedText text={summary} />
      </p>
    </section>
  );
}

const CATEGORY_STYLES: Record<DevelopmentCategory, { icon: LucideIcon; className: string }> = {
  Launch: { icon: Rocket, className: 'border-sky-200 bg-sky-50 text-sky-800' },
  Hire: { icon: UserPlus, className: 'border-orange-200 bg-orange-50 text-orange-800' },
  Funding: { icon: Banknote, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  Partnership: { icon: Handshake, className: 'border-teal-200 bg-teal-50 text-teal-800' },
  Press: { icon: Newspaper, className: 'border-slate-200 bg-white text-slate-700' },
};

function CategoryBadge({ category }: { category: DevelopmentCategory }) {
  const style = CATEGORY_STYLES[category];
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {category}
    </span>
  );
}

function DateLabel({ date }: { date: string | null }) {
  if (!date) {
    return (
      <Badge variant="outline" className="border-slate-300 text-slate-600">
        Date Unverified
      </Badge>
    );
  }
  return <time dateTime={date} className="text-sm font-medium text-slate-700">{formatDateKey(date)}</time>;
}

export function TimelineSection({ developments }: { developments: Development[] }) {
  return (
    <section>
      <SectionHeading title="Recent Developments" detail={`${developments.length} items`} />
      <ol className="ml-2 border-l-2 border-slate-200">
        {developments.map((item, index) => (
          <li key={`${item.title}-${index}`} className="relative pb-8 pl-8 last:pb-0">
            <span
              className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-teal-600 ring-1 ring-teal-200"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center gap-2">
              <DateLabel date={item.date} />
              <CategoryBadge category={item.category} />
            </div>
            <h4 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              <CitedText text={item.detail} />
            </p>
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal-700 underline-offset-4 hover:underline"
              >
                {item.sourceTitle || item.sourceUrl}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ol>
      {developments.length < 4 && (
        <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Fewer than four developments could be dated within the 30-day window, so coverage is limited.
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
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <SectionHeading title="Discussion Points" />
        <ul className="space-y-4">
          {discussionPoints.map((point, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed text-slate-700">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-600 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <span>
                <CitedText text={point} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <SectionHeading title="Strategic Questions" />
        <ol className="space-y-3">
          {openQuestions.map((question, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed text-slate-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-700">
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
    <footer className="border-t border-slate-200 pt-6">
      <SectionHeading title="Verified Sources" detail={`${sources.length} references`} />
      <ol className="grid gap-3 sm:grid-cols-2">
        {sources.map((source) => (
          <li
            key={source.id}
            id={`source-${source.id}`}
            className="scroll-mt-24 rounded-lg border border-slate-200 p-3 transition-colors target:border-teal-400 target:bg-teal-50/50"
          >
            <div className="flex items-start gap-3">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                [{source.id}]
              </span>
              <div className="min-w-0">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-medium text-teal-800 underline-offset-4 hover:underline"
                >
                  {source.title}
                </a>
                <p className="truncate text-xs text-slate-500">
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
