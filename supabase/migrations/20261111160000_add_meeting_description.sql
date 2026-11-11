ALTER TABLE public.briefings
ADD COLUMN IF NOT EXISTS meeting_description text;
