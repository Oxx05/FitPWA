-- Cleanup redundant exercise fields from plan_exercises table
ALTER TABLE plan_exercises DROP COLUMN IF EXISTS reps_min;
ALTER TABLE plan_exercises DROP COLUMN IF EXISTS reps_max;
ALTER TABLE plan_exercises DROP COLUMN IF EXISTS rest_seconds;
