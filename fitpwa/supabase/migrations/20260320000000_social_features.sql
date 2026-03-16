-- Create workspace_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workspace_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    exercises JSONB DEFAULT '[]'::jsonb,
    days_per_week INTEGER DEFAULT 3,
    difficulty VARCHAR DEFAULT 'intermediate',
    is_public BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Create workout_likes table
CREATE TABLE IF NOT EXISTS public.workout_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.workspace_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workout_id)
);

-- Create saved_workouts table
CREATE TABLE IF NOT EXISTS public.saved_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.workspace_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, workout_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.workout_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workspace_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workout_history table for tracking completed workouts
CREATE TABLE IF NOT EXISTS public.workout_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.workspace_plans(id) ON DELETE SET NULL,
    exercise_id TEXT NOT NULL,
    sets_completed INTEGER,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create personal_records table for tracking PRs
CREATE TABLE IF NOT EXISTS public.personal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    weight_kg DECIMAL(8,2),
    reps INTEGER,
    date_set TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

-- Enable RLS on the tables
ALTER TABLE public.workspace_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_plans
DROP POLICY IF EXISTS "Users can view public plans" ON public.workspace_plans;
CREATE POLICY "Users can view public plans" ON public.workspace_plans
    FOR SELECT USING (is_public = TRUE OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own plans" ON public.workspace_plans;
CREATE POLICY "Users can insert their own plans" ON public.workspace_plans
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own plans" ON public.workspace_plans;
CREATE POLICY "Users can update their own plans" ON public.workspace_plans
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own plans" ON public.workspace_plans;
CREATE POLICY "Users can delete their own plans" ON public.workspace_plans
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for workout_likes
DROP POLICY IF EXISTS "Users can like any public plan" ON public.workout_likes;
CREATE POLICY "Users can like any public plan" ON public.workout_likes
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view all likes" ON public.workout_likes;
CREATE POLICY "Users can view all likes" ON public.workout_likes
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.workout_likes;
CREATE POLICY "Users can delete their own likes" ON public.workout_likes
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for saved_workouts
DROP POLICY IF EXISTS "Users can save any public plan" ON public.saved_workouts;
CREATE POLICY "Users can save any public plan" ON public.saved_workouts
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their saves" ON public.saved_workouts;
CREATE POLICY "Users can view their saves" ON public.saved_workouts
    FOR SELECT USING (user_id = auth.uid() OR TRUE);

DROP POLICY IF EXISTS "Users can delete their saves" ON public.saved_workouts;
CREATE POLICY "Users can delete their saves" ON public.saved_workouts
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for workout_comments
DROP POLICY IF EXISTS "Users can view comments on public plans" ON public.workout_comments;
CREATE POLICY "Users can view comments on public plans" ON public.workout_comments
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can insert comments" ON public.workout_comments;
CREATE POLICY "Users can insert comments" ON public.workout_comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.workout_comments;
CREATE POLICY "Users can delete their own comments" ON public.workout_comments
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for workout_history
DROP POLICY IF EXISTS "Users can view their history" ON public.workout_history;
CREATE POLICY "Users can view their history" ON public.workout_history
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their history" ON public.workout_history;
CREATE POLICY "Users can insert their history" ON public.workout_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for personal_records
DROP POLICY IF EXISTS "Users can view their PRs" ON public.personal_records;
CREATE POLICY "Users can view their PRs" ON public.personal_records
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their PRs" ON public.personal_records;
CREATE POLICY "Users can insert their PRs" ON public.personal_records
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their PRs" ON public.personal_records;
CREATE POLICY "Users can update their PRs" ON public.personal_records
    FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_plans_user_id ON public.workspace_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_plans_is_public ON public.workspace_plans(is_public);
CREATE INDEX IF NOT EXISTS idx_workspace_plans_created_at ON public.workspace_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_likes_workout_id ON public.workout_likes(workout_id);
CREATE INDEX IF NOT EXISTS idx_saved_workouts_user_id ON public.saved_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_workouts_workout_id ON public.saved_workouts(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_workout_id ON public.workout_comments(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_user_id ON public.workout_history(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_history_created_at ON public.workout_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_records_user_id ON public.personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise_id ON public.personal_records(exercise_id);
