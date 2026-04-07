-- MakeAll Supabase Migration
-- 10개 테이블 생성

-- ─── 1. series (연재 소설 시리즈) ────────────────────

CREATE TABLE series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  setting TEXT NOT NULL,
  characters JSONB NOT NULL,
  plot_outline TEXT NOT NULL,
  target_episode_length INT DEFAULT 5000,
  style_profile_id UUID,
  tone TEXT,
  reference_style TEXT,
  continuity_state JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. episodes (에피소드) ──────────────────────────

CREATE TABLE episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  episode_number INT NOT NULL,
  outline TEXT NOT NULL,
  draft TEXT NOT NULL,
  final_content TEXT,
  continuity_notes JSONB,
  status TEXT DEFAULT 'draft',
  word_count INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  finalized_at TIMESTAMPTZ,
  UNIQUE(series_id, episode_number)
);

-- ─── 3. automation_templates (템플릿) ────────────────

CREATE TABLE automation_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  sections JSONB NOT NULL,
  variables JSONB DEFAULT '[]',
  rules JSONB NOT NULL,
  style_profile_id UUID,
  sample_output TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. automation_schedules (스케줄) ────────────────

CREATE TABLE automation_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES automation_templates(id) ON DELETE CASCADE,
  cron TEXT NOT NULL,
  timezone TEXT DEFAULT 'Asia/Seoul',
  variable_data JSONB,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. automation_executions (실행 기록) ────────────

CREATE TABLE automation_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES automation_templates(id) ON DELETE SET NULL,
  variables_used JSONB,
  content TEXT NOT NULL,
  rule_passed BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 6. drafts (블로그/일반 콘텐츠) ─────────────────

CREATE TABLE drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  input TEXT NOT NULL,
  input_type TEXT NOT NULL DEFAULT 'idea',
  draft TEXT NOT NULL,
  final_content TEXT,
  platforms JSONB DEFAULT '{}',
  seo_score INT,
  suggestions JSONB DEFAULT '[]',
  style_profile_id UUID,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. platform_connections (플랫폼 연결) ──────────

CREATE TABLE platform_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  credentials_encrypted JSONB NOT NULL,
  site_url TEXT,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. publish_history (발행 기록) ──────────────────

CREATE TABLE publish_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID,
  platform TEXT NOT NULL,
  post_url TEXT,
  status TEXT DEFAULT 'published',
  published_at TIMESTAMPTZ
);

-- ─── 8. scheduled_publishes (예약 발행) ──────────────

CREATE TABLE scheduled_publishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID,
  platforms JSONB NOT NULL,
  overrides JSONB,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 9. messenger_connections (메신저 연결) ──────────

CREATE TABLE messenger_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  provider TEXT NOT NULL,
  chat_id TEXT,
  provider_user_id TEXT,
  verification_code TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 10. messenger_notifications (메신저 알림) ──────

CREATE TABLE messenger_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  provider TEXT NOT NULL,
  type TEXT NOT NULL,
  draft_id UUID,
  sent_at TIMESTAMPTZ DEFAULT now(),
  response_action TEXT,
  responded_at TIMESTAMPTZ
);

-- ─── 인덱스 ─────────────────────────────────────────

CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_episodes_series_id ON episodes(series_id);
CREATE INDEX idx_episodes_status ON episodes(status);
CREATE INDEX idx_automation_schedules_template_id ON automation_schedules(template_id);
CREATE INDEX idx_automation_schedules_is_active ON automation_schedules(is_active);
CREATE INDEX idx_publish_history_content_id ON publish_history(content_id);
CREATE INDEX idx_publish_history_platform ON publish_history(platform);
CREATE INDEX idx_scheduled_publishes_status ON scheduled_publishes(status);
CREATE INDEX idx_scheduled_publishes_scheduled_at ON scheduled_publishes(scheduled_at);
CREATE INDEX idx_messenger_connections_provider ON messenger_connections(provider);
CREATE INDEX idx_messenger_connections_verification ON messenger_connections(verification_code) WHERE verification_code IS NOT NULL;
CREATE INDEX idx_messenger_notifications_draft_id ON messenger_notifications(draft_id);
