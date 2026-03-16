-- 1. Correct Social tables to point to workout_plans instead of workspace_plans
-- Drop existing tables that depend on workspace_plans to recreate them correctly
DROP TABLE IF EXISTS public.workout_likes CASCADE;
DROP TABLE IF EXISTS public.saved_workouts CASCADE;
DROP TABLE IF EXISTS public.workout_comments CASCADE;

-- Recreate workout_likes pointing to workout_plans
CREATE TABLE public.workout_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workout_id)
);

-- Recreate saved_workouts pointing to workout_plans
CREATE TABLE public.saved_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workout_id)
);

-- Recreate workout_comments pointing to workout_plans
CREATE TABLE public.workout_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Gamification Caps to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_xp_earned INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_xp_date DATE DEFAULT CURRENT_DATE;

-- 3. Create Friendships Table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- 4. Clean up workspace_plans if it exists
DROP TABLE IF EXISTS public.workspace_plans CASCADE;

-- Enable RLS
ALTER TABLE public.workout_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Likes are viewable by everyone" ON public.workout_likes FOR SELECT USING (true);
CREATE POLICY "Users can like public plans" ON public.workout_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.workout_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Saves are private to user" ON public.saved_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save public plans" ON public.saved_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave" ON public.saved_workouts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone" ON public.workout_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.workout_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see their own friendships" ON public.friendships 
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can request friendships" ON public.friendships 
    FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendship status" ON public.friendships 
    FOR UPDATE USING (auth.uid() = addressee_id);
