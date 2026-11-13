import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    const missing = [
      ...(!url ? ['NEXT_PUBLIC_SUPABASE_URL'] : []),
      ...(!anonKey ? ['NEXT_PUBLIC_SUPABASE_ANON_KEY'] : []),
    ];
    throw new Error(`Missing browser Supabase configuration: ${missing.join(', ')}.`);
  }

  client ??= createClient(url, anonKey);
  return client;
}
