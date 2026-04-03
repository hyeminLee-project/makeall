import { describe, it, expect } from "vitest";
import {
  codeReviewRequestSchema,
  codeReviewResponseSchema,
  writingRequestSchema,
  styleProfileSchema,
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
      issues: [
        { severity: "warning", message: "Unused variable", line: 1 },
      ],
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
