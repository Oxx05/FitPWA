-- Add missing columns to workout_plans to support community features
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0;
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'intermediate';

-- Update RLS if necessary (usually not needed for just adding columns, 
-- but ensuring they are included in existing select policies)
