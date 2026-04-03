import { z } from "zod/v4";

// ─── Writing Studio ──────────────────────────────────

export const writingRequestSchema = z.object({
  input: z.string().min(1).max(5000),
  inputType: z.enum(["idea", "url"]),
  styleProfileId: z.string().nullable().optional(),
  platforms: z
    .array(z.enum(["blog", "instagram", "x_thread", "newsletter", "shorts_script"]))
    .min(1)
    .default(["blog"]),
});

export type WritingRequest = z.infer<typeof writingRequestSchema>;

export const writingResponseSchema = z.object({
  draft: z.string().min(1),
  platforms: z.record(z.string(), z.string()),
  seoScore: z.number().min(0).max(100).optional(),
  suggestions: z.array(z.string()).optional(),
});

export type WritingResponse = z.infer<typeof writingResponseSchema>;

// ─── Style Profile ───────────────────────────────────

export const styleProfileSchema = z.object({
  sentenceLength: z.enum(["short", "medium", "long"]),
  tone: z.enum(["formal", "casual", "conversational"]),
  ending: z.enum(["da", "yo", "seumnida", "mixed"]),
  humor: z.enum(["none", "occasional", "frequent"]),
  structure: z.enum(["conclusion_first", "introduction_first", "mixed"]),
  vocabulary: z.array(z.string()),
  expressions: z.array(z.string()),
});

export type StyleProfile = z.infer<typeof styleProfileSchema>;

// ─── Code Review ─────────────────────────────────────

export const codeReviewRequestSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.string().default("typescript"),
  focus: z
    .array(z.enum(["security", "performance", "readability", "all"]))
    .default(["all"]),
});

export type CodeReviewRequest = z.infer<typeof codeReviewRequestSchema>;

export const codeReviewResponseSchema = z.object({
  summary: z.string(),
  issues: z.array(
    z.object({
      line: z.number().optional(),
      severity: z.enum(["critical", "warning", "info"]),
      message: z.string(),
      suggestion: z.string().optional(),
    })
  ),
  score: z.number().min(0).max(100),
});

export type CodeReviewResponse = z.infer<typeof codeReviewResponseSchema>;

// ─── Music Lab ───────────────────────────────────────

export const musicRequestSchema = z.object({
  mood: z.string().min(1).max(200),
  genre: z.enum(["ballad", "hiphop", "pop", "edm", "jazz", "rock", "classical"]),
  language: z.enum(["ko", "en", "ja"]).default("ko"),
  withLyrics: z.boolean().default(true),
});

export type MusicRequest = z.infer<typeof musicRequestSchema>;

// ─── Video Lab ───────────────────────────────────────

export const videoRequestSchema = z.object({
  scenario: z.string().min(1).max(2000),
  style: z.enum(["cinematic", "animation", "vlog", "ad"]),
  duration: z.enum(["15s", "30s", "60s", "3min"]).default("30s"),
  referenceImage: z.string().nullable().optional(),
});

export type VideoRequest = z.infer<typeof videoRequestSchema>;
