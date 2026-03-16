-- Personal record history (immutable log of new PRs)
create table if not exists public.personal_record_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  exercise_id uuid references exercises(id) not null,
  weight_kg numeric,
  reps int,
  one_rep_max numeric,
  achieved_at timestamptz default now()
);

alter table public.personal_record_history enable row level security;

drop policy if exists "Users can view their PR history" on public.personal_record_history;
create policy "Users can view their PR history"
  on public.personal_record_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their PR history" on public.personal_record_history;
create policy "Users can insert their PR history"
  on public.personal_record_history
  for insert
  with check (auth.uid() = user_id);

create index if not exists idx_pr_history_user_id on public.personal_record_history(user_id);
create index if not exists idx_pr_history_exercise_id on public.personal_record_history(exercise_id);
