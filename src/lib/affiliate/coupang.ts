import { createHmac } from "crypto";

const COUPANG_API_BASE = "https://api-gateway.coupang.com";

interface CoupangProduct {
  productId: string;
  productName: string;
  productUrl: string;
  productImage: string;
  productPrice: number;
  categoryName: string;
}

interface CoupangSearchResult {
  products: CoupangProduct[];
}

function generateHmacSignature({
  method,
  path,
  query,
  secretKey,
}: {
  method: string;
  path: string;
  query: string;
  secretKey: string;
}): { authorization: string; datetime: string } {
  const datetime = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const message = `${datetime}\n${method}\n${path}\n${query}`;
  const signature = createHmac("sha256", secretKey).update(message).digest("hex");

  const accessKey = process.env.COUPANG_ACCESS_KEY ?? "";
  const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;

  return { authorization, datetime };
}

export async function searchProducts(
  keyword: string,
  limit: number = 5
): Promise<CoupangProduct[]> {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("쿠팡 파트너스 API 키가 설정되지 않았습니다.");
  }

  const path = "/v2/providers/affiliate_open_api/apis/openapi/products/search";
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const { authorization } = generateHmacSignature({
    method: "GET",
    path,
    query,
    secretKey,
  });

  const res = await fetch(`${COUPANG_API_BASE}${path}?${query}`, {
    headers: { Authorization: authorization },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`쿠팡 API 오류: ${res.status} ${body.slice(0, 200)}`);
  }

  const data: CoupangSearchResult = await res.json();
  return data.products ?? [];
}

export function buildAffiliateUrl(productUrl: string, subId?: string): string {
  const url = new URL(productUrl);
  if (subId) url.searchParams.set("subId", subId);
  return url.toString();
}

export function insertLinksIntoDraft(
  draft: string,
  links: { anchorText: string; url: string; position: { paragraphIndex: number } }[]
): string {
  const paragraphs = draft.split("\n\n");

  const sortedLinks = [...links].sort(
    (a, b) => b.position.paragraphIndex - a.position.paragraphIndex
  );

  for (const link of sortedLinks) {
    const idx = link.position.paragraphIndex;
    if (idx >= 0 && idx < paragraphs.length) {
      const paragraph = paragraphs[idx];
      const anchorIndex = paragraph.indexOf(link.anchorText);
      if (anchorIndex !== -1) {
        paragraphs[idx] =
          paragraph.slice(0, anchorIndex) +
          `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.anchorText}</a>` +
          paragraph.slice(anchorIndex + link.anchorText.length);
      }
    }
  }

  return paragraphs.join("\n\n");
}
