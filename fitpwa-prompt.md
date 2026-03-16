# FitPWA — Prompt de Execução Completo

## Contexto & Stack

Estás a construir uma **Progressive Web App (PWA) de treinos fitness** completa, production-ready, do zero.

**Stack obrigatória:**
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** TailwindCSS v3
- **State:** Zustand (global) + React Query v5 (server state)
- **Backend/Auth/DB:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Pagamentos:** Stripe (subscriptions) + Stripe Webhooks
- **Email:** Resend (transaccional)
- **Deploy:** Vercel
- **PWA:** vite-plugin-pwa + Workbox
- **Offline DB:** Dexie.js (IndexedDB wrapper)
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Animações:** Framer Motion
- **Icons:** Lucide React
- **Drag & Drop:** @dnd-kit/core

---

## Arquitectura Geral

```
src/
├── app/                    # Providers, Router, App.tsx
├── features/               # Feature-first structure
│   ├── auth/
│   ├── workouts/
│   ├── exercises/
│   ├── session/            # Sessão de treino activa
│   ├── progress/
│   ├── notes/
│   ├── gamification/
│   ├── premium/
│   └── profile/
├── shared/
│   ├── components/         # UI primitives (Button, Card, Modal…)
│   ├── hooks/
│   ├── lib/                # supabase.ts, stripe.ts, dexie.ts
│   └── utils/
├── db/                     # Dexie schema (offline)
└── supabase/
    ├── migrations/
    └── functions/          # Edge Functions
```

---

## Base de Dados — Supabase (PostgreSQL)

Cria todas as tabelas com RLS (Row Level Security) activado. Cada user só vê os seus próprios dados.

```sql
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
  created_at timestamptz default now()
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
  user_id uuid references profiles(id),
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
```

**RLS Policies (aplicar a todas as tabelas com user_id):**
```sql
alter table profiles enable row level security;
create policy "Users see own profile" on profiles for all using (auth.uid() = id);
-- Repetir padrão para: workout_plans, plan_exercises, workout_sessions,
-- session_sets, notes, body_measurements, user_achievements, user_challenges,
-- personal_records
-- exercises: todos podem ver globais, só owner vê custom
create policy "Public exercises visible" on exercises for select using (is_custom = false or created_by = auth.uid());
create policy "Users manage own exercises" on exercises for all using (created_by = auth.uid());
```

---

## Supabase Edge Functions

### `/functions/stripe-webhook`
```typescript
// Ouve eventos Stripe e sincroniza com Supabase
// Eventos a tratar:
// - customer.subscription.created → is_premium = true
// - customer.subscription.updated → actualizar premium_expires_at
// - customer.subscription.deleted → is_premium = false
// - checkout.session.completed → guardar stripe_customer_id
```

### `/functions/calculate-xp`
```typescript
// Chamada após cada sessão completada
// Input: { session_id, user_id }
// Lógica:
// - Base XP: 100 por sessão
// - Bónus duração: +1 XP por minuto acima de 30min
// - Bónus PR: +50 XP por PR detectado
// - Bónus streak: +10 XP × min(streak_days, 10)
// - Bónus volume: +1 XP por cada 1000kg de volume
// Output: actualizar profiles.xp_total, verificar level up, verificar conquistas
```

### `/functions/check-achievements`
```typescript
// Chamada após calculate-xp
// Verifica todas as conquistas não desbloqueadas e desbloqueia as que cumprem critérios
// Envia email via Resend se achievement especial for desbloqueado
```

---

## Feature: Autenticação (`/features/auth`)

**Ficheiros:**
- `AuthProvider.tsx` — contexto global, ouve `supabase.auth.onAuthStateChange`
- `LoginPage.tsx` — email/password + Google OAuth
- `RegisterPage.tsx` — registo + criação de perfil inicial
- `OnboardingFlow.tsx` — 4 steps após primeiro login:
  1. Nome + avatar
  2. Objetivo + nível de experiência
  3. Equipamento disponível
  4. Recomendação de plano automática baseada nas respostas

**Hook `useAuth`:**
```typescript
export const useAuth = () => {
  const session = // supabase session
  const profile = // perfil completo do user
  const isPremium = profile?.is_premium && new Date(profile.premium_expires_at) > new Date()
  return { session, user: session?.user, profile, isPremium, signOut }
}
```

---

## Feature: Motor de Treinos (`/features/workouts`)

### Planos pré-definidos a seed na base de dados:

```typescript
const PRESET_PLANS = [
  {
    name: "Full Body 3x",
    type: "full_body",
    days_per_week: 3,
    description: "Treino completo 3x por semana. Ideal para iniciantes e intermediários.",
    exercises: [
      { name: "Agachamento com Barra", sets: 4, reps_min: 6, reps_max: 10 },
      { name: "Supino Plano", sets: 4, reps_min: 6, reps_max: 10 },
      { name: "Remada com Barra", sets: 4, reps_min: 6, reps_max: 10 },
      { name: "Press Militar", sets: 3, reps_min: 8, reps_max: 12 },
      { name: "Peso Morto Romeno", sets: 3, reps_min: 8, reps_max: 12 },
      { name: "Curl de Bíceps", sets: 3, reps_min: 10, reps_max: 15 },
    ]
  },
  {
    name: "Push (Peito, Ombros, Tríceps)",
    type: "push",
    days_per_week: null,
    exercises: [
      { name: "Supino Plano com Barra", sets: 4, reps_min: 6, reps_max: 10 },
      { name: "Supino Inclinado com Halteres", sets: 3, reps_min: 8, reps_max: 12 },
      { name: "Press Militar com Barra", sets: 4, reps_min: 6, reps_max: 10 },
      { name: "Elevações Laterais", sets: 4, reps_min: 12, reps_max: 15 },
      { name: "Extensão de Tríceps na Polia", sets: 3, reps_min: 12, reps_max: 15 },
      { name: "Mergulhos (Dips)", sets: 3, reps_min: 8, reps_max: 12 },
    ]
  },
  {
    name: "Pull (Costas, Bíceps)",
    type: "pull",
    exercises: [
      { name: "Peso Morto Convencional", sets: 4, reps_min: 4, reps_max: 6 },
      { name: "Puxada na Polia Alta", sets: 4, reps_min: 8, reps_max: 12 },
      { name: "Remada Sentado na Polia", sets: 4, reps_min: 8, reps_max: 12 },
      { name: "Face Pulls", sets: 3, reps_min: 15, reps_max: 20 },
      { name: "Curl de Martelo", sets: 3, reps_min: 10, reps_max: 15 },
      { name: "Curl Inclinado com Halteres", sets: 3, reps_min: 10, reps_max: 15 },
    ]
  },
  {
    name: "Pernas (Quad Focus)",
    type: "legs_quad",
    exercises: [
      { name: "Agachamento com Barra", sets: 5, reps_min: 5, reps_max: 8 },
      { name: "Leg Press 45°", sets: 4, reps_min: 10, reps_max: 15 },
      { name: "Extensão de Quadríceps", sets: 3, reps_min: 12, reps_max: 15 },
      { name: "Afundo com Halteres", sets: 3, reps_min: 10, reps_max: 12 },
      { name: "Elevação de Gémeos em Pé", sets: 4, reps_min: 15, reps_max: 20 },
    ]
  },
  {
    name: "Pernas (Posterior)",
    type: "legs_posterior",
    exercises: [
      { name: "Peso Morto Romeno", sets: 4, reps_min: 8, reps_max: 10 },
      { name: "Leg Curl Deitado", sets: 4, reps_min: 10, reps_max: 15 },
      { name: "Hip Thrust com Barra", sets: 4, reps_min: 10, reps_max: 15 },
      { name: "Agachamento Búlgaro", sets: 3, reps_min: 10, reps_max: 12 },
      { name: "Elevação de Gémeos Sentado", sets: 4, reps_min: 15, reps_max: 20 },
    ]
  },
  {
    name: "Upper Body",
    type: "upper",
    exercises: [
      { name: "Supino Plano com Barra", sets: 4, reps_min: 6, reps_max: 10 },
      { name: "Remada com Barra", sets: 4, reps_min: 6, reps_max: 10 },
      { name: "Press Militar com Halteres", sets: 3, reps_min: 8, reps_max: 12 },
      { name: "Puxada na Polia Alta", sets: 3, reps_min: 8, reps_max: 12 },
      { name: "Curl de Bíceps com Barra", sets: 3, reps_min: 10, reps_max: 15 },
      { name: "Extensão de Tríceps na Testa", sets: 3, reps_min: 10, reps_max: 15 },
    ]
  },
  {
    name: "Lower Body",
    type: "lower",
    exercises: [
      { name: "Agachamento com Barra", sets: 4, reps_min: 6, reps_max: 8 },
      { name: "Peso Morto Romeno", sets: 4, reps_min: 8, reps_max: 10 },
      { name: "Leg Press 45°", sets: 3, reps_min: 10, reps_max: 15 },
      { name: "Hip Thrust com Barra", sets: 3, reps_min: 10, reps_max: 15 },
      { name: "Leg Curl na Máquina", sets: 3, reps_min: 12, reps_max: 15 },
      { name: "Elevação de Gémeos em Pé", sets: 4, reps_min: 15, reps_max: 20 },
    ]
  },
]
```

### Editor de Treinos (`WorkoutEditor.tsx`)
- Lista de exercícios com drag & drop (@dnd-kit)
- Por exercício: sets, reps (min–max), peso inicial sugerido, descanso
- Toggle superset: ao activar, agrupa visualmente com o exercício anterior
- Botão "Adicionar exercício" → abre sheet lateral com pesquisa + filtros
- Botão "Substituir" em cada exercício → sugere alternativas do mesmo grupo muscular
- Guardar automaticamente com debounce 500ms

---

## Feature: Sessão Activa (`/features/session`)

Esta é a feature mais crítica. O utilizador não pode perder dados se fechar o browser.

### `ActiveSessionProvider.tsx`
Estado global da sessão activa persistido em IndexedDB (Dexie):

```typescript
interface ActiveSession {
  id: string
  planId: string
  planName: string
  startedAt: Date
  currentExerciseIndex: number
  currentSetIndex: number
  sets: SessionSetLog[]  // todos os sets realizados
  timerState: 'idle' | 'active' | 'rest'
  restSeconds: number
}
```

### `SessionScreen.tsx` — Flow completo:
1. **Header:** nome do treino + duração a contar + botão terminar
2. **Exercício actual:** nome + grupo muscular + gif/miniatura
3. **Sets:** lista com estado (done/active/pending), campo de peso e reps inline
4. **Timer de descanso:** conta decrescente após confirmar set, vibração no fim (Navigator.vibrate)
5. **Navegação:** swipe ou botões para exercício anterior/seguinte
6. **Adicionar set extra:** botão "+" no final da lista de sets
7. **Substituir exercício:** sheet com alternativas do mesmo músculo
8. **Wake Lock:** `navigator.wakeLock.request('screen')` para manter ecrã ligado
9. **Guardar offline:** cada set confirmado → Dexie.js imediatamente
10. **Sync:** quando sessão termina → upload para Supabase → calcular XP → verificar PRs → verificar conquistas

### Detecção automática de PRs:
```typescript
// Após cada set completado com peso > 0
const estimatedOneRepMax = weight * (1 + reps / 30)  // Epley formula
const previousBest = await getPreviousRecord(exerciseId)
if (estimatedOneRepMax > previousBest.one_rep_max) {
  // Marcar set como PR, mostrar animação, +50 XP
}
```

### Resumo pós-treino (`SessionSummary.tsx`):
- Duração total
- Volume total (kg)
- PRs alcançados (lista)
- XP ganho (animação de contagem)
- Level up se aplicável (animação)
- Conquistas desbloqueadas
- Campo de nota + rating de humor (1–5 emojis)
- Botão partilhar (gera imagem com Web Share API)

---

## Feature: Anotações (`/features/notes`)

### `NoteEditor.tsx`
Aparece em 3 contextos:
1. **Durante sessão** — nota rápida por exercício (sheet bottom)
2. **Pós-sessão** — nota geral da sessão
3. **Vista histórico** — editar notas passadas

Campos:
- Texto livre (textarea)
- Tags rápidas (chips seleccionáveis): PR, Lesão, Fácil, Difícil, Foco, Cansado
- Escala de dor (0–5): só aparece se tag "Lesão" activa
- Escala de fadiga (0–5)

### `ExerciseHistory.tsx`
Para cada exercício, vista de histórico que mostra:
- Gráfico de linha: peso max por sessão ao longo do tempo
- Lista de sessões com: data, sets × reps × peso, nota
- PRs marcados com destaque

---

## Feature: Progresso (`/features/progress`)

### Dashboard de progresso (`ProgressDashboard.tsx`):

**Secção 1 — Resumo Semanal:**
- Treinos esta semana vs meta
- Volume esta semana vs semana anterior (%)
- Streak actual

**Secção 2 — Gráficos (Recharts):**
- Volume semanal — BarChart (últimas 8 semanas)
- Frequência — heatmap estilo GitHub (últimos 6 meses, usar SVG custom)
- Peso corporal — LineChart com trend line
- 1RM por exercício — LineChart, selector de exercício

**Secção 3 — PRs Recentes:**
- Lista dos últimos PRs com exercício + peso + data

**Secção 4 — Grupos Musculares:**
- Radar chart ou bar chart mostrando frequência por músculo no último mês

---

## Feature: Gamification (`/features/gamification`)

### Sistema de XP & Níveis:
```typescript
const LEVELS = [
  { level: 1, name: "Iniciante",    xp_required: 0,     icon: "🌱" },
  { level: 2, name: "Aprendiz",     xp_required: 500,   icon: "💪" },
  { level: 3, name: "Intermédio",   xp_required: 1500,  icon: "🔥" },
  { level: 4, name: "Avançado",     xp_required: 3500,  icon: "⚡" },
  { level: 5, name: "Expert",       xp_required: 7000,  icon: "🏆" },
  { level: 6, name: "Elite",        xp_required: 15000, icon: "💎" },
  { level: 7, name: "Lenda",        xp_required: 30000, icon: "👑" },
]
```

### Recompensas de Login Diário:
```typescript
// Executar em useEffect no AppShell após login
const checkDailyLogin = async () => {
  const today = new Date().toDateString()
  const lastLogin = profile.last_login_date

  if (lastLogin === today) return  // já fez check-in hoje

  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const newStreak = lastLogin === yesterday ? profile.login_streak + 1 : 1

  // Recompensas por milestone
  const STREAK_REWARDS = {
    3:  { xp: 50,  badge: null,          message: "3 dias seguidos! +50 XP" },
    7:  { xp: 150, badge: "streak_week", message: "1 semana! +150 XP 🔥" },
    14: { xp: 300, badge: "streak_2w",   message: "2 semanas! +300 XP ⚡" },
    30: { xp: 750, badge: "streak_month",message: "1 mês! +750 XP 💎" },
    60: { xp: 1500,badge: "streak_2m",   message: "2 meses! +1500 XP 👑" },
    90: { xp: 3000,badge: "streak_3m",   message: "3 meses! +3000 XP 🏆" },
  }

  // Actualizar Supabase + mostrar toast animado com recompensa
}
```

### Conquistas a seed:
```typescript
const ACHIEVEMENTS = [
  // Milestone
  { id: "first_workout",    name: "Primeiro Passo",       xp: 100,  icon: "🌱", category: "milestone" },
  { id: "workouts_10",      name: "10 Treinos",           xp: 200,  icon: "💪", category: "milestone" },
  { id: "workouts_50",      name: "50 Treinos",           xp: 500,  icon: "🔥", category: "milestone" },
  { id: "workouts_100",     name: "Centenário",           xp: 1000, icon: "💯", category: "milestone" },
  { id: "workouts_365",     name: "Um Ano de Treino",     xp: 3000, icon: "📅", category: "milestone" },
  // Streak
  { id: "streak_7",         name: "Semana Perfeita",      xp: 150,  icon: "🗓️", category: "streak" },
  { id: "streak_30",        name: "Mês Imparável",        xp: 750,  icon: "📆", category: "streak" },
  { id: "streak_90",        name: "90 Dias Seguidos",     xp: 2000, icon: "🏅", category: "streak" },
  // Volume
  { id: "volume_10k",       name: "10 Toneladas",         xp: 300,  icon: "⚖️", category: "volume" },
  { id: "volume_100k",      name: "100 Toneladas",        xp: 1000, icon: "🏋️", category: "volume" },
  { id: "first_pr",         name: "Primeiro PR",          xp: 200,  icon: "🎯", category: "milestone" },
  { id: "pr_streak_5",      name: "5 PRs numa Semana",    xp: 500,  icon: "📈", category: "volume" },
  // Social/Special
  { id: "plan_creator",     name: "Arquitecto do Treino", xp: 150,  icon: "✏️", category: "special" },
  { id: "all_muscles",      name: "Full Body Master",     xp: 400,  icon: "🧬", category: "special" },
  { id: "early_bird",       name: "Madrugador",           xp: 200,  icon: "🌅", category: "special" },  // treino antes das 7h
  { id: "night_owl",        name: "Coruja Noturna",       xp: 200,  icon: "🦉", category: "special" },  // treino depois das 22h
]
```

### `AchievementToast.tsx`
Animação Framer Motion quando conquista é desbloqueada:
- Slide up from bottom
- Partículas/confetti leve (canvas simples)
- Nome da conquista + XP ganho
- Auto-dismiss 4 segundos

### `LevelUpModal.tsx`
Modal full-screen quando sobe de nível:
- Novo nível + nome + ícone (animação de scale)
- Barra de XP a encher até overflow
- Confetti
- Botão "Continuar"

---

## Feature: Premium (`/features/premium`)

### Stripe Setup:
```typescript
// lib/stripe.ts — client
import { loadStripe } from '@stripe/stripe-js'
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Supabase Edge Function: /functions/create-checkout-session
// Cria Stripe Checkout Session e retorna URL
// Preços:
// - Mensal: €7.99/mês
// - Anual: €63.99/ano (~€5.33/mês, "33% off")
// - Trial: 7 dias grátis em ambos
```

### `PremiumPaywall.tsx`
Componente reutilizável que aparece quando user free tenta aceder a feature premium:
- Lista do que está incluído no premium
- Preços mensal/anual com toggle
- CTA "Começar 7 dias grátis"
- Ao clicar → redirect para Stripe Checkout

### Funcionalidades bloqueadas no free:
- Mais de 3 planos activos → paywall
- Analytics avançado (charts de progresso detalhado) → paywall + preview desfocada
- Histórico > 30 dias → paywall
- Exportação de dados → paywall
- Exercícios marcados `is_premium = true` → paywall
- Temas visuais extra → paywall

---

## Dexie.js — Schema Offline

```typescript
// db/fitpwa.db.ts
import Dexie, { type Table } from 'dexie'

export class FitPWADatabase extends Dexie {
  activeSessions!: Table<ActiveSessionRecord>
  pendingSync!: Table<PendingSyncRecord>
  cachedExercises!: Table<ExerciseRecord>
  cachedPlans!: Table<WorkoutPlanRecord>

  constructor() {
    super('FitPWADB')
    this.version(1).stores({
      activeSessions: 'id, userId, startedAt',
      pendingSync: '++id, type, createdAt, synced',
      cachedExercises: 'id, name, *muscleGroups',
      cachedPlans: 'id, userId, updatedAt',
    })
  }
}

export const db = new FitPWADatabase()
```

**Estratégia de sync:**
1. Qualquer escrita vai primeiro para Dexie
2. Se online → tenta sync imediato para Supabase
3. Se offline → fica em `pendingSync` com `synced: false`
4. Service Worker ouve `sync` event (Background Sync API) → processa fila quando recupera ligação
5. Ao abrir app → verificar `pendingSync` e processar

---

## PWA Configuration

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
        handler: 'CacheFirst',
        options: { cacheName: 'exercise-gifs', expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 } }
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest/,
        handler: 'NetworkFirst',
        options: { cacheName: 'api-cache', expiration: { maxAgeSeconds: 5 * 60 } }
      }
    ]
  },
  manifest: {
    name: 'FitPWA',
    short_name: 'FitPWA',
    theme_color: '#0a0a0a',
    background_color: '#0a0a0a',
    display: 'standalone',
    orientation: 'portrait',
    categories: ['fitness', 'health'],
    screenshots: [/* mobile screenshots */]
  }
})
```

---

## Navegação & Routing

```
/                     → redirect para /dashboard ou /login
/login                → LoginPage
/register             → RegisterPage
/onboarding           → OnboardingFlow (só após primeiro registo)

/dashboard            → Home (resumo, streak, planos recentes, desafio semanal)
/workouts             → Lista de planos
/workouts/new         → Criar plano novo
/workouts/:id         → Detalhe do plano
/workouts/:id/edit    → Editar plano
/workouts/:id/start   → Inicia sessão activa → redireciona para /session

/session              → Sessão activa (protegida — só acessível quando há sessão activa)
/session/summary      → Resumo pós-treino

/exercises            → Biblioteca de exercícios
/exercises/:id        → Detalhe + histórico do exercício

/progress             → Dashboard de progresso
/notes                → Histórico de notas

/achievements         → Conquistas + XP + nível
/challenges           → Desafios semanais

/premium              → Página de upgrade
/profile              → Perfil + medições
/settings             → Preferências, notificações, tema
```

---

## Emails com Resend

Enviar via Supabase Edge Functions:

```typescript
// Emails a enviar:
// 1. Welcome email após registo
// 2. Achievement desbloqueado (conquistas especiais: primeiro PR, streak 30 dias, nível 5+)
// 3. Streak em risco (se não fez login há 20h e tem streak > 7 dias)
// 4. Resumo semanal (cada segunda-feira: treinos da semana, PRs, XP ganho)
// 5. Confirmação de subscrição premium
// 6. Cancelamento de premium (com oferta de retentção)
```

---

## Variáveis de Ambiente

```env
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Supabase Edge Functions secrets (via Supabase dashboard)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Design System & UI

**Tema:** Dark mode como default. Fundo `#0a0a0a`, superfícies `#111111` e `#1a1a1a`. Accent: verde energético `#00ff87` (ou variante sua para AAA contrast). Erros em vermelho, PRs em dourado.

**Fontes:** `Geist` (corpo) + `Geist Mono` (números/dados). Via Vercel Fonts ou Google Fonts.

**Componentes essenciais a construir:**
- `Button` — variants: primary, secondary, ghost, danger
- `Card` — surface com padding e border-radius consistentes
- `Sheet` — bottom sheet para mobile (Framer Motion drag to dismiss)
- `Modal` — centrado com backdrop
- `Timer` — display circular com countdown animado
- `XPBar` — barra de progresso animada com partículas no fill
- `AchievementCard` — card com ícone, nome, estado locked/unlocked
- `StreakCalendar` — calendário de actividade tipo GitHub heatmap
- `ExerciseCard` — card com gif preview, músculo, dificuldade
- `SetRow` — linha editável inline para séries (peso + reps)
- `PRBadge` — badge animado "PR" em dourado
- `PremiumLock` — ícone + tooltip com CTA upgrade

**Mobile-first:** Todos os layouts devem funcionar em 375px. Navigation bar fixa em baixo com 5 tabs: Home, Treinos, Sessão (centro, destaque), Progresso, Perfil.

---

## Checklist de Implementação

### Fase 0 — Setup (Dia 1–2)
- [ ] `npm create vite@latest fitpwa -- --template react-ts`
- [ ] Instalar todas as dependências
- [ ] Configurar TailwindCSS + design tokens
- [ ] Configurar Supabase client
- [ ] Configurar vite-plugin-pwa
- [ ] Setup Dexie.js database
- [ ] Deploy inicial no Vercel (CI/CD automático)
- [ ] Criar projecto Supabase + correr migrations
- [ ] Seed exercícios base (mínimo 50) + planos pré-definidos

### Fase 1 — Auth & Onboarding (Dia 3–4)
- [ ] Páginas login/registo com Supabase Auth
- [ ] Google OAuth configurado
- [ ] OnboardingFlow (4 steps)
- [ ] Perfil basic CRUD
- [ ] Protecção de rotas

### Fase 2 — Workouts (Dia 5–9)
- [ ] Lista de planos
- [ ] Editor de planos (drag & drop)
- [ ] Biblioteca de exercícios com pesquisa
- [ ] Sessão activa completa (o mais crítico)
- [ ] Persistência offline
- [ ] Resumo pós-sessão
- [ ] Detecção de PRs

### Fase 3 — Anotações & Progresso (Dia 10–12)
- [ ] Sistema de notas (sessão + exercício)
- [ ] Dashboard de progresso
- [ ] Gráficos (Recharts)
- [ ] Heatmap de actividade
- [ ] Histórico por exercício

### Fase 4 — Gamification (Dia 13–16)
- [ ] Sistema XP + níveis
- [ ] Streak diário + recompensas
- [ ] Conquistas (seed + lógica de detecção)
- [ ] Desafios semanais
- [ ] Animações (level up, achievement toast)

### Fase 5 — Premium & Emails (Dia 17–19)
- [ ] Stripe integration (checkout + webhook)
- [ ] Paywall components
- [ ] Feature gating (free vs premium)
- [ ] Resend emails (welcome, streak warning, weekly summary)

### Fase 6 — Polimento (Dia 20–21)
- [ ] Onboarding melhorado
- [ ] Performance (lazy loading, code splitting)
- [ ] Lighthouse PWA 95+
- [ ] Testes básicos (Vitest + React Testing Library)
- [ ] Error boundaries
- [ ] Empty states para todas as vistas

---

## Notas Importantes

1. **Sessão activa é sagrada** — nunca perder dados. Sempre Dexie primeiro, Supabase depois.
2. **Wake Lock API** para sessão — sem isto o ecrã apaga durante o treino.
3. **Optimistic updates** com React Query para feedback imediato.
4. **Prefetch** da biblioteca de exercícios no service worker — o utilizador vai querer pesquisar offline.
5. **Números de RLS** — testar todas as políticas em modo anónimo.
6. **Stripe Webhooks** — usar `stripe.webhooks.constructEvent` para verificar assinatura.
7. **Sem `any` em TypeScript** — gerar tipos a partir do schema Supabase com `supabase gen types`.
8. **Accessibility** — inputs de peso/reps devem ter labels corretos, timers devem ter aria-live.
