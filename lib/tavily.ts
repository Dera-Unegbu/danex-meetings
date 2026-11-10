import { z } from 'zod';
import { normalizePublishedDate } from './date-window';

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';
const PRIORITY_DOMAINS = [
  'prnewswire.com',
  'businesswire.com',
  'bloomberg.com',
  'techcrunch.com',
  'reuters.com',
];

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  publishedDate: string | null;
}

export class TavilyError extends Error {
  constructor(
    message: string,
    readonly status: number | null
  ) {
    super(message);
  }
}

const resultSchema = z.object({
  title: z.string().nullish(),
  url: z.string().url(),
  content: z.string().nullish(),
  published_date: z.string().nullish(),
});

const responseSchema = z.object({
  results: z.array(z.unknown()).default([]),
});

async function runSearch(
  body: Record<string, unknown>,
  apiKey: string
): Promise<TavilyResult[]> {
  let response: Response;
  try {
    response = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        search_depth: 'advanced',
        include_answer: true,
        max_results: 7,
        topic: 'news',
        ...body,
      }),
    });
  } catch {
    throw new TavilyError('Could not reach Tavily. Check your connection and try again.', null);
  }

  if (response.status === 401 || response.status === 403) {
    throw new TavilyError('Tavily rejected your API key. Update it in Settings.', response.status);
  }
  if (!response.ok) {
    throw new TavilyError(`Tavily search failed (${response.status}).`, response.status);
  }

  const parsed = responseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new TavilyError('Tavily returned an unexpected response.', response.status);
  }

  return parsed.data.results.flatMap((item) => {
    const result = resultSchema.safeParse(item);
    if (!result.success) return [];
    return [
      {
        title: result.data.title?.trim() || '',
        url: result.data.url,
        content: result.data.content?.trim() || '',
        publishedDate: normalizePublishedDate(result.data.published_date),
      },
    ];
  });
}

export async function searchTavily(
  target: string,
  apiKey: string,
  daysBack: number
): Promise<TavilyResult[]> {
  const [general, publisher] = await Promise.all([
    runSearch(
      {
        query: `${target} (news OR launches OR hires OR announcements OR funding) past 30 days`,
        days: daysBack,
      },
      apiKey
    ),
    runSearch(
      {
        query: `${target} announcements press release launches hires funding`,
        days: daysBack,
        include_domains: PRIORITY_DOMAINS,
      },
      apiKey
    ),
  ]);

  const seen = new Set<string>();
  return [...general, ...publisher].filter((result) => {
    if (seen.has(result.url)) return false;
    seen.add(result.url);
    return true;
  });
}
