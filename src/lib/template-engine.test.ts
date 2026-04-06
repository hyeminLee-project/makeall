import { describe, it, expect } from "vitest";
import { substituteVariables, validateRules } from "./template-engine";

describe("substituteVariables", () => {
  it("replaces known variables", () => {
    const result = substituteVariables("{{product_name}}의 리뷰입니다", {
      product_name: "에어팟",
    });
    expect(result).toContain("에어팟");
  });

  it("keeps unknown variables as-is", () => {
    const result = substituteVariables("{{unknown}} 변수", {});
    expect(result).toBe("{{unknown}} 변수");
  });

  it("replaces multiple variables", () => {
    const result = substituteVariables("{{name}} - {{price}}원", {
      name: "갤럭시 버즈",
      price: "150000",
    });
    expect(result).toContain("갤럭시 버즈");
    expect(result).toContain("150000");
  });
});

describe("validateRules", () => {
  it("passes when all rules met", () => {
    const result = validateRules("쿠팡에서 할인 중인 에어팟을 소개합니다. 정말 좋은 제품입니다.", {
      minTotalLength: 10,
      maxTotalLength: 1000,
      requiredKeywords: ["쿠팡", "할인"],
      forbiddenWords: ["최저가 보장"],
      autoAffiliate: false,
      autoPublish: false,
      platforms: [],
    });
    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it("fails on min length", () => {
    const result = validateRules("짧은 글", {
      minTotalLength: 100,
      requiredKeywords: [],
      forbiddenWords: [],
      autoAffiliate: false,
      autoPublish: false,
      platforms: [],
    });
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toContain("최소 길이");
  });

  it("fails on max length", () => {
    const result = validateRules("a".repeat(200), {
      maxTotalLength: 100,
      requiredKeywords: [],
      forbiddenWords: [],
      autoAffiliate: false,
      autoPublish: false,
      platforms: [],
    });
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toContain("최대 길이");
  });

  it("fails on missing keyword", () => {
    const result = validateRules("에어팟 소개글입니다", {
      requiredKeywords: ["쿠팡"],
      forbiddenWords: [],
      autoAffiliate: false,
      autoPublish: false,
      platforms: [],
    });
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toContain("쿠팡");
  });

  it("fails on forbidden word", () => {
    const result = validateRules("이건 최저가 보장 상품입니다", {
      requiredKeywords: [],
      forbiddenWords: ["최저가 보장"],
      autoAffiliate: false,
      autoPublish: false,
      platforms: [],
    });
    expect(result.passed).toBe(false);
    expect(result.failures[0]).toContain("최저가 보장");
  });

  it("collects multiple failures", () => {
    const result = validateRules("짧고 금지어 포함", {
      minTotalLength: 1000,
      requiredKeywords: ["쿠팡"],
      forbiddenWords: ["금지어"],
      autoAffiliate: false,
      autoPublish: false,
      platforms: [],
    });
    expect(result.passed).toBe(false);
    expect(result.failures.length).toBe(3);
  });
});
