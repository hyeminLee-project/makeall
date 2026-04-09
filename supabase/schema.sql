-- MakeAll - Supabase Schema
-- Supabase SQL Editor에서 실행

-- 1. series (연재 시리즈)
create table if not exists series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  genre text not null,
  setting text not null,
  characters jsonb not null default '[]',
  plot_outline text not null,
  target_episode_length int default 5000,
  style_profile_id uuid,
  tone text,
  reference_style text,
  continuity_state jsonb,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. episodes (에피소드)
create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  series_id uuid not null references series(id) on delete cascade,
  episode_number int not null,
  outline text,
  draft text,
  final_content text,
  continuity_notes jsonb,
  status text default 'draft',
  word_count int,
  created_at timestamptz default now(),
  finalized_at timestamptz,
  unique(series_id, episode_number)
);

-- 3. drafts (콘텐츠 초안)
create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  input text not null,
  input_type text not null default 'idea',
  draft text not null,
  final_content text,
  platforms jsonb default '{}',
  seo_score int,
  suggestions jsonb default '[]',
  style_profile_id uuid,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. automation_templates (자동화 템플릿)
create table if not exists automation_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  category text not null,
  sections jsonb not null,
  variables jsonb default '[]',
  rules jsonb not null,
  style_profile_id uuid,
  sample_output text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. automation_schedules (자동화 스케줄)
create table if not exists automation_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references automation_templates(id) on delete cascade,
  cron text not null,
  timezone text default 'Asia/Seoul',
  variable_data jsonb,
  is_active boolean default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz default now()
);

-- 6. automation_executions (자동화 실행 기록)
create table if not exists automation_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references automation_templates(id) on delete set null,
  variables_used jsonb,
  content text not null,
  rule_passed boolean default false,
  published boolean default false,
  executed_at timestamptz default now()
);

-- 7. platform_connections (플랫폼 연결)
create table if not exists platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  credentials_encrypted jsonb not null,
  site_url text,
  is_active boolean default true,
  connected_at timestamptz default now(),
  unique(user_id, platform)
);

-- 8. messenger_connections (메신저 연결)
create table if not exists messenger_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  chat_id text,
  provider_user_id text,
  verification_code text,
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- 9. messenger_notifications (메신저 알림)
create table if not exists messenger_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  provider text not null,
  type text not null,
  draft_id uuid,
  sent_at timestamptz default now(),
  response_action text,
  responded_at timestamptz
);

-- 10. publish_history (발행 기록)
create table if not exists publish_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content_id uuid,
  platform text not null,
  post_url text,
  status text default 'published',
  published_at timestamptz
);

-- 11. scheduled_publishes (예약 발행)
create table if not exists scheduled_publishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content_id uuid,
  platforms jsonb not null,
  overrides jsonb,
  scheduled_at timestamptz not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- RLS (Row Level Security) 활성화
alter table series enable row level security;
alter table episodes enable row level security;
alter table drafts enable row level security;
alter table automation_templates enable row level security;
alter table automation_schedules enable row level security;
alter table automation_executions enable row level security;
alter table platform_connections enable row level security;
alter table messenger_connections enable row level security;
alter table messenger_notifications enable row level security;
alter table publish_history enable row level security;
alter table scheduled_publishes enable row level security;

-- RLS 정책: 본인 데이터만 접근
create policy "Users can access own data" on series for all using (auth.uid() = user_id);
create policy "Users can access own data" on episodes for all using (auth.uid() = user_id);
create policy "Users can access own data" on drafts for all using (auth.uid() = user_id);
create policy "Users can access own data" on automation_templates for all using (auth.uid() = user_id);
create policy "Users can access own data" on automation_schedules for all using (auth.uid() = user_id);
create policy "Users can access own data" on automation_executions for all using (auth.uid() = user_id);
create policy "Users can access own data" on platform_connections for all using (auth.uid() = user_id);
create policy "Users can access own data" on messenger_connections for all using (auth.uid() = user_id);
create policy "Users can access own data" on messenger_notifications for all using (auth.uid() = user_id);
create policy "Users can access own data" on publish_history for all using (auth.uid() = user_id);
create policy "Users can access own data" on scheduled_publishes for all using (auth.uid() = user_id);
