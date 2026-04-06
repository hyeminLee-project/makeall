import { describe, it, expect } from "vitest";
import { insertLinksIntoDraft, buildAffiliateUrl } from "./coupang";

describe("insertLinksIntoDraft", () => {
  it("inserts a link at the correct position", () => {
    const draft = "출퇴근길에 듣기 좋은 무선 이어폰을 소개합니다.\n\n두 번째 문단입니다.";
    const result = insertLinksIntoDraft(draft, [
      {
        anchorText: "무선 이어폰",
        url: "https://coupang.com/product/123",
        position: { paragraphIndex: 0 },
      },
    ]);
    expect(result).toContain('href="https://coupang.com/product/123"');
    expect(result).toContain(">무선 이어폰</a>");
  });

  it("handles multiple links in different paragraphs", () => {
    const draft = "첫 번째 문단에 노트북이 있다.\n\n두 번째 문단에 키보드가 있다.";
    const result = insertLinksIntoDraft(draft, [
      {
        anchorText: "노트북",
        url: "https://coupang.com/notebook",
        position: { paragraphIndex: 0 },
      },
      {
        anchorText: "키보드",
        url: "https://coupang.com/keyboard",
        position: { paragraphIndex: 1 },
      },
    ]);
    expect(result).toContain(">노트북</a>");
    expect(result).toContain(">키보드</a>");
  });

  it("skips if anchorText not found in paragraph", () => {
    const draft = "이 문단에는 해당 텍스트가 없습니다.";
    const result = insertLinksIntoDraft(draft, [
      {
        anchorText: "없는 텍스트",
        url: "https://coupang.com/x",
        position: { paragraphIndex: 0 },
      },
    ]);
    expect(result).toBe(draft);
  });
});

describe("buildAffiliateUrl", () => {
  it("returns url as-is without subId", () => {
    const result = buildAffiliateUrl("https://www.coupang.com/vp/products/123");
    expect(result).toBe("https://www.coupang.com/vp/products/123");
  });

  it("appends subId parameter", () => {
    const result = buildAffiliateUrl("https://www.coupang.com/vp/products/123", "makeall");
    expect(result).toContain("subId=makeall");
  });
});
