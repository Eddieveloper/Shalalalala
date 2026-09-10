-- =====================================================================
-- REBALANCE DATABASE SCHEMA & ROW LEVEL SECURITY POLICIES
-- PostgreSQL + Supabase
-- =====================================================================

create extension if not exists "uuid-ossp";

-- 1. User Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  daily_calorie_target int default 2200 not null,
  sleep_start_time time default '23:00' not null,
  sleep_end_time time default '07:00' not null,
  max_daily_study_minutes int default 360,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Activity Blueprints
create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category text check (category in ('academic', 'fitness', 'meal')) not null,
  target_value int not null, -- minutes for study/fitness, calories for meals
  is_compensable boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. University Subjects
create table if not exists university_subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  course_code text not null,
  professor text,
  credits int default 3 not null,
  color text default '#d86894' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Calendar Scheduled Blocks
create table if not exists schedule_blocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  activity_id uuid references activities on delete set null,
  subject_id uuid references university_subjects on delete set null,
  title text not null,
  category text check (category in ('academic', 'fitness', 'meal')) not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  target_value int not null,
  actual_value int default 0,
  status text check (status in ('scheduled', 'completed', 'missed', 'compensated')) default 'scheduled',
  is_buffer boolean default false,
  reschedule_metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table schedule_blocks add column if not exists subject_id uuid references university_subjects on delete set null;

-- 5. Daily Nutrition Logs
create table if not exists nutrition_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')) not null,
  target_calories int not null,
  actual_calories int default null,
  status text check (status in ('pending', 'logged', 'skipped')) default 'pending',
  window_start time not null,
  window_end time not null,
  unique(user_id, date, meal_type)
);

-- 6. Activity Debt Ledger
create table if not exists activity_debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  source_block_id uuid references schedule_blocks on delete cascade,
  category text check (category in ('academic', 'fitness', 'nutrition')) not null,
  deficit_amount int not null,
  status text check (status in ('unresolved', 'resolved', 'forgiven')) default 'unresolved',
  resolved_at timestamptz default null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Indexes for optimal lookup performance
create index if not exists idx_schedule_blocks_user_time on schedule_blocks(user_id, start_time, end_time);
create index if not exists idx_schedule_blocks_status on schedule_blocks(user_id, status);
create index if not exists idx_university_subjects_user on university_subjects(user_id);
create index if not exists idx_nutrition_logs_user_date on nutrition_logs(user_id, date);
create index if not exists idx_activity_debts_status on activity_debts(user_id, status);

-- Enable RLS & isolation policies
alter table profiles enable row level security;
alter table activities enable row level security;
alter table university_subjects enable row level security;
alter table schedule_blocks enable row level security;
alter table nutrition_logs enable row level security;
alter table activity_debts enable row level security;

create policy "Users manage own profiles" on profiles for all using (auth.uid() = id);
create policy "Users manage own activities" on activities for all using (auth.uid() = user_id);
create policy "Users manage own subjects" on university_subjects for all using (auth.uid() = user_id);
create policy "Users manage own blocks" on schedule_blocks for all using (auth.uid() = user_id);
create policy "Users manage own meals" on nutrition_logs for all using (auth.uid() = user_id);
create policy "Users manage own debts" on activity_debts for all using (auth.uid() = user_id);
