import { format } from 'date-fns';

const DAY_MS = 86_400_000;
export const RESEARCH_WINDOW_DAYS = 30;

export interface ResearchWindow {
  startKey: string;
  endKey: string;
  daysBack: number;
  startDate: Date;
  endDate: Date;
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getResearchWindow(meetingAt: Date, now: Date = new Date()): ResearchWindow {
  const startDate = new Date(meetingAt.getTime() - RESEARCH_WINDOW_DAYS * DAY_MS);
  const daysBack = Math.max(
    RESEARCH_WINDOW_DAYS,
    Math.ceil((now.getTime() - startDate.getTime()) / DAY_MS)
  );
  return {
    startKey: toDateKey(startDate),
    endKey: toDateKey(now),
    daysBack,
    startDate,
    endDate: now,
  };
}

export function normalizePublishedDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (isoMatch) return isoMatch[1];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : toDateKey(parsed);
}

export function isWithinWindow(dateKey: string, window: ResearchWindow): boolean {
  return dateKey >= window.startKey && dateKey <= window.endKey;
}

export function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return format(new Date(year, month - 1, day), 'MMM d, yyyy');
}
