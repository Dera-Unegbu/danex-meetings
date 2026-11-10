/*
# Create briefings table (single-tenant, no auth)

1. New Tables
- `briefings`
  - `id` (uuid, primary key)
  - `target_name` (text, not null) - company or person researched
  - `meeting_type` (text, not null) - Sales Call, Partnership, Investor Pitch, Business Development, General
  - `meeting_at` (timestamptz, not null) - scheduled meeting time
  - `model` (text, not null) - Bifrost routing model used
  - `briefing` (jsonb, not null) - full validated briefing payload
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `briefings`.
- Grant CRUD to `anon` and `authenticated` because the app has no sign-in and the briefings are intentionally shared.
- Policies are scoped to `anon, authenticated` for each verb (select, insert, update, delete).

3. Notes
- No user ownership column is added because the app has no accounts.
- Only public web research is stored; no credentials are saved to this table.
*/

CREATE TABLE IF NOT EXISTS briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_name text NOT NULL,
  meeting_type text NOT NULL,
  meeting_at timestamptz NOT NULL,
  model text NOT NULL,
  briefing jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS briefings_created_at_idx ON briefings (created_at DESC);

ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON briefings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_briefings" ON briefings;
CREATE POLICY "anon_select_briefings" ON briefings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_briefings" ON briefings;
CREATE POLICY "anon_insert_briefings" ON briefings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_briefings" ON briefings;
CREATE POLICY "anon_update_briefings" ON briefings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_briefings" ON briefings;
CREATE POLICY "anon_delete_briefings" ON briefings FOR DELETE
  TO anon, authenticated USING (true);
