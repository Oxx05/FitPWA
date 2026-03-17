-- Add session_id to personal_record_history for better cleanup
ALTER TABLE public.personal_record_history 
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.workout_sessions(id) ON DELETE CASCADE;

-- Create notifications table for history tracking
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text CHECK (type IN ('achievement', 'pr', 'milestone', 'system', 'social')),
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

-- Add sound_enabled to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sound_enabled boolean DEFAULT true;
