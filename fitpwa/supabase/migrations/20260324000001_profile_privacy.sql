-- Migration: 20260324000001_profile_privacy.sql
-- Goal: Add tiered privacy levels to user profiles

-- 1. Add privacy_level column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' 
CHECK (privacy_level IN ('public', 'friends', 'private'));

-- 2. Update RLS Policies for sensitive tables
-- We check the owner's privacy_level before allowing others to SELECT

-- WORKOUT SESSIONS
DROP POLICY IF EXISTS "Sessions visibility based on privacy" ON public.workout_sessions;
CREATE POLICY "Sessions visibility based on privacy" ON public.workout_sessions
    FOR SELECT USING (
        auth.uid() = user_id -- Owner always sees
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles p 
                WHERE p.id = workout_sessions.user_id 
                AND p.privacy_level = 'public'
            )
        )
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles p 
                WHERE p.id = workout_sessions.user_id 
                AND p.privacy_level = 'friends'
                AND EXISTS (
                    SELECT 1 FROM public.friendships f 
                    WHERE f.status = 'accepted'
                    AND (
                        (f.requester_id = auth.uid() AND f.addressee_id = workout_sessions.user_id)
                        OR (f.addressee_id = auth.uid() AND f.requester_id = workout_sessions.user_id)
                    )
                )
            )
        )
    );

-- PERSONAL RECORDS
DROP POLICY IF EXISTS "PRs visibility based on privacy" ON public.personal_records;
CREATE POLICY "PRs visibility based on privacy" ON public.personal_records
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = personal_records.user_id AND p.privacy_level = 'public')
    );

-- USER ACHIEVEMENTS
DROP POLICY IF EXISTS "Achievements visibility based on privacy" ON public.user_achievements;
CREATE POLICY "Achievements visibility based on privacy" ON public.user_achievements
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_achievements.user_id AND p.privacy_level = 'public')
    );

-- 3. Optimization: Grant select on profiles privacy_level to all authenticated users
-- (Usually needed for the EXISTS checks above)
GRANT SELECT (id, privacy_level) ON public.profiles TO authenticated;

-- 4. Initial update: Ensure all existing users are 'public'
-- (Redundant due to DEFAULT, but safe)
UPDATE public.profiles SET privacy_level = 'public' WHERE privacy_level IS NULL;

-- 5. Special: Grant Premium status to user
UPDATE public.profiles 
SET is_premium = true 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'bernardoam05@ua.pt');
