ALTER TABLE public.briefings
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS briefings_user_created_at_idx
ON public.briefings (user_id, created_at DESC);

ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_briefings" ON public.briefings;
DROP POLICY IF EXISTS "anon_insert_briefings" ON public.briefings;
DROP POLICY IF EXISTS "anon_update_briefings" ON public.briefings;
DROP POLICY IF EXISTS "anon_delete_briefings" ON public.briefings;
DROP POLICY IF EXISTS "users_select_own_briefings" ON public.briefings;

REVOKE ALL ON public.briefings FROM anon, authenticated;
GRANT SELECT ON public.briefings TO authenticated;
GRANT INSERT, SELECT ON public.briefings TO service_role;

CREATE POLICY "users_select_own_briefings" ON public.briefings
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  AND COALESCE(auth.jwt() ->> 'is_anonymous', 'false') <> 'true'
);

CREATE TABLE IF NOT EXISTS public.briefing_usage (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.briefing_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.briefing_usage FROM anon, authenticated;
GRANT ALL ON public.briefing_usage TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_briefing_usage(p_user_id uuid, p_limit integer)
RETURNS TABLE (allowed boolean, used_count integer, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_count integer;
BEGIN
  INSERT INTO public.briefing_usage AS existing_usage (user_id, used_count, updated_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE
    SET used_count = existing_usage.used_count + 1,
        updated_at = now()
    WHERE existing_usage.used_count < p_limit
  RETURNING existing_usage.used_count INTO current_count;

  IF current_count IS NULL THEN
    SELECT existing_usage.used_count INTO current_count
    FROM public.briefing_usage AS existing_usage
    WHERE existing_usage.user_id = p_user_id;
    RETURN QUERY SELECT false, current_count, GREATEST(0, p_limit - current_count);
  ELSE
    RETURN QUERY SELECT true, current_count, GREATEST(0, p_limit - current_count);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_briefing_usage(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.briefing_usage
  SET used_count = GREATEST(0, used_count - 1),
      updated_at = now()
  WHERE user_id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.reserve_briefing_usage(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_briefing_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_briefing_usage(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_briefing_usage(uuid) TO service_role;
