-- Auto-cycling weekly challenges via pg_cron
-- Run this in Supabase SQL Editor once.
-- Requires pg_cron extension (enabled by default on Supabase Pro/Free).

-- 1. Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Function: generates challenges for the next N weeks by cycling through the pool
CREATE OR REPLACE FUNCTION public.generate_weekly_challenges(weeks_ahead INT DEFAULT 8)
RETURNS void AS $$
DECLARE
  pool JSONB := '[
    {"title":"Workout 3 Times","title_pt":"Treina 3 Vezes","description":"Complete 3 workouts this week.","description_pt":"Completa 3 treinos esta semana.","type":"sessions_count","target_value":3,"xp_reward":150},
    {"title":"Workout 5 Times","title_pt":"Treina 5 Vezes","description":"Complete 5 workouts this week.","description_pt":"Completa 5 treinos esta semana.","type":"sessions_count","target_value":5,"xp_reward":300},
    {"title":"100 Reps Challenge","title_pt":"Desafio 100 Reps","description":"Hit 100 total reps in a single session.","description_pt":"Faz 100 reps totais numa só sessão.","type":"total_reps","target_value":100,"xp_reward":200},
    {"title":"1,000 kg Lifted","title_pt":"1.000 kg Levantados","description":"Accumulate 1,000 kg volume in a session.","description_pt":"Acumula 1.000 kg de volume numa sessão.","type":"volume","target_value":1000,"xp_reward":250},
    {"title":"Try Something New","title_pt":"Experimenta um Exercício","description":"Do an exercise you''ve never logged before.","description_pt":"Faz um exercício que nunca registaste.","type":"new_exercise","target_value":1,"xp_reward":100},
    {"title":"Early Bird","title_pt":"Madrugador","description":"Train before 8 AM at least once.","description_pt":"Treina antes das 8h pelo menos uma vez.","type":"sessions_count","target_value":1,"xp_reward":120},
    {"title":"Full Week Streak","title_pt":"Semana Completa","description":"Train every day for 7 days straight.","description_pt":"Treina todos os dias durante 7 dias seguidos.","type":"sessions_count","target_value":7,"xp_reward":500},
    {"title":"5,000 kg Volume Week","title_pt":"Semana de 5.000 kg","description":"Lift 5,000 kg total volume this week.","description_pt":"Levanta 5.000 kg de volume total esta semana.","type":"volume","target_value":5000,"xp_reward":400},
    {"title":"Leg Day Hero","title_pt":"Herói do Leg Day","description":"Complete 2 leg sessions this week.","description_pt":"Completa 2 sessões de pernas esta semana.","type":"sessions_count","target_value":2,"xp_reward":200},
    {"title":"Push Your Limits","title_pt":"Supera os Teus Limites","description":"Log a session with RPE 9 or higher.","description_pt":"Regista uma sessão com RPE 9 ou superior.","type":"sessions_count","target_value":1,"xp_reward":175},
    {"title":"200 Push-up Challenge","title_pt":"Desafio 200 Flexões","description":"Do 200 push-ups across the week.","description_pt":"Faz 200 flexões ao longo da semana.","type":"total_reps","target_value":200,"xp_reward":350},
    {"title":"Back to Basics","title_pt":"Regresso ao Básico","description":"Log workouts 4 days this week.","description_pt":"Regista treinos 4 dias esta semana.","type":"sessions_count","target_value":4,"xp_reward":225}
  ]';
  pool_size INT := jsonb_array_length(pool);
  -- ISO week number of epoch Monday 1970-01-05 (first Monday) as offset base
  base_date DATE := '1970-01-05'::DATE;
  i INT;
  w_start DATE;
  w_end DATE;
  pool_index INT;
  entry JSONB;
  -- Current Monday
  this_monday DATE := date_trunc('week', NOW())::DATE;
BEGIN
  FOR i IN 0..(weeks_ahead - 1) LOOP
    w_start := this_monday + (i * 7);
    w_end   := w_start + 6;

    -- Skip if a challenge already exists for this week_start
    IF EXISTS (SELECT 1 FROM public.weekly_challenges WHERE week_start = w_start) THEN
      CONTINUE;
    END IF;

    -- Cycle index: how many weeks since base_date mod pool_size
    pool_index := ((w_start - base_date) / 7) % pool_size;
    entry := pool -> pool_index;

    INSERT INTO public.weekly_challenges
      (title, title_pt, description, description_pt, type, target_value, xp_reward, week_start, week_end)
    VALUES (
      entry->>'title',
      entry->>'title_pt',
      entry->>'description',
      entry->>'description_pt',
      entry->>'type',
      (entry->>'target_value')::INT,
      (entry->>'xp_reward')::INT,
      w_start,
      w_end
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Run once immediately to fill any gaps (safe to re-run — skips existing weeks)
SELECT public.generate_weekly_challenges(12);

-- 4. Schedule: every Monday at 00:05 UTC, generate 12 weeks ahead
SELECT cron.schedule(
  'weekly-challenge-cycle',
  '5 0 * * 1',
  $$SELECT public.generate_weekly_challenges(12);$$
);
