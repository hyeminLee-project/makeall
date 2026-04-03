# CLAUDE.md

## Project Overview

**MakeAll** — AI Creative Studio for creators.
Write, compose, film, review — all in one place.

- Framework: Next.js 16 (App Router), React 19, TypeScript 5 (strict)
- AI: Google Gemini 2.5 Flash (`@google/genai`)
- Styling: Tailwind CSS 4
- DB/Auth: Supabase
- Package manager: Bun
- Testing: Vitest (unit) + Playwright (E2E)
- Deploy: Vercel

## Modules

| Module          | Path                       | Description                                    |
| --------------- | -------------------------- | ---------------------------------------------- |
| Writing Studio  | `src/app/api/writing/`     | AI 초안 + 에디터 + 문체 학습 + 멀티플랫폼 변환 |
| Publishing Hub  | `src/app/api/publishing/`  | 멀티플랫폼 동시 발행 + 스케줄러                |
| Promotion Guide | `src/app/api/promotion/`   | 최적 플랫폼/시간 추천 + 가이드                 |
| Analytics       | `src/app/api/analytics/`   | 플랫폼별 성과 + 수익 추적                      |
| Music Lab       | `src/app/api/music/`       | AI 작곡 + 작사                                 |
| Video Lab       | `src/app/api/video/`       | AI 영상 + 자막 + BGM + 썸네일                  |
| Code Review     | `src/app/api/code-review/` | GitHub PR 분석 + 보안/성능 리뷰                |

## Key Files

| Path                    | Role               |
| ----------------------- | ------------------ |
| `src/app/page.tsx`      | Main dashboard     |
| `src/lib/types.ts`      | Shared Zod schemas |
| `src/lib/prompts.ts`    | Prompt builders    |
| `src/lib/rate-limit.ts` | Rate limiter       |
| `src/lib/supabase.ts`   | Supabase client    |

## Commands

```bash
bun dev          # Dev server
bun run build    # Production build
bun run lint     # ESLint
bun run test     # Vitest
bun run format   # Prettier
```

## Behavioral Guidelines

### 1. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No error handling for impossible scenarios.

### 2. Surgical Changes

Touch only what you must.

- Don't improve adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style.

### 3. Always Validate AI Output

Every Gemini API call must validate the response with Zod schema.
Never trust AI output without parsing.

## Conventions

### Commits

- Format: `<gitmoji> <type>(<scope>): <subject>`
- Language: English title, Korean body OK
- Run `bun run format` before every commit

### Gitmoji

| Emoji | Code                      | Usage         |
| ----- | ------------------------- | ------------- |
| ✨    | `:sparkles:`              | New feature   |
| 🐛    | `:bug:`                   | Bug fix       |
| ♻️    | `:recycle:`               | Refactor      |
| ✅    | `:white_check_mark:`      | Add/fix tests |
| 💄    | `:lipstick:`              | UI/style      |
| 🔧    | `:wrench:`                | Config        |
| 🏗️    | `:building_construction:` | Architecture  |
| 🔒    | `:lock:`                  | Security      |

### Branches

- `main` — stable
- `feat/*` — new feature
- `fix/*` — bug fix
- `chore/*` — config/docs

### Code Style

- TypeScript strict mode — avoid `any`
- Zod v4 for all input/output validation
- No comments unless logic is non-obvious

## What NOT to Do

- Do not commit `.env` or secrets
- Do not push directly to `main`
- Do not skip pre-commit hooks
- Do not add abstractions beyond current task
- Do not use company code, prompts, or internal documents
