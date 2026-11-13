import { createClient, type User } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { z } from 'zod';
import { describeGenerationError, generateBriefing } from '../../lib/briefing-generator';
import {
  GATEWAY_MODELS,
  MEETING_TYPES,
  type BriefingMeta,
  type GatewayModel,
} from '../../lib/briefing-types';

const GUEST_LIMIT = 5;
const MEMBER_LIMIT = 50;

let databasePool: Pool | null = null;

const requestSchema = z.object({
  target: z.string().trim().min(1).max(240),
  meetingType: z.union([z.enum(MEETING_TYPES), z.literal('Custom')]),
  meetingDescription: z.string().max(12_000).optional(),
  meetingAt: z.string().datetime(),
  model: z.string().refine(
    (value): value is GatewayModel => GATEWAY_MODELS.some((model) => model.value === value)
  ),
});

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
}

interface Usage {
  used: number;
  limit: number;
  remaining: number;
}

function response(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
      Vary: 'Authorization',
    },
    body: JSON.stringify(body),
  };
}

function createAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    const missing = [
      ...(!url ? ['NEXT_PUBLIC_SUPABASE_URL'] : []),
      ...(!serviceRoleKey ? ['SUPABASE_SERVICE_ROLE_KEY'] : []),
    ];
    throw new Error(`Missing Supabase server configuration: ${missing.join(', ')}.`);
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getDatabasePool() {
  const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'Missing PostgreSQL server configuration: SUPABASE_DATABASE_URL or DATABASE_URL.'
    );
  }
  databasePool ??= new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });
  return databasePool;
}

async function authenticate(
  event: NetlifyEvent
): Promise<{ user: User; authClient: ReturnType<typeof createAuthClient> } | null> {
  const authorization = event.headers.authorization ?? event.headers.Authorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, authClient };
}

async function readUsage(user: User): Promise<Usage> {
  const limit = user.is_anonymous ? GUEST_LIMIT : MEMBER_LIMIT;
  const { rows } = await getDatabasePool().query<{ used_count: number }>(
    'SELECT used_count FROM public.briefing_usage WHERE user_id = $1',
    [user.id]
  );

  const used = rows[0]?.used_count ?? 0;
  return { used, limit, remaining: Math.max(0, limit - used) };
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed.' });
  }

  let auth: Awaited<ReturnType<typeof authenticate>>;
  try {
    auth = await authenticate(event);
  } catch (error) {
    console.error('Briefing API authentication setup failed:', error);
    return response(500, { error: 'The service is not configured correctly.' });
  }
  if (!auth) return response(401, { error: 'Please sign in or continue as a guest.' });

  if (event.httpMethod === 'GET') {
    try {
      return response(200, { usage: await readUsage(auth.user) });
    } catch (error) {
      console.error('Could not read briefing usage:', error);
      return response(500, { error: 'Could not load usage. Please try again.' });
    }
  }

  let input: z.infer<typeof requestSchema>;
  try {
    const parsedBody: unknown = JSON.parse(event.body ?? '');
    const parsed = requestSchema.safeParse(parsedBody);
    if (!parsed.success) {
      return response(400, { error: 'Check the briefing details and try again.' });
    }
    if (parsed.data.meetingType === 'Custom' && !parsed.data.meetingDescription?.trim()) {
      return response(400, { error: 'Describe the custom meeting before generating a briefing.' });
    }
    if (
      parsed.data.meetingDescription &&
      parsed.data.meetingDescription.trim().split(/\s+/).length > 1000
    ) {
      return response(400, { error: 'The meeting description cannot exceed 1,000 words.' });
    }
    input = parsed.data;
  } catch {
    return response(400, { error: 'The request body was not valid JSON.' });
  }

  const usageLimit = auth.user.is_anonymous ? GUEST_LIMIT : MEMBER_LIMIT;
  let reservation: unknown;
  try {
    const { rows } = await getDatabasePool().query(
      'SELECT allowed, used_count, remaining FROM public.reserve_briefing_usage($1, $2)',
      [auth.user.id, usageLimit]
    );
    reservation = rows[0];
  } catch (error) {
    console.error('Could not reserve briefing usage:', error);
    return response(500, { error: 'Could not verify usage. Please try again.' });
  }

  if (!reservation || typeof reservation !== 'object') {
    return response(500, { error: 'Could not verify usage. Please try again.' });
  }
  const parsedQuota = z
    .object({
      allowed: z.boolean(),
      used_count: z.number(),
      remaining: z.number(),
    })
    .safeParse(reservation);
  if (!parsedQuota.success) {
    return response(500, { error: 'Could not verify usage. Please try again.' });
  }
  const quota = parsedQuota.data;
  if (!quota.allowed) {
    return response(429, {
      code: 'usage_limit',
      error: auth.user.is_anonymous
        ? 'You have used all 5 guest briefings. Sign in for 50 briefings and to save your history.'
        : 'You have used all 50 briefings available on the free account.',
      usage: {
        used: quota.used_count ?? usageLimit,
        limit: usageLimit,
        remaining: quota.remaining ?? 0,
      },
    });
  }

  try {
    if (!process.env.TAVILY_API_KEY || !process.env.BIFROST_API_KEY) {
      throw new Error('Missing server-side Tavily or Bifrost configuration.');
    }

    const meta: BriefingMeta = {
      target: input.target,
      meetingType: input.meetingType,
      meetingDescription: input.meetingDescription?.trim() || undefined,
      meetingAt: new Date(input.meetingAt),
      model: input.model,
    };
    const briefing = await generateBriefing(
      meta,
      { tavily: process.env.TAVILY_API_KEY, bifrost: process.env.BIFROST_API_KEY },
      () => undefined
    );

    if (!auth.user.is_anonymous) {
      await getDatabasePool().query(
        `INSERT INTO public.briefings (
          user_id, target_name, meeting_type, meeting_description, meeting_at, model, briefing
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [
          auth.user.id,
          meta.target,
          meta.meetingType,
          meta.meetingDescription ?? null,
          meta.meetingAt.toISOString(),
          meta.model,
          JSON.stringify(briefing),
        ]
      );
    }

    const usage: Usage = {
      used: quota.used_count,
      limit: usageLimit,
      remaining: quota.remaining,
    };
    return response(200, { briefing, usage });
  } catch (error) {
    const { description } = describeGenerationError(error);
    try {
      await getDatabasePool().query('SELECT public.release_briefing_usage($1)', [auth.user.id]);
    } catch (releaseError) {
      console.error('Could not release failed briefing usage:', releaseError);
    }
    const statusCode = error instanceof Error && error.message.startsWith('Missing server-side') ? 500 : 502;
    console.error('Briefing generation failed:', error);
    return response(statusCode, { error: statusCode === 500 ? 'The service is not configured correctly.' : description });
  }
};
