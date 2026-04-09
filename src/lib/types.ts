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

export const codeReviewFocusEnum = z.enum([
  "security",
  "performance",
  "readability",
  "maintainability",
  "logic",
  "comprehension",
  "all",
]);

export const codeReviewRequestSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.string().default("typescript"),
  focus: z.array(codeReviewFocusEnum).default(["all"]),
});

export type CodeReviewRequest = z.infer<typeof codeReviewRequestSchema>;

export const codeReviewCategoryEnum = z.enum([
  "maintainability",
  "understanding",
  "logic",
  "security",
  "comprehension",
]);

export const codeReviewIssueSchema = z.object({
  line: z.number().optional(),
  severity: z.enum(["critical", "warning", "info"]),
  message: z.string(),
  suggestion: z.string().optional(),
  category: codeReviewCategoryEnum.optional(),
  explanation: z.string().optional(),
  fixPrompt: z.string().optional(),
});

export const comprehensionQuestionSchema = z.object({
  question: z.string(),
  targetLines: z.array(z.number()).optional(),
  difficulty: z.enum(["basic", "intermediate", "advanced"]),
});

export const comprehensionRiskSchema = z.object({
  section: z.string(),
  riskLevel: z.enum(["low", "medium", "high"]),
  reason: z.string(),
  blackBoxPatterns: z.array(z.string()).optional(),
});

export const categoryScoreSchema = z.object({
  category: codeReviewCategoryEnum,
  score: z.number().min(0).max(100),
  summary: z.string(),
});

export const codeReviewResponseSchema = z.object({
  summary: z.string(),
  issues: z.array(codeReviewIssueSchema),
  score: z.number().min(0).max(100),
  categoryScores: z.array(categoryScoreSchema).optional(),
  comprehensionQuestions: z.array(comprehensionQuestionSchema).optional(),
  comprehensionRisks: z.array(comprehensionRiskSchema).optional(),
  overallComprehensionLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
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

// ─── Serial Novel (연재 소설) ────────────────────────

export const characterSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.enum(["protagonist", "antagonist", "supporting", "minor"]),
  description: z.string().max(2000),
  personality: z.string().max(1000),
  relationships: z
    .array(
      z.object({
        characterName: z.string(),
        relationship: z.string(),
      })
    )
    .default([]),
  currentState: z.string().max(1000).optional(),
});

export type Character = z.infer<typeof characterSchema>;

export const seriesCreateRequestSchema = z.object({
  title: z.string().min(1).max(200),
  genre: z.enum(["fantasy", "romance", "thriller", "sf", "horror", "slice_of_life", "historical"]),
  setting: z.string().min(1).max(5000),
  characters: z.array(characterSchema).min(1).max(20),
  plotOutline: z.string().min(1).max(10000),
  targetEpisodeLength: z.number().min(1000).max(20000).default(5000),
  styleProfileId: z.uuid().nullable().optional(),
  tone: z.string().max(500).optional(),
  referenceStyle: z.string().max(2000).nullable().optional(),
});

export type SeriesCreateRequest = z.infer<typeof seriesCreateRequestSchema>;

export const seriesContinuitySchema = z.object({
  previousEpisodesSummary: z.string(),
  characterStates: z.record(z.string(), z.string()),
  unresolvedPlotThreads: z.array(z.string()),
  timelinePosition: z.string(),
  lastEpisodeNumber: z.number(),
});

export type SeriesContinuity = z.infer<typeof seriesContinuitySchema>;

export const episodeGenerateRequestSchema = z.object({
  episodeNumber: z.number().min(1),
  episodeOutline: z.string().min(1).max(3000),
  focusCharacters: z.array(z.string()).default([]),
  plotPoints: z.array(z.string()).min(1).max(10),
  specialInstructions: z.string().max(2000).optional(),
});

export type EpisodeGenerateRequest = z.infer<typeof episodeGenerateRequestSchema>;

export const episodeGenerateResponseSchema = z.object({
  draft: z.string().min(1),
  episodeNumber: z.number(),
  wordCount: z.number(),
  continuityNotes: z.array(z.string()),
  suggestedNextPlotPoints: z.array(z.string()),
});

export type EpisodeGenerateResponse = z.infer<typeof episodeGenerateResponseSchema>;

export const continuityUpdateResponseSchema = z.object({
  previousEpisodesSummary: z.string(),
  characterStates: z.record(z.string(), z.string()),
  unresolvedPlotThreads: z.array(z.string()),
  timelinePosition: z.string(),
});

// ─── Publishing Hub ─────────────────────────────────

export const platformEnum = z.enum(["x", "threads", "tistory", "wordpress", "medium"]);
export type Platform = z.infer<typeof platformEnum>;

export const clipboardPlatformEnum = z.enum(["naver_blog", "postype"]);
export type ClipboardPlatform = z.infer<typeof clipboardPlatformEnum>;

export const publishContentSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(100000),
  format: z.enum(["html", "markdown"]).default("html"),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  images: z.array(z.url()).default([]),
});

export type PublishContent = z.infer<typeof publishContentSchema>;

export const publishRequestSchema = z.object({
  contentId: z.uuid(),
  platforms: z.array(platformEnum).min(1),
  overrides: z
    .record(
      z.string(),
      z.object({
        title: z.string().optional(),
        body: z.string().optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
      })
    )
    .optional(),
  scheduledAt: z.iso.datetime().optional(),
});

export type PublishRequest = z.infer<typeof publishRequestSchema>;

export const publishResultSchema = z.object({
  platform: z.string(),
  success: z.boolean(),
  postUrl: z.url().optional(),
  error: z.string().optional(),
});

export const publishResponseSchema = z.object({
  results: z.array(publishResultSchema),
});

export type PublishResponse = z.infer<typeof publishResponseSchema>;

export const clipboardRequestSchema = z.object({
  contentId: z.uuid(),
  platform: clipboardPlatformEnum,
});

export type ClipboardRequest = z.infer<typeof clipboardRequestSchema>;

export const clipboardResponseSchema = z.object({
  html: z.string(),
  plainText: z.string(),
  guide: z.array(z.string()),
});

export type ClipboardResponse = z.infer<typeof clipboardResponseSchema>;

export const platformConnectRequestSchema = z.object({
  platform: platformEnum,
  credentials: z.record(z.string(), z.string()),
  siteUrl: z.url().optional(),
});

export type PlatformConnectRequest = z.infer<typeof platformConnectRequestSchema>;

// ─── Template Automation (템플릿 자동화) ─────────────

export const templateSectionSchema = z.object({
  name: z.string().min(1).max(100),
  prompt: z.string().min(1).max(2000),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).optional(),
  required: z.boolean().default(true),
});

export type TemplateSection = z.infer<typeof templateSectionSchema>;

export const templateVariableSchema = z.object({
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  type: z.enum(["text", "select", "number"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
  defaultValue: z.string().optional(),
});

export type TemplateVariable = z.infer<typeof templateVariableSchema>;

export const templateRulesSchema = z.object({
  minTotalLength: z.number().min(0).optional(),
  maxTotalLength: z.number().min(1).optional(),
  requiredKeywords: z.array(z.string()).default([]),
  forbiddenWords: z.array(z.string()).default([]),
  autoAffiliate: z.boolean().default(false),
  autoPublish: z.boolean().default(false),
  platforms: z.array(z.string()).default([]),
});

export type TemplateRules = z.infer<typeof templateRulesSchema>;

export const templateCreateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  category: z.enum(["promotion", "review", "announcement", "newsletter", "custom"]),
  sections: z.array(templateSectionSchema).min(1).max(10),
  variables: z.array(templateVariableSchema).default([]),
  rules: templateRulesSchema,
  styleProfileId: z.uuid().nullable().optional(),
  sampleOutput: z.string().max(50000).optional(),
});

export type TemplateCreateRequest = z.infer<typeof templateCreateRequestSchema>;

export const scheduleCreateRequestSchema = z.object({
  templateId: z.uuid(),
  cron: z.string().min(1).max(100),
  timezone: z.string().default("Asia/Seoul"),
  variableData: z.array(z.record(z.string(), z.string())).nullable().default(null),
  isActive: z.boolean().default(true),
});

export type ScheduleCreateRequest = z.infer<typeof scheduleCreateRequestSchema>;

export const automationExecutionResponseSchema = z.object({
  content: z.string(),
  platforms: z.record(z.string(), z.string()).optional(),
  ruleValidation: z.object({
    passed: z.boolean(),
    failures: z.array(z.string()),
  }),
  affiliateLinks: z
    .array(
      z.object({
        anchorText: z.string(),
        url: z.string(),
        productName: z.string(),
      })
    )
    .optional(),
  published: z.boolean(),
  publishedPlatforms: z.array(z.string()),
});

export type AutomationExecutionResponse = z.infer<typeof automationExecutionResponseSchema>;

export const automationAiResponseSchema = z.object({
  content: z.string().min(1),
  sections: z.record(z.string(), z.string()).optional(),
});

export type AutomationAiResponse = z.infer<typeof automationAiResponseSchema>;

// ─── Affiliate (수익화 어시스턴트) ──────────────────

export const affiliateAnalyzeRequestSchema = z.object({
  draftContent: z.string().min(1).max(50000),
  provider: z.enum(["coupang"]).default("coupang"),
  maxSuggestions: z.number().min(1).max(20).default(5),
});

export type AffiliateAnalyzeRequest = z.infer<typeof affiliateAnalyzeRequestSchema>;

export const affiliateSuggestionSchema = z.object({
  anchorText: z.string(),
  surroundingContext: z.string(),
  position: z.object({
    paragraphIndex: z.number(),
    startOffset: z.number(),
    endOffset: z.number(),
  }),
  productCategory: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(100),
});

export type AffiliateSuggestion = z.infer<typeof affiliateSuggestionSchema>;

export const affiliateAnalyzeResponseSchema = z.object({
  suggestions: z.array(affiliateSuggestionSchema),
  overallFit: z.number().min(0).max(100),
  tips: z.array(z.string()),
});

export type AffiliateAnalyzeResponse = z.infer<typeof affiliateAnalyzeResponseSchema>;

export const affiliateGenerateRequestSchema = z.object({
  approvedSuggestions: z.array(
    z.object({
      anchorText: z.string(),
      productCategory: z.string(),
      position: z.object({
        paragraphIndex: z.number(),
        startOffset: z.number(),
        endOffset: z.number(),
      }),
    })
  ),
  provider: z.enum(["coupang"]).default("coupang"),
  draftContent: z.string().min(1).max(50000),
});

export type AffiliateGenerateRequest = z.infer<typeof affiliateGenerateRequestSchema>;

export const affiliateGenerateResponseSchema = z.object({
  modifiedDraft: z.string(),
  insertedLinks: z.array(
    z.object({
      anchorText: z.string(),
      url: z.string(),
      productName: z.string(),
    })
  ),
});

export type AffiliateGenerateResponse = z.infer<typeof affiliateGenerateResponseSchema>;

// ─── Messenger (텔레그램 + 디스코드) ────────────────

export const messengerProviderEnum = z.enum(["telegram", "discord"]);
export type MessengerProvider = z.infer<typeof messengerProviderEnum>;

export const messengerNotifyRequestSchema = z.object({
  userId: z.uuid(),
  type: z.enum(["draft_ready", "publish_complete", "publish_failed", "review_needed"]),
  payload: z.object({
    title: z.string(),
    preview: z.string().max(500),
    draftId: z.uuid(),
    platforms: z.array(z.string()).optional(),
  }),
});

export type MessengerNotifyRequest = z.infer<typeof messengerNotifyRequestSchema>;

export const messengerCallbackSchema = z.object({
  action: z.enum(["approve", "reject", "preview", "feedback"]),
  draftId: z.uuid(),
});

export type MessengerCallback = z.infer<typeof messengerCallbackSchema>;

export const telegramUpdateSchema = z.object({
  update_id: z.number(),
  message: z
    .object({
      message_id: z.number(),
      from: z.object({ id: z.number(), first_name: z.string() }),
      chat: z.object({ id: z.number(), type: z.string() }),
      text: z.string().optional(),
      date: z.number(),
    })
    .optional(),
  callback_query: z
    .object({
      id: z.string(),
      from: z.object({ id: z.number() }),
      data: z.string().optional(),
      message: z
        .object({
          chat: z.object({ id: z.number() }),
          message_id: z.number(),
        })
        .optional(),
    })
    .optional(),
});

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;

export const discordInteractionSchema = z.object({
  type: z.number(),
  data: z
    .object({
      custom_id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  member: z.object({ user: z.object({ id: z.string(), username: z.string() }) }).optional(),
  user: z.object({ id: z.string(), username: z.string() }).optional(),
  channel_id: z.string().optional(),
  token: z.string(),
});

export type DiscordInteraction = z.infer<typeof discordInteractionSchema>;

export const messengerConnectRequestSchema = z.object({
  provider: messengerProviderEnum,
});

export type MessengerConnectRequest = z.infer<typeof messengerConnectRequestSchema>;
