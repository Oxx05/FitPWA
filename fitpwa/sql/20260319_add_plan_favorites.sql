-- Add is_favorite column to workout_plans table
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
