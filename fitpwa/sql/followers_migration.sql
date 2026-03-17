-- Create followers table for one-way following model
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS followers_follower_id_idx ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS followers_following_id_idx ON public.followers(following_id);

-- Create user_favorites table for accounts
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    favorite_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, favorite_profile_id)
);

-- Existing data migration: friendships (accepted) -> mutual follows
INSERT INTO public.followers (follower_id, following_id)
SELECT requester_id, addressee_id FROM friendships WHERE status = 'accepted'
ON CONFLICT DO NOTHING;

INSERT INTO public.followers (follower_id, following_id)
SELECT addressee_id, requester_id FROM friendships WHERE status = 'accepted'
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Followers are viewable by everyone" ON public.followers
    FOR SELECT USING (true);

CREATE POLICY "Users can follow/unfollow" ON public.followers
    FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Favorites are private to the user" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage favorites" ON public.user_favorites
    FOR ALL USING (auth.uid() = user_id);
