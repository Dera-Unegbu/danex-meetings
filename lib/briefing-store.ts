import { z } from 'zod';
import { getSupabase } from './supabase';
import {
  DEVELOPMENT_CATEGORIES,
  MEETING_TYPES,
  type Briefing,
  type BriefingMeta,
  type SavedBriefing,
} from './briefing-types';

const briefingSchema = z.object({
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
});

const rowSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  target_name: z.string(),
  meeting_type: z.enum(MEETING_TYPES),
  meeting_at: z.string(),
  model: z.string(),
  briefing: briefingSchema,
});

export async function saveBriefing(meta: BriefingMeta, briefing: Briefing): Promise<void> {
  const { error } = await getSupabase().from('briefings').insert({
    target_name: meta.target,
    meeting_type: meta.meetingType,
    meeting_at: meta.meetingAt.toISOString(),
    model: meta.model,
    briefing,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function listRecentBriefings(limit = 8): Promise<SavedBriefing[]> {
  const { data, error } = await getSupabase()
    .from('briefings')
    .select('id, created_at, target_name, meeting_type, meeting_at, model, briefing')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).flatMap((row): SavedBriefing[] => {
    const parsed = rowSchema.safeParse(row);
    if (!parsed.success) return [];
    return [
      {
        id: parsed.data.id,
        createdAt: parsed.data.created_at,
        meta: {
          target: parsed.data.target_name,
          meetingType: parsed.data.meeting_type,
          meetingAt: new Date(parsed.data.meeting_at),
          model: parsed.data.model as BriefingMeta['model'],
        },
        briefing: parsed.data.briefing,
      },
    ];
  });
}
