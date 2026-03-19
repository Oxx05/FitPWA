-- 1. Ensure workout_plans has necessary counters for social interaction
ALTER TABLE public.workout_plans 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;

-- 2. Ensure profiles has social_likes_given tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_likes_given INTEGER DEFAULT 0;

-- 3. Populate Achievements table to avoid Foreign Key errors (user_achievements)
-- These IDs sync with src/features/gamification/useAchievementsStore.ts
INSERT INTO public.achievements (id, name, name_pt, description, description_pt, icon, xp_reward, category) VALUES
('streak_3', 'Right Rhythm', 'Ritmo Certo', '3-day streak!', 'Streak de 3 dias!', '🔥', 50, 'streak'),
('streak_7', 'Unstoppable', 'Imparável', '7-day streak!', 'Streak de 7 dias!', '⚡', 150, 'streak'),
('streak_30', 'Iron Habit', 'Hábito de Ferro', '30-day streak!', 'Streak de 30 dias!', '👑', 500, 'streak'),
('streak_365', 'Legendary Habit', 'Hábito Lendário', '365-day streak! Pure discipline.', 'Streak de 365 dias! Disciplina pura.', '💎', 5000, 'streak'),
('workouts_1', 'First Step', 'Primeiro Passo', 'First workout completed!', 'Primeiro treino concluído!', '🏁', 25, 'workouts'),
('workouts_25', 'Regular', 'Habitué', '25 workouts completed!', '25 treinos concluídos!', '🏃', 200, 'workouts'),
('workouts_100', 'Century Club', 'Clube dos 100', '100 workouts! You are a machine.', '100 treinos! És uma máquina.', '🦾', 1000, 'workouts'),
('workouts_1000', 'Immortal', 'Imortal', '1000 workouts. You are the gym.', '1000 treinos. Tu és o ginásio.', '🌌', 10000, 'workouts'),
('volume_1000', 'Heavyweight', 'Peso Pesado', 'Lifted 1,000kg in one workout!', 'Levantaste 1.000kg num treino!', '🐘', 50, 'volume'),
('volume_5000', 'Iron Titan', 'Titã de Ferro', 'Lifted 5,000kg in one workout!', 'Levantaste 5.000kg num treino!', '🏗️', 250, 'volume'),
('volume_10000', 'Earth Shaker', 'Sismo Humano', '10,000kg in a single session!', '10.000kg numa única sessão!', '🌎', 750, 'volume'),
('volume_1000000', 'Titan of Earth', 'Titã da Terra', 'Lifted 1,000,000kg total volume!', 'Levantaste 1.000.000kg de volume total!', '☄️', 10000, 'volume'),
('level_5', 'Ascending', 'A Ascender', 'Reached Level 5!', 'Chegaste ao Nível 5!', '🌱', 100, 'level'),
('level_20', 'Elite Athlete', 'Atleta de Elite', 'Reached Level 20!', 'Chegaste ao Nível 20!', '🌟', 500, 'level'),
('level_50', 'Master of Gym', 'Mestre do Ginásio', 'Reached Level 50!', 'Chegaste ao Nível 50!', '🌋', 2000, 'level'),
('level_100', 'Living God', 'Deus Vivo', 'Reached Level 100!', 'Chegaste ao Nível 100!', '💠', 10000, 'level'),
('social_10', 'Community Spirit', 'Espírito de Equipa', 'Inspired 10 athletes!', 'Inspiraste 10 atletas!', '❤️', 50, 'social'),
('social_50', 'Inspiration Hub', 'Centro de Inspiração', 'Inspired 50 athletes!', 'Inspiraste 50 atletas!', '✨', 250, 'social'),
('social_200', 'Influencer', 'Influencer', 'Inspired 200 athletes!', 'Inspiraste 200 atletas!', '📣', 1000, 'social'),
('social_1000', 'Icon', 'Ícone', 'Inspired 1000 athletes!', 'Inspiraste 1000 atletas!', '🌍', 5000, 'social'),
('midnight_trainer', 'Night Owl', 'Coruja da Noite', 'Workout between 11PM and 4AM.', 'Treinaste entre as 23h e as 4h.', '🦉', 100, 'special'),
('viking_spirit', 'Viking Spirit', 'Espírito Viking', 'Extreme intensity session.', 'Treino de altíssima intensidade.', '🪓', 500, 'special'),
('dawn_patrol', 'Dawn Patrol', 'Patrulha do Amanhecer', 'Workout before 7AM.', 'Treino antes das 7h da manhã.', '🌅', 100, 'special'),
('weekend_warrior', 'Weekend Warrior', 'Guerreiro de Fim de Semana', 'Train on both Saturday and Sunday.', 'Treina no Sábado e no Domingo.', '🛡️', 200, 'special'),
('speed_demon', 'Speed Demon', 'Demónio Veloz', 'High intensity in under 20 mins.', 'Alta intensidade em menos de 20 min.', '🏎️', 300, 'special'),
('social_butterfly', 'Social Butterfly', 'Socialite', 'Like 50 community workouts.', 'Gostaste de 50 treinos da comunidade.', '🦋', 250, 'social')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_pt = EXCLUDED.name_pt,
  description = EXCLUDED.description,
  description_pt = EXCLUDED.description_pt,
  icon = EXCLUDED.icon,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category;

-- 4. Create RPCs for atomic social operations to avoid race conditions and 409s
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

-- 5. Set requester (Bernardo) to Premium as requested
UPDATE public.profiles SET is_premium = true WHERE email = 'bernardoam05@ua.pt';
