-- CONSOLIDATED SUPABASE FIX
-- Run this in your Supabase SQL Editor

-- 1. Ensure workout_plans table has all required columns
ALTER TABLE public.workout_plans
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL;

-- Ensure is_public exists (it's in the initial schema but just in case)
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1b. Fix RLS policies for workout_plans so users can CRUD their own plans
-- (The template_visibility migration only added a SELECT policy for templates)
DROP POLICY IF EXISTS "Users can view own plans" ON public.workout_plans;
CREATE POLICY "Users can view own plans" ON public.workout_plans
  FOR SELECT USING (auth.uid() = user_id OR is_template = true OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own plans" ON public.workout_plans;
CREATE POLICY "Users can insert own plans" ON public.workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plans" ON public.workout_plans;
CREATE POLICY "Users can update own plans" ON public.workout_plans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own plans" ON public.workout_plans;
CREATE POLICY "Users can delete own plans" ON public.workout_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Fix plan_exercises RLS so users can manage exercises in their own plans
DROP POLICY IF EXISTS "Users can manage own plan exercises" ON public.plan_exercises;
CREATE POLICY "Users can manage own plan exercises" ON public.plan_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id AND wp.user_id = auth.uid()
    )
  );

-- Also allow reading exercises from public plans (for community)
DROP POLICY IF EXISTS "Public plan exercises visible" ON public.plan_exercises;
CREATE POLICY "Public plan exercises visible" ON public.plan_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = plan_id AND (wp.is_public = true OR wp.is_template = true)
    )
  );

-- 2. Ensure profiles has social_likes_given tracking and profile visibility
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS social_likes_given INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private'));

-- 3. Create workout_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workout_likes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workout_id)
);

-- 4. Create saved_workouts table (Keep for compatibility, though we now use parent_plan_id)
CREATE TABLE IF NOT EXISTS public.saved_workouts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workout_id)
);

-- 5. Create workout_comments table
CREATE TABLE IF NOT EXISTS public.workout_comments (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE public.workout_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_comments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
DROP POLICY IF EXISTS "Users can view all likes" ON public.workout_likes;
CREATE POLICY "Users can view all likes" ON public.workout_likes FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.workout_likes;
CREATE POLICY "Users can insert their own likes" ON public.workout_likes FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.workout_likes;
CREATE POLICY "Users can delete their own likes" ON public.workout_likes FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view all comments" ON public.workout_comments;
CREATE POLICY "Users can view all comments" ON public.workout_comments FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.workout_comments;
CREATE POLICY "Users can insert their own comments" ON public.workout_comments FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.workout_comments;
CREATE POLICY "Users can delete their own comments" ON public.workout_comments FOR DELETE USING (user_id = auth.uid());

-- 8. RPC Functions for atomic updates
CREATE OR REPLACE FUNCTION public.increment_workout_likes(workout_id UUID) 
RETURNS void AS $$
BEGIN
  UPDATE public.workout_plans SET likes = likes + 1 WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_workout_likes(workout_id UUID) 
RETURNS void AS $$
BEGIN
  UPDATE public.workout_plans SET likes = GREATEST(0, likes - 1) WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_workout_saves(workout_id UUID) 
RETURNS void AS $$
BEGIN
  UPDATE public.workout_plans SET saves = saves + 1 WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_workout_saves(workout_id UUID) 
RETURNS void AS $$
BEGIN
  UPDATE public.workout_plans SET saves = GREATEST(0, saves - 1) WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_workout_comments(workout_id UUID) 
RETURNS void AS $$
BEGIN
  UPDATE public.workout_plans SET comments = comments + 1 WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_workout_comments(workout_id UUID) 
RETURNS void AS $$
BEGIN
  UPDATE public.workout_plans SET comments = GREATEST(0, comments - 1) WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Fix workout_sessions plan_id foreign key to allow plan deletion
-- This avoids "Key is still referenced from table workout_sessions" error (409 Conflict)
ALTER TABLE public.workout_sessions
DROP CONSTRAINT IF EXISTS workout_sessions_plan_id_fkey,
ADD CONSTRAINT workout_sessions_plan_id_fkey
    FOREIGN KEY (plan_id)
    REFERENCES public.workout_plans(id)
    ON DELETE SET NULL;

-- 10. Fix plan_exercises plan_id foreign key to allow plan deletion
-- Without this, deleting a workout_plan fails if it has exercises referencing it
ALTER TABLE public.plan_exercises
DROP CONSTRAINT IF EXISTS plan_exercises_plan_id_fkey,
ADD CONSTRAINT plan_exercises_plan_id_fkey
    FOREIGN KEY (plan_id)
    REFERENCES public.workout_plans(id)
    ON DELETE CASCADE;

-- 11. Verify all constraints are correct (run this SELECT to check)
-- SELECT conname, conrelid::regclass, confrelid::regclass, confdeltype
-- FROM pg_constraint
-- WHERE confrelid = 'public.workout_plans'::regclass
--   AND contype = 'f'
-- ORDER BY conrelid::regclass::text;
