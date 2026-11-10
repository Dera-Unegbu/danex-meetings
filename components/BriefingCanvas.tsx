'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, Clock, Copy, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Briefing, BriefingMeta } from '@/lib/briefing-types';
import { formatBriefingAsText } from '@/lib/briefing-text';
import { formatDateKey, getResearchWindow, toDateKey } from '@/lib/date-window';
import {
  InsightsSection,
  SourcesSection,
  SummarySection,
  TimelineSection,
} from './briefing/BriefingSections';

interface BriefingCanvasProps {
  meta: BriefingMeta;
  briefing: Briefing;
}

export function BriefingCanvas({ meta, briefing }: BriefingCanvasProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const researchWindow = getResearchWindow(meta.meetingAt);
  const windowLabel = `${formatDateKey(researchWindow.startKey)} to ${formatDateKey(toDateKey(researchWindow.endDate))}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatBriefingAsText(meta, briefing));
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied to clipboard', description: 'The briefing is ready to paste.' });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Your browser blocked clipboard access. Try Export to PDF instead.',
        variant: 'destructive',
      });
    }
  }

  return (
    <article
      id="briefing-canvas"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none"
    >
      <header className="border-b border-slate-200 bg-white px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Pre-Meeting Briefing
            </p>
            <h2 className="mt-2 break-words text-3xl font-semibold leading-[1.2] tracking-tight text-slate-900 sm:text-4xl">
              {meta.target}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
              <Badge className="border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-50">
                {meta.meetingType}
              </Badge>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(meta.meetingAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>
                  <span className="font-medium text-slate-700">30-Day Search Window:</span> {windowLabel}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Copy to Clipboard'}
            </Button>
            <Button
              onClick={() => window.print()}
              className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Export to PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-10 px-6 py-8 sm:px-8">
        <SummarySection summary={briefing.executiveSummary} confidence={briefing.confidence} />
        <TimelineSection developments={briefing.developments} />
        <InsightsSection
          discussionPoints={briefing.discussionPoints}
          openQuestions={briefing.openQuestions}
        />
        <SourcesSection sources={briefing.sources} />
      </div>
    </article>
  );
}
