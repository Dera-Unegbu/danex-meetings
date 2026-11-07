import { BifrostError, buildSystemPrompt, buildUserPayload, synthesizeBriefing } from './bifrost';
import { buildSources, BriefingParseError, parseBriefing } from './briefing-parser';
import type { Briefing, BriefingMeta } from './briefing-types';
import { getResearchWindow, toDateKey } from './date-window';
import { searchTavily, TavilyError } from './tavily';
import type { ApiKeys } from './settings-storage';

export type BriefingStage = 'searching' | 'synthesizing';

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
  const sources = buildSources(results, window);
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
      meetingDate: toDateKey(meta.meetingAt),
      todayKey: toDateKey(window.endDate),
      windowStartKey: window.startKey,
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
    return {
      title: error.status === 401 ? 'Bifrost Virtual Key rejected' : 'Synthesis failed',
      description: error.message,
    };
  }
  if (error instanceof BriefingParseError) {
    return { title: 'Briefing could not be read', description: 'Please generate the briefing again.' };
  }
  return { title: 'Something went wrong', description: 'The briefing could not be generated. Please try again.' };
}
