import { format } from 'date-fns';
import { formatDateKey, getResearchWindow, toDateKey } from './date-window';
import type { Briefing, BriefingMeta } from './briefing-types';

export function formatBriefingAsText(meta: BriefingMeta, briefing: Briefing): string {
  const researchWindow = getResearchWindow(meta.meetingAt);
  const lines: string[] = [
    `Pre-Meeting Briefing: ${meta.target}`,
    `${meta.meetingType} | ${format(meta.meetingAt, 'PPp')}`,
    `30-day search window: ${formatDateKey(researchWindow.startKey)} to ${formatDateKey(toDateKey(researchWindow.endDate))}`,
    `Confidence: ${briefing.confidence}`,
    '',
    'EXECUTIVE SUMMARY',
    briefing.executiveSummary,
    '',
    'RECENT DEVELOPMENTS',
    ...briefing.developments.map(
      (item) =>
        `- ${item.date ? formatDateKey(item.date) : 'Date Unverified'} [${item.category}] ${item.title}: ${item.detail}`
    ),
    '',
    'DISCUSSION POINTS',
    ...briefing.discussionPoints.map((point, index) => `${index + 1}. ${point}`),
    '',
    'STRATEGIC QUESTIONS',
    ...briefing.openQuestions.map((question, index) => `${index + 1}. ${question}`),
    '',
    'SOURCES',
    ...briefing.sources.map((source) => `[${source.id}] ${source.title} - ${source.url}`),
  ];
  return lines.join('\n');
}
