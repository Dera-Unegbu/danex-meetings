import { z } from 'zod';
import type { GatewayModel, MeetingType } from './briefing-types';

const BIFROST_ENDPOINT = 'https://bifrost-production-09f1.up.railway.app/v1/chat/completions';

export class BifrostError extends Error {
  constructor(
    message: string,
    readonly status: number | null
  ) {
    super(message);
  }
}

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

export function buildSystemPrompt(todayKey: string): string {
  return `You are Danex Pre-Meeting Intelligence, an executive research agent.
Analyze the provided web search results and produce a structured, one-page pre-meeting briefing.

STRICT CONSTRAINTS:
1. Executive Summary MUST contain EXACTLY 5 detailed sentences covering:
   - Sentence 1: Target company/person identity and primary business domain.
   - Sentence 2: Key strategic focus or market positioning over the past 30 days.
   - Sentence 3: Major verified milestone or product/leadership development.
   - Sentence 4: Current market challenge, opportunity, or competitive landscape posture.
   - Sentence 5: Recommended core objective/angle for the upcoming meeting.

2. Recent Developments Timeline MUST include AT LEAST 4 significant events with exact dates from the preceding 30 days. No dates can exceed today's date (${todayKey}). Use ONLY the "published_date" of the cited source as the event date. If a source has no published_date, do not include it as a development.

3. Open Questions MUST contain EXACTLY 5 high-impact, strategic questions tailored to the meeting type.

4. Talking Points MUST contain EXACTLY 3 tailored context snippets.

5. Include numerical citations ([1], [2]) for all factual assertions, bound to the provided source ids. Never invent a source or a URL.

Return ONLY a raw valid JSON object matching this schema. Do not include markdown formatting:
{
  "executive_summary": "5-sentence summary text here...",
  "recent_developments": [
    {
      "date": "YYYY-MM-DD",
      "category": "Launch | Hire | Funding | Partnership | Press",
      "title": "Headline",
      "detail": "Description with citation [1]",
      "source_url": "https://...",
      "source_title": "Publisher Name"
    }
  ],
  "useful_discussion_points": ["Talking point 1 [1]", "Talking point 2 [2]", "Talking point 3 [3]"],
  "open_questions": ["Strategic Question 1?", "Strategic Question 2?", "Strategic Question 3?", "Strategic Question 4?", "Strategic Question 5?"],
  "confidence_score": "High | Medium | Low"
}`;
}

export function buildUserPayload(input: {
  target: string;
  meetingType: MeetingType;
  meetingDate: string;
  todayKey: string;
  windowStartKey: string;
  sources: Array<{ id: number; title: string; url: string; publishedDate: string; content: string }>;
}): string {
  return JSON.stringify({
    target_name: input.target,
    meeting_type: input.meetingType,
    meeting_date: input.meetingDate,
    current_date: input.todayKey,
    research_window: { start: input.windowStartKey, end: input.todayKey },
    sources: input.sources.map((source) => ({
      id: source.id,
      title: source.title,
      url: source.url,
      published_date: source.publishedDate,
      excerpt: source.content.slice(0, 800),
    })),
  });
}

export async function synthesizeBriefing(input: {
  virtualKey: string;
  model: GatewayModel;
  systemPrompt: string;
  userPayload: string;
}): Promise<string> {
  let response: Response;
  try {
    response = await fetch(BIFROST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.virtualKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: input.userPayload },
        ],
      }),
    });
  } catch {
    throw new BifrostError('Could not reach Bifrost. Check your connection and try again.', null);
  }

  if (response.status === 401) {
    throw new BifrostError('Bifrost rejected your Virtual Key. Update it in Settings.', 401);
  }
  if (!response.ok) {
    throw new BifrostError(`Bifrost returned an error (${response.status}).`, response.status);
  }

  const parsed = completionSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new BifrostError('Bifrost returned an unexpected response.', response.status);
  }
  return parsed.data.choices[0].message.content;
}
