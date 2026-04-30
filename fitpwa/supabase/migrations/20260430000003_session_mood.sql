-- Add mood column to workout_sessions for post-workout feedback
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS mood TEXT;
