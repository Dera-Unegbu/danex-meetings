import { z } from 'zod';
import type { GatewayModel, MeetingType } from './briefing-types';

const BIFROST_ENDPOINT = 'https://bifrost-production-09f1.up.railway.app/v1/chat/completions';
const MAX_OUTPUT_TOKENS = 3000;
const EXCERPT_CHARS = 120;

const messageContentSchema = z.union([
  z.string(),
  z.array(z.object({ text: z.string().optional() }).passthrough()).transform((parts) =>
    parts.flatMap((part) => (part.text ? [part.text] : [])).join('')
  ),
]);

export class BifrostError extends Error {
  constructor(
    message: string,
    readonly status: number | null
  ) {
    super(message);
  }
}

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: messageContentSchema }) })).min(1),
});

function describeResponseShape(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return typeof value;
  }

  const record = value as Record<string, unknown>;
  const topLevelKeys = Object.keys(record);
  const choices = record.choices;
  const firstChoice =
    Array.isArray(choices) && choices.length > 0 && typeof choices[0] === 'object' && choices[0] !== null
      ? (choices[0] as Record<string, unknown>)
      : null;
  const message =
    firstChoice?.message && typeof firstChoice.message === 'object'
      ? (firstChoice.message as Record<string, unknown>)
      : null;
  const content = message?.content;

  return [
    `top-level keys: ${topLevelKeys.join(', ') || '(none)'}`,
    `choices: ${Array.isArray(choices) ? `${choices.length} item(s)` : typeof choices}`,
    firstChoice ? `first choice keys: ${Object.keys(firstChoice).join(', ') || '(none)'}` : null,
    message ? `message keys: ${Object.keys(message).join(', ') || '(none)'}` : null,
    message ? `content: ${Array.isArray(content) ? 'array' : typeof content}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join('; ');
}

export function buildSystemPrompt(todayKey: string): string {
  return `Pre-meeting intelligence bot. Return raw JSON ONLY (no markdown).
Rules:
- summary: 5 sentences (1: identity/domain, 2: 30-day focus, 3: milestone, 4: challenge/competition, 5: recommended angle).
- developments: >=4 items (date YYYY-MM-DD <= ${todayKey}, category Launch|Hire|Funding|Partnership|Press, title, detail, source_url, source_title).
- discussion_points: 3 strings.
- open_questions: 5 strategic questions.
- Cite facts as [id].
JSON format:
{"executive_summary":"","recent_developments":[{"date":"","category":"","title":"","detail":"","source_url":"","source_title":""}],"useful_discussion_points":[],"open_questions":[],"confidence_score":"High|Medium|Low"}`;
}

export function buildUserPayload(input: {
  target: string;
  meetingType: MeetingType;
  meetingDate: string;
  todayKey: string;
  windowStartKey: string;
  sources: Array<{ id: number; title: string; url: string; publishedDate: string; content: string }>;
}): string {
  // 1. Send top 3-4 sources max instead of 5+
  const trimmedSources = input.sources.slice(0, 4);

  return JSON.stringify({
    target: input.target,
    type: input.meetingType,
    // Shorten source objects to only essential citation data
    sources: trimmedSources.map((s) => ({
      id: s.id,
      t: s.title,
      u: s.url,
      d: s.publishedDate,
      e: s.content.slice(0, EXCERPT_CHARS), // Trim excerpt length from 150 -> 100 chars
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
        max_tokens: MAX_OUTPUT_TOKENS,
        reasoning: { effort: 'low' },
        messages: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: input.userPayload },
        ],
      }),
    });
  } catch {
    throw new BifrostError('Could not reach Bifrost. Check your connection and try again.', null);
  }

  // Handle specific HTTP error status codes
  if (response.status === 401) {
    throw new BifrostError('Bifrost rejected your Virtual Key. Update it in Settings.', 401);
  }
  if (response.status === 402) {
    throw new BifrostError(
      'Your AI key does not have enough credit for this briefing. Add credit or raise the key limit, then try again.',
      402
    );
  }
  if (response.status === 429) {
    throw new BifrostError('Rate limit exceeded on your key. Please wait a moment and try again.', 429);
  }
  if (response.status >= 500) {
    throw new BifrostError(
      `The AI model provider is currently unavailable (${response.status}). Please try again or switch models.`,
      response.status
    );
  }
  if (!response.ok) {
    throw new BifrostError(`Bifrost returned an error (${response.status}).`, response.status);
  }

  // Safely parse JSON (prevents app crash if server returns raw HTML/text error)
  let rawJson: unknown;
  try {
    rawJson = await response.json();
  } catch {
    throw new BifrostError('Bifrost returned an invalid response format.', response.status);
  }

  const parsed = completionSchema.safeParse(rawJson);
  if (!parsed.success) {
    throw new BifrostError(
      `Bifrost returned an unexpected response structure. Expected choices[0].message.content as text; received ${describeResponseShape(rawJson)}.`,
      response.status
    );
  }

  const content = parsed.data.choices[0].message.content;
  if (!content.trim()) {
    throw new BifrostError('Bifrost completed the request but returned no text content.', response.status);
  }

  return content;
}