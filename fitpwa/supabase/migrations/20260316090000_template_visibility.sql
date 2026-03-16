-- Allow all authenticated users to read base template plans and their exercises

-- workout_plans: templates visible to all
alter table public.workout_plans enable row level security;

drop policy if exists "Templates visible to all" on public.workout_plans;
create policy "Templates visible to all"
  on public.workout_plans
  for select
  using (is_template = true);

-- plan_exercises: allow reading exercises for template plans
alter table public.plan_exercises enable row level security;

drop policy if exists "Template plan_exercises visible" on public.plan_exercises;
create policy "Template plan_exercises visible"
  on public.plan_exercises
  for select
  using (
    exists (
      select 1
      from public.workout_plans wp
      where wp.id = plan_id
        and wp.is_template = true
    )
  );
