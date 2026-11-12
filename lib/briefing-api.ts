import { z } from 'zod';
import { DEVELOPMENT_CATEGORIES, type Briefing, type BriefingMeta } from './briefing-types';

export interface UsageSummary {
  used: number;
  limit: number;
  remaining: number;
}

export class BriefingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

const apiResponseSchema = z.object({
  briefing: z.object({
    executiveSummary: z.string(),
    developments: z.array(
      z.object({
        date: z.string().nullable(),
        category: z.enum(DEVELOPMENT_CATEGORIES),
        title: z.string(),
        detail: z.string(),
        sourceUrl: z.string(),
        sourceTitle: z.string(),
      })
    ),
    discussionPoints: z.array(z.string()),
    openQuestions: z.array(z.string()),
    confidence: z.enum(['High', 'Medium', 'Low']),
    sources: z.array(
      z.object({
        id: z.number(),
        title: z.string(),
        url: z.string(),
        publishedDate: z.string(),
      })
    ),
  }),
  usage: z.object({
    used: z.number(),
    limit: z.number(),
    remaining: z.number(),
  }),
});

const usageResponseSchema = z.object({
  usage: z.object({
    used: z.number(),
    limit: z.number(),
    remaining: z.number(),
  }),
});

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new BriefingApiError('The server returned an invalid response. Please try again.', response.status);
  }
}

async function throwApiError(response: Response): Promise<never> {
  const body = await readJson(response);
  const parsed = z
    .object({ error: z.string(), code: z.string().optional() })
    .safeParse(body);
  throw new BriefingApiError(
    parsed.success ? parsed.data.error : 'The request could not be completed. Please try again.',
    response.status,
    parsed.success ? parsed.data.code : undefined
  );
}

export async function requestBriefing(
  meta: BriefingMeta,
  accessToken: string
): Promise<{ briefing: Briefing; usage: UsageSummary }> {
  let response: Response;
  try {
    response = await fetch('/.netlify/functions/briefing-api', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...meta, meetingAt: meta.meetingAt.toISOString() }),
    });
  } catch {
    throw new BriefingApiError('Could not reach the briefing service. Check your connection and try again.', 0);
  }

  if (!response.ok) return throwApiError(response);
  const parsed = apiResponseSchema.safeParse(await readJson(response));
  if (!parsed.success) {
    throw new BriefingApiError('The briefing service returned an unexpected response.', response.status);
  }
  return parsed.data;
}

export async function getBriefingUsage(accessToken: string): Promise<UsageSummary> {
  let response: Response;
  try {
    response = await fetch('/.netlify/functions/briefing-api', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
  } catch {
    throw new BriefingApiError('Could not load usage. Check your connection and try again.', 0);
  }

  if (!response.ok) return throwApiError(response);
  const parsed = usageResponseSchema.safeParse(await readJson(response));
  if (!parsed.success) {
    throw new BriefingApiError('The usage service returned an unexpected response.', response.status);
  }
  return parsed.data.usage;
}
