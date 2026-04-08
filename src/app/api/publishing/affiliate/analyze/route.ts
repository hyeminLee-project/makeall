import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { affiliateAnalyzeRequestSchema, affiliateAnalyzeResponseSchema } from "@/lib/types";
import { buildAffiliateAnalysisPrompt } from "@/lib/prompts";
import { createRateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth";

const TIMEOUT_MS = 30_000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 5 });

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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const parsed = affiliateAnalyzeRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { draftContent, maxSuggestions } = parsed.data;

    const prompt = buildAffiliateAnalysisPrompt({ draftContent, maxSuggestions });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API request timed out")), TIMEOUT_MS)
    );

    const result = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      }),
      timeoutPromise,
    ]);

    const text = result.text ?? "";
    const jsonString = text.replace(/```json\n?|```/g, "").trim();

    const responseParsed = affiliateAnalyzeResponseSchema.safeParse(
      (() => {
        try {
          return JSON.parse(jsonString);
        } catch {
          return null;
        }
      })()
    );

    if (!responseParsed.success) {
      console.error("Failed to parse affiliate analysis:", jsonString.slice(0, 200));
      return NextResponse.json(
        { error: "AI 응답 파싱에 실패했습니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json(responseParsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Affiliate Analyze Error:", message);
    return NextResponse.json({ error: "수익화 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
