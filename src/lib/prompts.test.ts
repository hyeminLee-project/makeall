import { describe, it, expect } from "vitest";
import { buildCodeReviewPrompt, buildWritingPrompt, buildStyleAnalysisPrompt } from "./prompts";

describe("buildCodeReviewPrompt", () => {
  it("includes code and language", () => {
    const result = buildCodeReviewPrompt({
      code: "const x = 1;",
      language: "typescript",
      focus: ["security"],
    });
    expect(result).toContain("const x = 1;");
    expect(result).toContain("typescript");
  });

  it("includes all focus areas when 'all' is specified", () => {
    const result = buildCodeReviewPrompt({
      code: "x",
      language: "python",
      focus: ["all"],
    });
    expect(result).toContain("보안, 성능, 가독성 전체");
  });

  it("lists specific focus areas", () => {
    const result = buildCodeReviewPrompt({
      code: "x",
      language: "go",
      focus: ["security", "performance"],
    });
    expect(result).toContain("security");
    expect(result).toContain("performance");
  });
});

describe("buildWritingPrompt", () => {
  it("includes the idea input", () => {
    const result = buildWritingPrompt({
      input: "AI 트렌드 정리",
      inputType: "idea",
      platforms: ["blog"],
    });
    expect(result).toContain("AI 트렌드 정리");
    expect(result).toContain("아이디어를 기반으로");
  });

  it("handles URL input type", () => {
    const result = buildWritingPrompt({
      input: "https://example.com",
      inputType: "url",
      platforms: ["blog"],
    });
    expect(result).toContain("URL의 내용을 참고");
  });

  it("includes style profile when provided", () => {
    const result = buildWritingPrompt({
      input: "test",
      inputType: "idea",
      platforms: ["blog"],
      styleProfile: {
        sentenceLength: "short",
        tone: "casual",
        ending: "yo",
        humor: "frequent",
        structure: "conclusion_first",
        vocabulary: ["그래서"],
        expressions: ["솔직히 말하면"],
      },
    });
    expect(result).toContain("문체 가이드");
    expect(result).toContain("솔직히 말하면");
  });

  it("includes multiple platform instructions", () => {
    const result = buildWritingPrompt({
      input: "test",
      inputType: "idea",
      platforms: ["blog", "instagram", "x_thread"],
    });
    expect(result).toContain("blog:");
    expect(result).toContain("instagram:");
    expect(result).toContain("x_thread:");
  });
});

describe("buildStyleAnalysisPrompt", () => {
  it("includes all samples", () => {
    const result = buildStyleAnalysisPrompt(["글 1 내용", "글 2 내용"]);
    expect(result).toContain("샘플 1");
    expect(result).toContain("글 1 내용");
    expect(result).toContain("샘플 2");
    expect(result).toContain("글 2 내용");
  });
});
