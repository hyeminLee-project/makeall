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

  it("includes all 5 criteria when 'all' is specified", () => {
    const result = buildCodeReviewPrompt({
      code: "x",
      language: "python",
      focus: ["all"],
    });
    expect(result).toContain("코드 유지보수성");
    expect(result).toContain("코드 이해도 향상");
    expect(result).toContain("로직 정확성");
    expect(result).toContain("보안 취약점");
    expect(result).toContain("코드 이해도 검증");
  });

  it("maps 'readability' to maintainability criterion", () => {
    const result = buildCodeReviewPrompt({
      code: "x",
      language: "go",
      focus: ["readability"],
    });
    expect(result).toContain("코드 유지보수성");
    expect(result).not.toContain("보안 취약점");
  });

  it("maps 'performance' to logic criterion", () => {
    const result = buildCodeReviewPrompt({
      code: "x",
      language: "rust",
      focus: ["performance"],
    });
    expect(result).toContain("로직 정확성");
  });

  it("maps 'comprehension' to comprehension + understanding", () => {
    const result = buildCodeReviewPrompt({
      code: "x",
      language: "typescript",
      focus: ["comprehension"],
    });
    expect(result).toContain("코드 이해도 검증");
    expect(result).toContain("코드 이해도 향상");
  });

  it("includes comprehension questions instruction", () => {
    const result = buildCodeReviewPrompt({
      code: "x",
      language: "typescript",
      focus: ["all"],
    });
    expect(result).toContain("comprehensionQuestions");
    expect(result).toContain("블랙박스");
  });

  it("includes output format with new fields", () => {
    const result = buildCodeReviewPrompt({
      code: "x",
      language: "typescript",
      focus: ["all"],
    });
    expect(result).toContain("categoryScores");
    expect(result).toContain("comprehensionRisks");
    expect(result).toContain("overallComprehensionLevel");
    expect(result).toContain("fixPrompt");
    expect(result).toContain("explanation");
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
