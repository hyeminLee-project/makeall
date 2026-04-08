-- MakeAll Migration 002: Add user_id to all tables for multi-tenant isolation
-- 9개 테이블에 user_id 컬럼 추가 + 인덱스 + UNIQUE 제약 변경

-- ─── 1. series ──────────────────────────────────────

ALTER TABLE series ADD COLUMN user_id UUID NOT NULL;
CREATE INDEX idx_series_user_id ON series(user_id);

-- ─── 2. episodes ────────────────────────────────────

ALTER TABLE episodes ADD COLUMN user_id UUID NOT NULL;
CREATE INDEX idx_episodes_user_id ON episodes(user_id);

-- ─── 3. automation_templates ────────────────────────

ALTER TABLE automation_templates ADD COLUMN user_id UUID NOT NULL;
CREATE INDEX idx_automation_templates_user_id ON automation_templates(user_id);

-- ─── 4. automation_schedules ────────────────────────

ALTER TABLE automation_schedules ADD COLUMN user_id UUID NOT NULL;
CREATE INDEX idx_automation_schedules_user_id ON automation_schedules(user_id);

-- ─── 5. automation_executions ───────────────────────

ALTER TABLE automation_executions ADD COLUMN user_id UUID NOT NULL;
CREATE INDEX idx_automation_executions_user_id ON automation_executions(user_id);

-- ─── 6. drafts ──────────────────────────────────────

ALTER TABLE drafts ADD COLUMN user_id UUID NOT NULL;
CREATE INDEX idx_drafts_user_id ON drafts(user_id);

-- ─── 7. platform_connections ────────────────────────

ALTER TABLE platform_connections ADD COLUMN user_id UUID NOT NULL;
CREATE INDEX idx_platform_connections_user_id ON platform_connections(user_id);

-- 기존 UNIQUE(platform) → UNIQUE(user_id, platform)
ALTER TABLE platform_connections DROP CONSTRAINT platform_connections_platform_key;
ALTER TABLE platform_connections ADD CONSTRAINT platform_connections_user_platform_key UNIQUE (user_id, platform);

-- ─── 8. publish_history ─────────────────────────────

ALTER TABLE publish_history ADD COLUMN user_id UUID NOT NULL;
CREATE INDEX idx_publish_history_user_id ON publish_history(user_id);

-- ─── 9. scheduled_publishes ─────────────────────────

ALTER TABLE scheduled_publishes ADD COLUMN user_id UUID NOT NULL;
CREATE INDEX idx_scheduled_publishes_user_id ON scheduled_publishes(user_id);

-- ─── RLS 활성화 (defense-in-depth) ──────────────────

ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_publishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_notifications ENABLE ROW LEVEL SECURITY;

-- ─── RLS 정책: 사용자 본인 데이터만 접근 ────────────

CREATE POLICY "Users see own rows" ON series FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON episodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON automation_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON automation_schedules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON automation_executions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON drafts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON platform_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON publish_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON scheduled_publishes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON messenger_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own rows" ON messenger_notifications FOR ALL USING (auth.uid() = user_id);
