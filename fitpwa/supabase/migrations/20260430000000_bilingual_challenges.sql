-- Add bilingual columns to weekly_challenges
ALTER TABLE public.weekly_challenges
  ADD COLUMN IF NOT EXISTS title_pt TEXT,
  ADD COLUMN IF NOT EXISTS description_pt TEXT;
