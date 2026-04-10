-- Migration 003: Add writing types support
-- 기존 series 테이블에 글 유형 지원 추가
-- Supabase SQL Editor에서 실행

-- 1. writing_type 컬럼 추가 (기존 데이터는 'serial'로 설정)
ALTER TABLE series ADD COLUMN IF NOT EXISTS writing_type text NOT NULL DEFAULT 'serial';

-- 2. type_metadata 컬럼 추가 (비연재 유형의 설정 저장)
ALTER TABLE series ADD COLUMN IF NOT EXISTS type_metadata jsonb;

-- 3. 기존 NOT NULL 제약 조건 완화 (비연재 유형은 이 필드가 불필요)
ALTER TABLE series ALTER COLUMN genre DROP NOT NULL;
ALTER TABLE series ALTER COLUMN setting DROP NOT NULL;
ALTER TABLE series ALTER COLUMN plot_outline DROP NOT NULL;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_series_writing_type ON series(user_id, writing_type);
