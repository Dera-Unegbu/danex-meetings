import { z } from 'zod';
import {
  DEVELOPMENT_CATEGORIES,
  type Briefing,
  type Confidence,
  type Development,
  type DevelopmentCategory,
  type Source,
} from './briefing-types';
import { isWithinWindow, type ResearchWindow } from './date-window';

export class BriefingParseError extends Error {}

const rawDevelopmentSchema = z.object({
  date: z.string().nullish(),
  category: z.string().nullish(),
  title: z.string().nullish(),
  detail: z.string().nullish(),
  source_url: z.string().nullish(),
  url: z.string().nullish(),
  u: z.string().nullish(),
  source_id: z.union([z.number(), z.string()]).nullish(),
  id: z.union([z.number(), z.string()]).nullish(),
  source_title: z.string().nullish(),
});

const rawBriefingSchema = z.object({
  executive_summary: z.string().optional(),
  summary: z.string().optional(),
  recent_developments: z.array(z.unknown()).nullish(),
  developments: z.array(z.unknown()).nullish(),
  useful_discussion_points: z.array(z.unknown()).nullish(),
  discussion_points: z.array(z.unknown()).nullish(),
  open_questions: z.array(z.unknown()).nullish(),
  confidence_score: z.string().nullish(),
  confidence: z.string().nullish(),
});

function extractJsonObject(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback to substring bracket extraction
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new BriefingParseError('The AI response did not contain a briefing.');
    }
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new BriefingParseError('The AI response could not be read as a briefing.');
    }
  }
}

function cleanStrings(values: unknown[] | null | undefined, limit: number): string[] {
  return (values ?? [])
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .slice(0, limit);
}

function normalizeCategory(value: string | null | undefined): DevelopmentCategory {
  const match = DEVELOPMENT_CATEGORIES.find(
    (category) => category.toLowerCase() === value?.trim().toLowerCase()
  );
  return match ?? 'Press';
}

function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/+$/, '');
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function parseDevelopments(
  values: unknown[] | null | undefined,
  sources: Source[],
  window: ResearchWindow
): Development[] {
  const developments = (values ?? []).flatMap((value): Development[] => {
    const parsed = rawDevelopmentSchema.safeParse(value);
    if (!parsed.success || !parsed.data.title?.trim()) return [];

    const rawUrl = parsed.data.source_url?.trim() || parsed.data.url?.trim() || parsed.data.u?.trim() || '';
    const rawId = parsed.data.source_id ?? parsed.data.id;

    // Match source by ID first, then fallback to normalized URL comparison
    let source: Source | undefined;
    if (rawId !== null && rawId !== undefined) {
      const numId = Number(rawId);
      source = sources.find((item) => item.id === numId);
    }
    if (!source && rawUrl) {
      source = sources.find((item) => normalizeUrl(item.url) === normalizeUrl(rawUrl));
    }

    const verifiedDate =
      source && isWithinWindow(source.publishedDate, window) ? source.publishedDate : null;

    return [
      {
        date: verifiedDate,
        category: normalizeCategory(parsed.data.category),
        title: parsed.data.title.trim(),
        detail: parsed.data.detail?.trim() ?? '',
        sourceUrl: source?.url ?? rawUrl,
        sourceTitle:
          parsed.data.source_title?.trim() || (source ? source.title : hostnameOf(rawUrl)),
      },
    ];
  });

  return developments.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

function normalizeConfidence(value: string | null | undefined, verifiedCount: number): Confidence {
  if (verifiedCount < 2) return 'Low';
  if (value === 'High' || value === 'Medium' || value === 'Low') return value;
  return 'Medium';
}

export function parseBriefing(content: string, sources: Source[], window: ResearchWindow): Briefing {
  const parsed = rawBriefingSchema.safeParse(extractJsonObject(content));
  if (!parsed.success) {
    throw new BriefingParseError('The AI response structure was invalid.');
  }

  const executiveSummary = (parsed.data.executive_summary || parsed.data.summary || '').trim();
  if (!executiveSummary) {
    throw new BriefingParseError('The AI response was missing the executive summary.');
  }

  const rawDevs = parsed.data.recent_developments ?? parsed.data.developments;
  const rawDiscussion = parsed.data.useful_discussion_points ?? parsed.data.discussion_points;
  const rawConfidence = parsed.data.confidence_score ?? parsed.data.confidence;

  const developments = parseDevelopments(rawDevs, sources, window);
  const verifiedCount = developments.filter((item) => item.date !== null).length;

  return {
    executiveSummary,
    developments,
    discussionPoints: cleanStrings(rawDiscussion, 3),
    openQuestions: cleanStrings(parsed.data.open_questions, 5),
    confidence: normalizeConfidence(rawConfidence, verifiedCount),
    sources,
  };
}

export function buildSources(
  results: Array<{ title: string; url: string; publishedDate: string | null }>,
  window: ResearchWindow
): Source[] {
  return results
    .filter(
      (result): result is typeof result & { publishedDate: string } =>
        result.publishedDate !== null && isWithinWindow(result.publishedDate, window)
    )
    .map((result, index) => ({
      id: index + 1,
      title: result.title || hostnameOf(result.url),
      url: result.url,
      publishedDate: result.publishedDate,
    }));
}