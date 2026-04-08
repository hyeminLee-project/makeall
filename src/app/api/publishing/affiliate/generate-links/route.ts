import { NextResponse } from "next/server";
import { affiliateGenerateRequestSchema } from "@/lib/types";
import { createRateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth";
import { searchProducts, buildAffiliateUrl, insertLinksIntoDraft } from "@/lib/affiliate/coupang";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 10 });

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
    const { success, retryAfter } = limiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
      );
    }

    const auth = await getAuthUser();
    if (auth instanceof NextResponse) return auth;

    if (!process.env.COUPANG_ACCESS_KEY || !process.env.COUPANG_SECRET_KEY) {
      return NextResponse.json(
        { error: "쿠팡 파트너스 API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const parsed = affiliateGenerateRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { approvedSuggestions, draftContent } = parsed.data;

    const insertedLinks: { anchorText: string; url: string; productName: string }[] = [];
    const linksForInsert: {
      anchorText: string;
      url: string;
      position: { paragraphIndex: number };
    }[] = [];

    for (const suggestion of approvedSuggestions) {
      try {
        const products = await searchProducts(suggestion.anchorText, 1);
        if (products.length === 0) continue;

        const product = products[0];
        const affiliateUrl = buildAffiliateUrl(product.productUrl);

        insertedLinks.push({
          anchorText: suggestion.anchorText,
          url: affiliateUrl,
          productName: product.productName,
        });

        linksForInsert.push({
          anchorText: suggestion.anchorText,
          url: affiliateUrl,
          position: suggestion.position,
        });
      } catch (error) {
        console.error(`Failed to search for "${suggestion.anchorText}":`, error);
      }
    }

    const modifiedDraft = insertLinksIntoDraft(draftContent, linksForInsert);

    return NextResponse.json({ modifiedDraft, insertedLinks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Affiliate Generate Links Error:", message);
    return NextResponse.json(
      { error: "어필리에이트 링크 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
