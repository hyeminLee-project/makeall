# MakeAll

AI Creative Studio for creators.
Write, compose, film, review — all in one place.

> "AI는 대신 해주는 도구가 아니라, 크리에이터가 더 빠르고 잘 만들 수 있게 돕는 스튜디오"

## Features

### Writing Studio

- **AI 초안 생성** — 아이디어 또는 URL 기반 콘텐츠 생성
- **문체 학습** — 기존 글 분석 → 스타일 프로파일 → 생성 시 반영
- **멀티플랫폼 변환** — 블로그 / 인스타 / X 스레드 / 뉴스레터 / 숏폼 스크립트
- **연재 소설** — 세계관·캐릭터 설정 → AI 에피소드 초안 → 사용자 편집, 연속성 자동 관리

### Publishing Hub

- **7개 플랫폼 발행** — X, Threads, Tistory, WordPress, Medium (API 자동) + 네이버 블로그, 포스타입 (클립보드 가이드)
- **예약 발행** — 시간대별 스케줄링
- **어필리에이트** — AI 맥락 분석 → 링크 삽입 위치 제안 → 사용자 승인 → 쿠팡 파트너스 연동

### Template Automation

- **템플릿 설계** — 섹션 구조 + 변수 슬롯 + 규칙 (길이/키워드/금지어)
- **자동 실행** — 스케줄러 → AI 생성 → 규칙 검증 → 자동 발행
- **수동 모드와 자동 모드** — 창작은 수동, 홍보/샘플은 자동

### Messenger Control

- **텔레그램 + 디스코드** — 초안 완성 알림 → 모바일 승인/거절/피드백
- **메신저 추상화** — 인터페이스 공통, 구현체 분리 (Slack 등 확장 가능)

### Code Review

- **코드 리뷰** — 보안/성능/가독성 분석, 심각도 분류, 품질 점수

## Tech Stack

| Layer           | Technology              |
| --------------- | ----------------------- |
| Framework       | Next.js 16 (App Router) |
| Language        | TypeScript 5 (strict)   |
| AI              | Google Gemini 2.5 Flash |
| Validation      | Zod v4                  |
| DB / Auth       | Supabase                |
| Styling         | Tailwind CSS 4          |
| Testing         | Vitest + Playwright     |
| Deploy          | Vercel                  |
| Package Manager | Bun                     |

## Getting Started

````bash
# Install dependencies
bun install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run dev server
bun dev

# Run tests
bun run test

# Type check
bun run typecheck

# Lint + Format
bun run lint
bun run format
```bash

### Environment Variables

```env
GEMINI_API_KEY=           # Google Gemini API key
NEXT_PUBLIC_SUPABASE_URL= # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY= # Supabase service role key
COUPANG_ACCESS_KEY=       # Coupang Partners (optional)
COUPANG_SECRET_KEY=       # Coupang Partners (optional)
TELEGRAM_BOT_TOKEN=       # Telegram bot (optional)
TELEGRAM_WEBHOOK_SECRET=  # Telegram webhook secret (optional)
DISCORD_BOT_TOKEN=        # Discord bot (optional)
DISCORD_PUBLIC_KEY=       # Discord public key (optional)
````

## Project Structure

```text
src/
├── app/api/
│   ├── code-review/          # Code review API
│   ├── writing/series/       # Serial novel API (6 routes)
│   ├── publishing/
│   │   ├── publish/          # Multi-platform publish
│   │   ├── clipboard/        # Naver/Postype clipboard
│   │   ├── platforms/        # Platform connections
│   │   └── affiliate/        # Affiliate link assistant
│   ├── automation/
│   │   ├── templates/        # Template CRUD
│   │   ├── schedules/        # Schedule CRUD
│   │   └── execute/          # Template execution
│   └── messenger/
│       ├── telegram/         # Telegram webhook + setup
│       ├── discord/          # Discord webhook
│       ├── connect/          # Account linking
│       └── status/           # Connection status
├── lib/
│   ├── types.ts              # Zod schemas
│   ├── prompts.ts            # AI prompt builders
│   ├── publisher/            # Platform abstraction (7 publishers)
│   ├── messenger/            # Messenger abstraction (Telegram + Discord)
│   ├── affiliate/            # Coupang Partners client
│   ├── template-engine.ts    # Variable substitution + rule validation
│   ├── rate-limit.ts         # Rate limiter
│   ├── sanitize.ts           # Prompt injection protection
│   └── supabase.ts           # Supabase client
└── supabase/
    └── migration.sql         # 11 tables
```

## License

MIT
