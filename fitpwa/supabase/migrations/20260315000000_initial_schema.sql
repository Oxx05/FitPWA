-- Perfis de utilizador
create table profiles (
  id uuid references auth.users primary key,
  username text unique,
  full_name text,
  avatar_url text,
  weight_kg numeric,
  height_cm numeric,
  date_of_birth date,
  goal text check (goal in ('strength','hypertrophy','endurance','weight_loss','general')),
  experience_level text check (experience_level in ('beginner','intermediate','advanced')),
  preferred_equipment text[],  -- ['barbell','dumbbell','bodyweight','cables','machines']
  -- Gamification
  xp_total integer default 0,
  level integer default 1,
  login_streak integer default 0,
  last_login_date date,
  longest_streak integer default 0,
  -- Premium
  is_premium boolean default false,
  premium_expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exercícios (biblioteca global + custom do user)
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_pt text,
  muscle_groups text[] not null,  -- ['chest','triceps','shoulders']
  secondary_muscles text[],
  equipment text[],               -- ['barbell','bench']
  difficulty int check (difficulty between 1 and 5),
  instructions text,
  tips text,
  gif_url text,
  video_url text,
  is_custom boolean default false,
  created_by uuid references profiles(id),  -- null = biblioteca global
  is_premium boolean default false,
  created_at timestamptz default now()
);

-- Planos de treino
create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  name text not null,
  description text,
  type text check (type in (
    'full_body','push','pull','legs_quad','legs_posterior',
    'upper','lower','back_biceps','chest_triceps','shoulders_traps',
    'core','cardio_hiit','custom'
  )),
  days_per_week int,
  estimated_duration_min int,
  is_template boolean default false,   -- planos pré-definidos do sistema
  is_public boolean default false,
  order_index int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exercícios dentro de um plano (template de workout day)
create table plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references workout_plans(id) on delete cascade,
  exercise_id uuid references exercises(id),
  order_index int,
  sets int default 3,
  reps_min int,
  reps_max int,
  weight_kg numeric,
  rest_seconds int default 90,
  is_superset boolean default false,
  superset_group int,
  notes text
);

-- Sessões de treino realizadas
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  plan_id uuid references workout_plans(id),
  plan_name text,  -- snapshot do nome
  started_at timestamptz default now(),
  finished_at timestamptz,
  duration_seconds int,
  total_volume_kg numeric,  -- sum(sets * reps * weight)
  notes text,
  rating int check (rating between 1 and 5),
  mood text check (mood in ('great','good','okay','tired','bad')),
  xp_earned int default 0
);

-- Sets realizados numa sessão
create table session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions(id) on delete cascade,
  exercise_id uuid references exercises(id),
  exercise_name text,  -- snapshot
  set_number int,
  reps int,
  weight_kg numeric,
  duration_seconds int,  -- para exercícios isométricos
  rpe int check (rpe between 1 and 10),  -- Rate of Perceived Exertion
  is_warmup boolean default false,
  is_pr boolean default false,  -- Personal Record detectado automaticamente
  completed_at timestamptz default now()
);

-- Anotações (notas flexíveis)
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  session_id uuid references workout_sessions(id),
  exercise_id uuid references exercises(id),
  content text not null,
  tags text[],  -- ['PR','injury','easy','difficult','focus']
  pain_level int check (pain_level between 0 and 5),
  fatigue_level int check (fatigue_level between 0 and 5),
  created_at timestamptz default now()
);

-- Medições corporais
create table body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  weight_kg numeric,
  body_fat_pct numeric,
  chest_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  bicep_cm numeric,
  thigh_cm numeric,
  measured_at date default current_date
);

-- Conquistas disponíveis
create table achievements (
  id text primary key,  -- 'first_workout', 'streak_7', etc.
  name text not null,
  name_pt text,
  description text,
  description_pt text,
  icon text,  -- emoji ou nome de ícone
  xp_reward int default 0,
  category text check (category in ('milestone','streak','volume','social','special')),
  is_premium boolean default false
);

-- Conquistas desbloqueadas por utilizador
create table user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  achievement_id text references achievements(id),
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- Desafios semanais
create table weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text,  -- 'sessions_count', 'total_reps', 'new_exercise', 'volume'
  target_value int,
  xp_reward int,
  week_start date,
  week_end date
);

-- Progresso do utilizador em desafios
create table user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  challenge_id uuid references weekly_challenges(id),
  current_value int default 0,
  completed boolean default false,
  completed_at timestamptz,
  unique(user_id, challenge_id)
);

-- PRs históricos por exercício
create table personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  exercise_id uuid references exercises(id) not null,
  weight_kg numeric,
  reps int,
  one_rep_max numeric,  -- estimado: weight * (1 + reps/30)
  achieved_at timestamptz,
  session_id uuid references workout_sessions(id),
  unique(user_id, exercise_id)  -- guarda apenas o melhor
);

-- RLS Policies
alter table profiles enable row level security;
alter table workout_plans enable row level security;
alter table plan_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table session_sets enable row level security;
alter table notes enable row level security;
alter table body_measurements enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table weekly_challenges enable row level security;
alter table user_challenges enable row level security;
alter table personal_records enable row level security;
alter table exercises enable row level security;

-- Policies
create policy "Users see own profile" on profiles for all using (auth.uid() = id);
create policy "Users manage own workout_plans" on workout_plans for all using (auth.uid() = user_id);
-- Simplificando as policies de plan_exercises para owner do plan apenas usando joined query
create policy "Users manage plan_exercises via plan" on plan_exercises for all using (
  exists (select 1 from workout_plans wp where wp.id = plan_id and wp.user_id = auth.uid())
);
create policy "Users manage own workout_sessions" on workout_sessions for all using (auth.uid() = user_id);
create policy "Users manage session_sets via session" on session_sets for all using (
  exists (select 1 from workout_sessions ws where ws.id = session_id and ws.user_id = auth.uid())
);
create policy "Users manage own notes" on notes for all using (auth.uid() = user_id);
create policy "Users manage own body_measurements" on body_measurements for all using (auth.uid() = user_id);
create policy "Users see own achievements" on user_achievements for all using (auth.uid() = user_id);
create policy "Users see own challenges" on user_challenges for all using (auth.uid() = user_id);
create policy "Users see own records" on personal_records for all using (auth.uid() = user_id);

-- Achievements, Challenges globais (read-only for all authenticated)
create policy "Achievements visible to all" on achievements for select using (true);
create policy "Weekly challenges visible to all" on weekly_challenges for select using (true);

-- Exercises policies
create policy "Public exercises visible" on exercises for select using (is_custom = false or created_by = auth.uid());
create policy "Users manage own exercises" on exercises for all using (created_by = auth.uid());
