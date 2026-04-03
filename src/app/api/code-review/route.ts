import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { codeReviewRequestSchema, codeReviewResponseSchema } from "@/lib/types";
import { buildCodeReviewPrompt } from "@/lib/prompts";
import { createRateLimit } from "@/lib/rate-limit";

const TIMEOUT_MS = 30_000;
const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 10 });

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
    const { success, retryAfter } = limiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const parsed = codeReviewRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { code, language, focus } = parsed.data;
    const prompt = buildCodeReviewPrompt({ code, language, focus });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

    const responseParsed = codeReviewResponseSchema.safeParse(
      (() => {
        try {
          return JSON.parse(jsonString);
        } catch {
          return null;
        }
      })()
    );

    if (!responseParsed.success) {
      console.error("Failed to parse Gemini response:", jsonString.slice(0, 200));
      return NextResponse.json(
        { error: "AI 응답 파싱에 실패했습니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json(responseParsed.data);
  } catch (error) {
    console.error("Code Review API Error:", error);
    return NextResponse.json(
      { error: "코드 리뷰 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
