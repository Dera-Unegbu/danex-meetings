import { BifrostError, buildSystemPrompt, buildUserPayload, synthesizeBriefing } from './bifrost';
import { buildSources, BriefingParseError, parseBriefing } from './briefing-parser';
import type { Briefing, BriefingMeta } from './briefing-types';
import { getResearchWindow, toDateKey } from './date-window';
import { searchTavily, TavilyError } from './tavily';
import type { ApiKeys } from './settings-storage';

export type BriefingStage = 'searching' | 'synthesizing';

const MAX_SOURCES_FOR_MODEL = 5;

export class NoRecentNewsError extends Error {
  constructor() {
    super(
      'Tavily found no articles with verifiable dates in the 30 days before your meeting. Try a more specific name.'
    );
  }
}

export async function generateBriefing(
  meta: BriefingMeta,
  keys: ApiKeys,
  onStage: (stage: BriefingStage) => void
): Promise<Briefing> {
  const window = getResearchWindow(meta.meetingAt);

  onStage('searching');
  const results = await searchTavily(meta.target, keys.tavily, window.daysBack);
  const sources = buildSources(results, window).slice(0, MAX_SOURCES_FOR_MODEL);
  if (sources.length === 0) {
    throw new NoRecentNewsError();
  }

  const contentByUrl = new Map(results.map((result) => [result.url, result.content]));

  onStage('synthesizing');
  const content = await synthesizeBriefing({
    virtualKey: keys.bifrost,
    model: meta.model,
    systemPrompt: buildSystemPrompt(toDateKey(window.endDate)),
    userPayload: buildUserPayload({
      target: meta.target,
      meetingType: meta.meetingType,
      sources: sources.map((source) => ({
        ...source,
        content: contentByUrl.get(source.url) ?? '',
      })),
    }),
  });

  return parseBriefing(content, sources, window);
}

export function describeGenerationError(error: unknown): { title: string; description: string } {
  if (error instanceof NoRecentNewsError) {
    return { title: 'No recent articles found', description: error.message };
  }
  if (error instanceof TavilyError) {
    return { title: 'Tavily search failed', description: error.message };
  }
  if (error instanceof BifrostError) {
    if (error.status === 401) {
      return { title: 'Bifrost Virtual Key rejected', description: error.message };
    }
    if (error.status === 402) {
      return { title: 'Virtual Key credit limit reached', description: error.message };
    }
    if (error.status === 429) {
      return { title: 'Rate limit exceeded', description: error.message };
    }
    if (error.status !== null && error.status >= 500) {
      return { title: 'AI Model Service Unavailable', description: error.message };
    }
    return {
      title: 'Synthesis failed',
      description: error.message,
    };
  }
  if (error instanceof BriefingParseError) {
    return { title: 'Briefing could not be read', description: 'Please generate the briefing again.' };
  }
  return { title: 'Something went wrong', description: 'The briefing could not be generated. Please try again.' };
}