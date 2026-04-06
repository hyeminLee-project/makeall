import { describe, it, expect } from "vitest";
import {
  codeReviewRequestSchema,
  codeReviewResponseSchema,
  writingRequestSchema,
  styleProfileSchema,
  characterSchema,
  seriesCreateRequestSchema,
  seriesContinuitySchema,
  episodeGenerateRequestSchema,
  episodeGenerateResponseSchema,
  continuityUpdateResponseSchema,
  publishRequestSchema,
  publishResponseSchema,
  clipboardRequestSchema,
  clipboardResponseSchema,
  platformConnectRequestSchema,
  publishContentSchema,
  templateCreateRequestSchema,
  templateSectionSchema,
  templateVariableSchema,
  templateRulesSchema,
  scheduleCreateRequestSchema,
  automationExecutionResponseSchema,
  affiliateAnalyzeRequestSchema,
  affiliateAnalyzeResponseSchema,
  affiliateGenerateRequestSchema,
  affiliateGenerateResponseSchema,
  messengerNotifyRequestSchema,
  messengerCallbackSchema,
  telegramUpdateSchema,
  discordInteractionSchema,
  messengerConnectRequestSchema,
} from "./types";

describe("codeReviewRequestSchema", () => {
  it("accepts valid input", () => {
    const result = codeReviewRequestSchema.safeParse({
      code: "const x = 1;",
      language: "typescript",
      focus: ["security"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty code", () => {
    const result = codeReviewRequestSchema.safeParse({
      code: "",
      language: "typescript",
    });
    expect(result.success).toBe(false);
  });

  it("defaults focus to ['all']", () => {
    const result = codeReviewRequestSchema.safeParse({
      code: "const x = 1;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focus).toEqual(["all"]);
    }
  });
});

describe("codeReviewResponseSchema", () => {
  it("accepts valid response", () => {
    const result = codeReviewResponseSchema.safeParse({
      summary: "Good code",
      issues: [{ severity: "warning", message: "Unused variable", line: 1 }],
      score: 85,
    });
    expect(result.success).toBe(true);
  });

  it("rejects score out of range", () => {
    const result = codeReviewResponseSchema.safeParse({
      summary: "Good",
      issues: [],
      score: 150,
    });
    expect(result.success).toBe(false);
  });
});

describe("writingRequestSchema", () => {
  it("accepts valid idea input", () => {
    const result = writingRequestSchema.safeParse({
      input: "AI 트렌드 정리",
      inputType: "idea",
      platforms: ["blog", "instagram"],
    });
    expect(result.success).toBe(true);
  });

  it("defaults platforms to ['blog']", () => {
    const result = writingRequestSchema.safeParse({
      input: "test",
      inputType: "idea",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platforms).toEqual(["blog"]);
    }
  });

  it("rejects empty input", () => {
    const result = writingRequestSchema.safeParse({
      input: "",
      inputType: "idea",
    });
    expect(result.success).toBe(false);
  });
});

describe("styleProfileSchema", () => {
  it("accepts valid style profile", () => {
    const result = styleProfileSchema.safeParse({
      sentenceLength: "medium",
      tone: "casual",
      ending: "yo",
      humor: "occasional",
      structure: "conclusion_first",
      vocabulary: ["그래서", "결국"],
      expressions: ["솔직히 말하면"],
    });
    expect(result.success).toBe(true);
  });
});

// ─── Serial Novel (연재 소설) ────────────────────────

describe("characterSchema", () => {
  it("accepts valid character", () => {
    const result = characterSchema.safeParse({
      name: "이서진",
      role: "protagonist",
      description: "20대 후반, 작은 출판사 편집자",
      personality: "내성적이지만 글에 대한 열정이 강함",
      relationships: [{ characterName: "김도현", relationship: "연인" }],
    });
    expect(result.success).toBe(true);
  });

  it("defaults relationships to empty array", () => {
    const result = characterSchema.safeParse({
      name: "김도현",
      role: "supporting",
      description: "서진의 대학 동기",
      personality: "밝고 사교적",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relationships).toEqual([]);
    }
  });

  it("rejects empty name", () => {
    const result = characterSchema.safeParse({
      name: "",
      role: "protagonist",
      description: "test",
      personality: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = characterSchema.safeParse({
      name: "test",
      role: "villain",
      description: "test",
      personality: "test",
    });
    expect(result.success).toBe(false);
  });
});

describe("seriesCreateRequestSchema", () => {
  const validSeries = {
    title: "잃어버린 계절",
    genre: "romance",
    setting: "2025년 서울, 작은 독립서점이 있는 골목",
    characters: [
      {
        name: "이서진",
        role: "protagonist" as const,
        description: "편집자",
        personality: "내성적",
      },
    ],
    plotOutline: "서점을 중심으로 펼쳐지는 이야기",
  };

  it("accepts valid series", () => {
    const result = seriesCreateRequestSchema.safeParse(validSeries);
    expect(result.success).toBe(true);
  });

  it("defaults targetEpisodeLength to 5000", () => {
    const result = seriesCreateRequestSchema.safeParse(validSeries);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetEpisodeLength).toBe(5000);
    }
  });

  it("rejects empty characters array", () => {
    const result = seriesCreateRequestSchema.safeParse({
      ...validSeries,
      characters: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid genre", () => {
    const result = seriesCreateRequestSchema.safeParse({
      ...validSeries,
      genre: "comedy",
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many characters", () => {
    const result = seriesCreateRequestSchema.safeParse({
      ...validSeries,
      characters: Array.from({ length: 21 }, (_, i) => ({
        name: `Character ${i}`,
        role: "minor",
        description: "test",
        personality: "test",
      })),
    });
    expect(result.success).toBe(false);
  });
});

describe("episodeGenerateRequestSchema", () => {
  it("accepts valid episode request", () => {
    const result = episodeGenerateRequestSchema.safeParse({
      episodeNumber: 1,
      episodeOutline: "서진이 서점에서 도현을 우연히 만난다",
      plotPoints: ["서점에서 재회", "어색한 대화"],
    });
    expect(result.success).toBe(true);
  });

  it("defaults focusCharacters to empty array", () => {
    const result = episodeGenerateRequestSchema.safeParse({
      episodeNumber: 1,
      episodeOutline: "test",
      plotPoints: ["event"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focusCharacters).toEqual([]);
    }
  });

  it("rejects empty plotPoints", () => {
    const result = episodeGenerateRequestSchema.safeParse({
      episodeNumber: 1,
      episodeOutline: "test",
      plotPoints: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects episodeNumber less than 1", () => {
    const result = episodeGenerateRequestSchema.safeParse({
      episodeNumber: 0,
      episodeOutline: "test",
      plotPoints: ["event"],
    });
    expect(result.success).toBe(false);
  });
});

describe("episodeGenerateResponseSchema", () => {
  it("accepts valid episode response", () => {
    const result = episodeGenerateResponseSchema.safeParse({
      draft: "서진은 서점 문을 열었다...",
      episodeNumber: 1,
      wordCount: 3500,
      continuityNotes: ["서진과 도현이 3년 만에 재회"],
      suggestedNextPlotPoints: ["도현이 서점에 다시 찾아온다"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty draft", () => {
    const result = episodeGenerateResponseSchema.safeParse({
      draft: "",
      episodeNumber: 1,
      wordCount: 0,
      continuityNotes: [],
      suggestedNextPlotPoints: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("seriesContinuitySchema", () => {
  it("accepts valid continuity state", () => {
    const result = seriesContinuitySchema.safeParse({
      previousEpisodesSummary: "에피소드 1에서 서진과 도현이 재회했다.",
      characterStates: {
        이서진: "도현과의 재회에 동요하고 있음",
        김도현: "서진을 다시 만나 반가움을 느낌",
      },
      unresolvedPlotThreads: ["서진이 도현에게 하지 못한 말"],
      timelinePosition: "2025년 봄, 재회 직후",
      lastEpisodeNumber: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe("continuityUpdateResponseSchema", () => {
  it("accepts valid continuity update", () => {
    const result = continuityUpdateResponseSchema.safeParse({
      previousEpisodesSummary: "에피소드 1-2 요약",
      characterStates: { 이서진: "혼란스러운 상태" },
      unresolvedPlotThreads: ["복선 1"],
      timelinePosition: "2025년 봄",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Publishing Hub ─────────────────────────────────

describe("publishContentSchema", () => {
  it("accepts valid content", () => {
    const result = publishContentSchema.safeParse({
      title: "테스트 글",
      body: "<p>본문입니다</p>",
      tags: ["tech", "ai"],
    });
    expect(result.success).toBe(true);
  });

  it("defaults format to html", () => {
    const result = publishContentSchema.safeParse({
      title: "test",
      body: "body",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("html");
    }
  });

  it("rejects empty title", () => {
    const result = publishContentSchema.safeParse({
      title: "",
      body: "body",
    });
    expect(result.success).toBe(false);
  });
});

describe("publishRequestSchema", () => {
  it("accepts valid publish request", () => {
    const result = publishRequestSchema.safeParse({
      contentId: "550e8400-e29b-41d4-a716-446655440000",
      platforms: ["x", "tistory"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts with overrides", () => {
    const result = publishRequestSchema.safeParse({
      contentId: "550e8400-e29b-41d4-a716-446655440000",
      platforms: ["wordpress"],
      overrides: {
        wordpress: { title: "WP 전용 제목", tags: ["wp"] },
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts with scheduledAt", () => {
    const result = publishRequestSchema.safeParse({
      contentId: "550e8400-e29b-41d4-a716-446655440000",
      platforms: ["medium"],
      scheduledAt: "2026-04-07T09:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty platforms", () => {
    const result = publishRequestSchema.safeParse({
      contentId: "550e8400-e29b-41d4-a716-446655440000",
      platforms: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid platform", () => {
    const result = publishRequestSchema.safeParse({
      contentId: "550e8400-e29b-41d4-a716-446655440000",
      platforms: ["naver"],
    });
    expect(result.success).toBe(false);
  });
});

describe("publishResponseSchema", () => {
  it("accepts valid response", () => {
    const result = publishResponseSchema.safeParse({
      results: [
        { platform: "x", success: true, postUrl: "https://x.com/i/status/123" },
        { platform: "tistory", success: false, error: "인증 실패" },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("clipboardRequestSchema", () => {
  it("accepts naver_blog", () => {
    const result = clipboardRequestSchema.safeParse({
      contentId: "550e8400-e29b-41d4-a716-446655440000",
      platform: "naver_blog",
    });
    expect(result.success).toBe(true);
  });

  it("accepts postype", () => {
    const result = clipboardRequestSchema.safeParse({
      contentId: "550e8400-e29b-41d4-a716-446655440000",
      platform: "postype",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid platform", () => {
    const result = clipboardRequestSchema.safeParse({
      contentId: "550e8400-e29b-41d4-a716-446655440000",
      platform: "tistory",
    });
    expect(result.success).toBe(false);
  });
});

describe("clipboardResponseSchema", () => {
  it("accepts valid response", () => {
    const result = clipboardResponseSchema.safeParse({
      html: "<p>본문</p>",
      plainText: "본문",
      guide: ["1. 에디터를 엽니다", "2. 붙여넣기 합니다"],
    });
    expect(result.success).toBe(true);
  });
});

describe("platformConnectRequestSchema", () => {
  it("accepts valid connect request", () => {
    const result = platformConnectRequestSchema.safeParse({
      platform: "wordpress",
      credentials: { username: "admin", password: "app-password-123" },
      siteUrl: "https://myblog.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts without siteUrl", () => {
    const result = platformConnectRequestSchema.safeParse({
      platform: "medium",
      credentials: { accessToken: "token-123" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid platform", () => {
    const result = platformConnectRequestSchema.safeParse({
      platform: "naver_blog",
      credentials: {},
    });
    expect(result.success).toBe(false);
  });
});

// ─── Template Automation (템플릿 자동화) ─────────────

describe("templateSectionSchema", () => {
  it("accepts valid section", () => {
    const result = templateSectionSchema.safeParse({
      name: "도입",
      prompt: "{{product_name}}의 주요 특징을 소개하세요",
      minLength: 100,
      maxLength: 500,
    });
    expect(result.success).toBe(true);
  });

  it("defaults required to true", () => {
    const result = templateSectionSchema.safeParse({
      name: "CTA",
      prompt: "구매 유도 문구",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.required).toBe(true);
    }
  });
});

describe("templateVariableSchema", () => {
  it("accepts text variable", () => {
    const result = templateVariableSchema.safeParse({
      key: "product_name",
      label: "상품명",
      type: "text",
    });
    expect(result.success).toBe(true);
  });

  it("accepts select variable with options", () => {
    const result = templateVariableSchema.safeParse({
      key: "tone",
      label: "톤",
      type: "select",
      options: ["친근한", "전문적인", "유머러스"],
    });
    expect(result.success).toBe(true);
  });
});

describe("templateRulesSchema", () => {
  it("accepts valid rules", () => {
    const result = templateRulesSchema.safeParse({
      minTotalLength: 500,
      maxTotalLength: 3000,
      requiredKeywords: ["쿠팡", "할인"],
      forbiddenWords: ["최저가 보장"],
      autoAffiliate: true,
      autoPublish: true,
      platforms: ["tistory", "naver_blog"],
    });
    expect(result.success).toBe(true);
  });

  it("defaults boolean fields to false", () => {
    const result = templateRulesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.autoAffiliate).toBe(false);
      expect(result.data.autoPublish).toBe(false);
    }
  });
});

describe("templateCreateRequestSchema", () => {
  const validTemplate = {
    name: "쿠팡 리뷰 홍보글",
    category: "promotion" as const,
    sections: [
      { name: "도입", prompt: "{{product_name}} 소개" },
      { name: "본문", prompt: "{{features}} 상세 설명" },
      { name: "CTA", prompt: "구매 링크 안내" },
    ],
    variables: [
      { key: "product_name", label: "상품명", type: "text" as const },
      { key: "features", label: "특징", type: "text" as const },
    ],
    rules: {
      minTotalLength: 500,
      autoAffiliate: true,
      autoPublish: true,
      platforms: ["tistory"],
    },
  };

  it("accepts valid template", () => {
    const result = templateCreateRequestSchema.safeParse(validTemplate);
    expect(result.success).toBe(true);
  });

  it("rejects empty sections", () => {
    const result = templateCreateRequestSchema.safeParse({
      ...validTemplate,
      sections: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = templateCreateRequestSchema.safeParse({
      ...validTemplate,
      category: "blog",
    });
    expect(result.success).toBe(false);
  });
});

describe("scheduleCreateRequestSchema", () => {
  it("accepts valid schedule", () => {
    const result = scheduleCreateRequestSchema.safeParse({
      templateId: "550e8400-e29b-41d4-a716-446655440000",
      cron: "0 9 * * 1",
    });
    expect(result.success).toBe(true);
  });

  it("defaults timezone to Asia/Seoul", () => {
    const result = scheduleCreateRequestSchema.safeParse({
      templateId: "550e8400-e29b-41d4-a716-446655440000",
      cron: "0 9 * * *",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timezone).toBe("Asia/Seoul");
    }
  });

  it("accepts with variableData", () => {
    const result = scheduleCreateRequestSchema.safeParse({
      templateId: "550e8400-e29b-41d4-a716-446655440000",
      cron: "0 9 * * 1",
      variableData: [
        { product_name: "에어팟", features: "노이즈 캔슬링" },
        { product_name: "갤럭시 버즈", features: "긴 배터리" },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("automationExecutionResponseSchema", () => {
  it("accepts valid execution response", () => {
    const result = automationExecutionResponseSchema.safeParse({
      content: "생성된 글 내용",
      ruleValidation: { passed: true, failures: [] },
      published: true,
      publishedPlatforms: ["tistory"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts with rule failures", () => {
    const result = automationExecutionResponseSchema.safeParse({
      content: "짧은 글",
      ruleValidation: { passed: false, failures: ["최소 길이 미달"] },
      published: false,
      publishedPlatforms: [],
    });
    expect(result.success).toBe(true);
  });
});

// ─── Affiliate (수익화 어시스턴트) ──────────────────

describe("affiliateAnalyzeRequestSchema", () => {
  it("accepts valid request", () => {
    const result = affiliateAnalyzeRequestSchema.safeParse({
      draftContent: "출퇴근길에 듣기 좋은 무선 이어폰을 소개합니다.",
    });
    expect(result.success).toBe(true);
  });

  it("defaults provider to coupang", () => {
    const result = affiliateAnalyzeRequestSchema.safeParse({
      draftContent: "테스트 글",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provider).toBe("coupang");
    }
  });

  it("defaults maxSuggestions to 5", () => {
    const result = affiliateAnalyzeRequestSchema.safeParse({
      draftContent: "테스트 글",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxSuggestions).toBe(5);
    }
  });

  it("rejects empty draftContent", () => {
    const result = affiliateAnalyzeRequestSchema.safeParse({
      draftContent: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("affiliateAnalyzeResponseSchema", () => {
  it("accepts valid response", () => {
    const result = affiliateAnalyzeResponseSchema.safeParse({
      suggestions: [
        {
          anchorText: "무선 이어폰",
          surroundingContext: "출퇴근길에 듣기 좋은 무선 이어폰을 소개합니다.",
          position: { paragraphIndex: 0, startOffset: 12, endOffset: 18 },
          productCategory: "electronics/earphones",
          reasoning: "제품 언급이 자연스러운 위치",
          confidence: 85,
        },
      ],
      overallFit: 70,
      tips: ["제품 비교 섹션을 추가하면 더 효과적입니다"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects confidence out of range", () => {
    const result = affiliateAnalyzeResponseSchema.safeParse({
      suggestions: [
        {
          anchorText: "test",
          surroundingContext: "test",
          position: { paragraphIndex: 0, startOffset: 0, endOffset: 4 },
          productCategory: "test",
          reasoning: "test",
          confidence: 150,
        },
      ],
      overallFit: 50,
      tips: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("affiliateGenerateRequestSchema", () => {
  it("accepts valid request", () => {
    const result = affiliateGenerateRequestSchema.safeParse({
      approvedSuggestions: [
        {
          anchorText: "무선 이어폰",
          productCategory: "electronics/earphones",
          position: { paragraphIndex: 0, startOffset: 12, endOffset: 18 },
        },
      ],
      draftContent: "출퇴근길에 듣기 좋은 무선 이어폰을 소개합니다.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty draftContent", () => {
    const result = affiliateGenerateRequestSchema.safeParse({
      approvedSuggestions: [],
      draftContent: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("affiliateGenerateResponseSchema", () => {
  it("accepts valid response", () => {
    const result = affiliateGenerateResponseSchema.safeParse({
      modifiedDraft:
        '출퇴근길에 듣기 좋은 <a href="https://coupang.com/...">무선 이어폰</a>을 소개합니다.',
      insertedLinks: [
        {
          anchorText: "무선 이어폰",
          url: "https://coupang.com/...",
          productName: "삼성 갤럭시 버즈3",
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ─── Messenger (텔레그램 + 디스코드) ────────────────

describe("messengerNotifyRequestSchema", () => {
  it("accepts valid notify request", () => {
    const result = messengerNotifyRequestSchema.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      type: "draft_ready",
      payload: {
        title: "에피소드 3 초안 완성",
        preview: "서진은 서점 문을 열었다...",
        draftId: "550e8400-e29b-41d4-a716-446655440001",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = messengerNotifyRequestSchema.safeParse({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      type: "unknown_type",
      payload: { title: "test", preview: "test", draftId: "550e8400-e29b-41d4-a716-446655440001" },
    });
    expect(result.success).toBe(false);
  });
});

describe("messengerCallbackSchema", () => {
  it("accepts valid callback", () => {
    const result = messengerCallbackSchema.safeParse({
      action: "approve",
      draftId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid action", () => {
    const result = messengerCallbackSchema.safeParse({
      action: "delete",
      draftId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });
});

describe("telegramUpdateSchema", () => {
  it("accepts message update", () => {
    const result = telegramUpdateSchema.safeParse({
      update_id: 12345,
      message: {
        message_id: 1,
        from: { id: 123, first_name: "혜민" },
        chat: { id: 123, type: "private" },
        text: "/start ABC123",
        date: 1700000000,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts callback_query update", () => {
    const result = telegramUpdateSchema.safeParse({
      update_id: 12346,
      callback_query: {
        id: "cb_123",
        from: { id: 123 },
        data: '{"action":"approve","draftId":"abc"}',
        message: { chat: { id: 123 }, message_id: 1 },
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("discordInteractionSchema", () => {
  it("accepts PING interaction", () => {
    const result = discordInteractionSchema.safeParse({
      type: 1,
      token: "interaction_token",
    });
    expect(result.success).toBe(true);
  });

  it("accepts MESSAGE_COMPONENT interaction", () => {
    const result = discordInteractionSchema.safeParse({
      type: 3,
      data: { custom_id: '{"action":"approve","draftId":"abc"}' },
      member: { user: { id: "123", username: "hyemin" } },
      channel_id: "456",
      token: "interaction_token",
    });
    expect(result.success).toBe(true);
  });
});

describe("messengerConnectRequestSchema", () => {
  it("accepts telegram", () => {
    const result = messengerConnectRequestSchema.safeParse({
      provider: "telegram",
    });
    expect(result.success).toBe(true);
  });

  it("accepts discord", () => {
    const result = messengerConnectRequestSchema.safeParse({
      provider: "discord",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid provider", () => {
    const result = messengerConnectRequestSchema.safeParse({
      provider: "slack",
    });
    expect(result.success).toBe(false);
  });
});
