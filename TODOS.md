# TODOS

## Refactor existing Gemini routes to use callGemini helper

- **What:** Migrate episode generate + finalize routes to shared callGemini() helper
- **Why:** JSON parsing bug (code fence handling missing) + DRY — 2 routes have inline Gemini logic that duplicates the new helper
- **Pros:** All Gemini calls share same error handling, retry, validation
- **Cons:** Modifying working code carries regression risk
- **Context:** callGemini() helper is built in the Live Demo Machine PR for new routes. After it stabilizes, migrate old routes in a separate PR with dedicated tests.
- **Depends on:** Live Demo Machine feature complete + callGemini() stable
- **Files:** src/app/api/writing/series/[seriesId]/episodes/generate/route.ts, src/app/api/writing/series/[seriesId]/episodes/[episodeId]/finalize/route.ts

## Improve Tone.js music playback quality

- **What:** Upgrade from basic chord tones to pre-built loops, rhythm patterns, and instrument samples
- **Why:** Basic Tone.js chord playback sounds like 1997 MIDI — hurts portfolio credibility
- **Pros:** Dramatically improves demo experience, "whoa" factor
- **Cons:** Requires music generation domain expertise, larger bundle size
- **Context:** v1 ships with basic chord playback. This TODO adds pre-built drum loops, bass patterns, and sampled instruments mapped to Gemini's chord output.
- **Depends on:** Music Lab v1 complete
- **Files:** src/app/page.tsx (music card component), new src/lib/music/ directory
