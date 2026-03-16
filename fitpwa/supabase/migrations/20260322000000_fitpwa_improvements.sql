-- Add default settings to profiles
ALTER TABLE profiles ADD COLUMN default_rest_seconds INTEGER DEFAULT 90;
ALTER TABLE profiles ADD COLUMN default_reps_min INTEGER DEFAULT 8;
ALTER TABLE profiles ADD COLUMN default_reps_max INTEGER DEFAULT 12;
ALTER TABLE profiles ADD COLUMN default_sets INTEGER DEFAULT 3;

-- Add notes to workout sessions and sets
ALTER TABLE session_sets ADD COLUMN notes TEXT;
