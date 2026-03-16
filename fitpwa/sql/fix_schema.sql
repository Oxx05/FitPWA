-- 1. Correct workout_plans schema
-- Add likes and saves columns if they are missing
ALTER TABLE "public"."workout_plans" 
ADD COLUMN IF NOT EXISTS "likes" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "saves" INTEGER DEFAULT 0;

-- 2. Correct personal_records schema
-- Add one_rep_max column (it might be numeric instead of decimal, depending on common usage)
ALTER TABLE "public"."personal_records" 
ADD COLUMN IF NOT EXISTS "one_rep_max" DECIMAL(10,2);

-- 3. Migration: if some friendships exist with requester_id/addressee_id 
-- but code expects user_id/friend_id, we can create a view or just stick to the schema.
-- Looking at the migration 20260322000001, it uses requester_id/addressee_id.
-- I will keep the schema clean and update the REACT code instead.

-- 4. Adding missing indexes for Social features
CREATE INDEX IF NOT EXISTS idx_friendships_requester_id ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee_id ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
