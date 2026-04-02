-- ============================================================
-- Personal Trainer PWA — Supabase Schema  (v2 — clean slate)
-- ============================================================
-- IMPORTANT: This script drops any existing tables and rebuilds
-- them from scratch. Run this in Supabase SQL Editor.
-- ============================================================

-- ── 0. CLEAN SLATE ────────────────────────────────────────────
-- Drop in reverse-dependency order so FK constraints don't block.
drop table if exists public.custom_exercises cascade;
drop table if exists public.session_logs      cascade;
drop table if exists public.session_packages  cascade;
drop table if exists public.workout_sets      cascade;
drop table if exists public.routines          cascade;
drop table if exists public.profiles          cascade;

-- Also drop the trigger function if it exists
drop function if exists public.handle_new_user() cascade;

-- ── 1. PROFILES ───────────────────────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  name            text not null default '',
  role            text not null default 'client' check (role in ('admin','client')),
  -- trainer_id: for a client → their assigned trainer
  --             for a sub-trainer → their master admin
  --             for a master admin → null
  trainer_id      uuid references public.profiles(id) on delete set null,
  phone           text,
  gender          text check (gender in ('male','female','other')),
  weight          numeric,
  height          numeric,
  goal            text check (goal in ('strength','hypertrophy','endurance','weight_loss','fat_loss')),
  goal_weight     numeric,
  body_fat        numeric,
  activity_level  text check (activity_level in ('sedentary','active','athlete')),
  created_at      timestamptz not null default now()
);

-- Auto-create a profile row when a new Supabase Auth user signs up
create function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. ROUTINES ───────────────────────────────────────────────
create table public.routines (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  author_id           uuid references public.profiles(id) on delete set null,
  name                text not null,
  description         text,
  rationale           text not null default '',
  days                jsonb not null default '[]',
  current_day_index   int  not null default 0,
  start_date          bigint not null default extract(epoch from now())*1000,
  last_modified       bigint not null default extract(epoch from now())*1000,
  created_at          timestamptz not null default now()
);

-- ── 3. WORKOUT SETS (History) ─────────────────────────────────
create table public.workout_sets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  exercise_id   text not null,
  weight        numeric not null default 0,
  reps          int     not null default 0,
  duration      int,
  rpe           numeric,
  completed_at  bigint  not null,
  created_at    timestamptz not null default now()
);

-- ── 4. SESSION PACKAGES ───────────────────────────────────────
create table public.session_packages (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.profiles(id) on delete cascade,
  trainer_id          uuid not null references public.profiles(id) on delete cascade,
  total_sessions      int  not null default 0,
  sessions_used       int  not null default 0,
  sessions_remaining  int  not null default 0,
  expiry_date         timestamptz,
  created_at          timestamptz not null default now(),
  unique (client_id)
);

-- ── 5. SESSION LOGS ───────────────────────────────────────────
create table public.session_logs (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.profiles(id) on delete cascade,
  trainer_id            uuid not null references public.profiles(id) on delete cascade,
  timestamp             bigint not null,
  verification_method   text   not null check (verification_method in ('qr_scan','manual')),
  status                text   not null default 'completed',
  nonce                 text   not null unique,
  created_at            timestamptz not null default now()
);

-- ── 6. CUSTOM EXERCISES ───────────────────────────────────────
create table public.custom_exercises (
  id              uuid primary key default gen_random_uuid(),
  trainer_id      uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  primary_axis    text not null,
  tracking_type   text not null check (tracking_type in ('reps','time')),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles         enable row level security;
alter table public.routines         enable row level security;
alter table public.workout_sets     enable row level security;
alter table public.session_packages enable row level security;
alter table public.session_logs     enable row level security;
alter table public.custom_exercises enable row level security;

-- ── PROFILES ──────────────────────────────────────────────────

-- Own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Trainers can see their direct clients/sub-trainers
create policy "profiles_select_my_clients" on public.profiles
  for select using (trainer_id = auth.uid());

-- Any trainer in same org can search clients by name/email (for cross-trainer lookup)
-- "same org" = sharing the same master trainer_id chain
create policy "profiles_select_same_org" on public.profiles
  for select using (
    role = 'client' and
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role = 'admin'
        and (
          -- my direct client
          profiles.trainer_id = auth.uid()
          -- OR client of a trainer who shares my master admin
          or profiles.trainer_id in (
            select id from public.profiles
            where trainer_id = me.trainer_id
               or trainer_id = auth.uid()
               or id = me.trainer_id
          )
        )
    )
  );

-- Users update own profile
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Trainer updates their clients
create policy "profiles_update_my_clients" on public.profiles
  for update using (trainer_id = auth.uid());

-- Allow profile creation (trigger + admin creating clients)
create policy "profiles_insert" on public.profiles
  for insert with check (true);

-- ── ROUTINES ──────────────────────────────────────────────────
create policy "routines_select" on public.routines
  for select using (
    user_id = auth.uid() or
    author_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = user_id and p.trainer_id = auth.uid())
  );

create policy "routines_insert" on public.routines
  for insert with check (
    user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = user_id and p.trainer_id = auth.uid())
  );

create policy "routines_update" on public.routines
  for update using (
    author_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = user_id and p.trainer_id = auth.uid())
  );

create policy "routines_delete" on public.routines
  for delete using (
    author_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = user_id and p.trainer_id = auth.uid())
  );

-- ── WORKOUT SETS ──────────────────────────────────────────────

-- Own data OR direct client OR same-org client (cross-trainer read, on-demand)
create policy "workout_sets_select" on public.workout_sets
  for select using (
    user_id = auth.uid()
    or
    -- Direct: client is mine
    exists (
      select 1 from public.profiles p
      where p.id = user_id and p.trainer_id = auth.uid()
    )
    or
    -- Cross-org: I'm an admin and this client's trainer shares my master admin
    exists (
      select 1 from public.profiles client_p
      join public.profiles me on me.id = auth.uid()
      where client_p.id = user_id
        and client_p.role = 'client'
        and me.role = 'admin'
        and (
          client_p.trainer_id in (
            select id from public.profiles
            where trainer_id = me.trainer_id
               or trainer_id = auth.uid()
               or id = me.trainer_id
          )
        )
    )
  );

create policy "workout_sets_insert" on public.workout_sets
  for insert with check (user_id = auth.uid());

create policy "workout_sets_update" on public.workout_sets
  for update using (user_id = auth.uid());

-- ── SESSION PACKAGES ──────────────────────────────────────────
create policy "session_packages_select" on public.session_packages
  for select using (client_id = auth.uid() or trainer_id = auth.uid());

create policy "session_packages_insert" on public.session_packages
  for insert with check (trainer_id = auth.uid());

create policy "session_packages_update" on public.session_packages
  for update using (trainer_id = auth.uid());

-- ── SESSION LOGS ──────────────────────────────────────────────
create policy "session_logs_select" on public.session_logs
  for select using (client_id = auth.uid() or trainer_id = auth.uid());

create policy "session_logs_insert" on public.session_logs
  for insert with check (trainer_id = auth.uid());

-- ── CUSTOM EXERCISES ──────────────────────────────────────────
create policy "custom_exercises_select" on public.custom_exercises
  for select using (
    trainer_id = auth.uid() or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.trainer_id = custom_exercises.trainer_id
    )
  );

create policy "custom_exercises_insert" on public.custom_exercises
  for insert with check (trainer_id = auth.uid());

create policy "custom_exercises_delete" on public.custom_exercises
  for delete using (trainer_id = auth.uid());

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_profiles_trainer_id      on public.profiles(trainer_id);
create index idx_routines_user_id         on public.routines(user_id);
create index idx_workout_sets_user_id     on public.workout_sets(user_id);
create index idx_session_logs_client_id   on public.session_logs(client_id);
create index idx_custom_exercises_trainer on public.custom_exercises(trainer_id);
-- Index for name/email search (cross-trainer lookup)
create index idx_profiles_name_search     on public.profiles using gin(to_tsvector('simple', name || ' ' || email));
