import { NextResponse } from "next/server";
import { quickStartRequestSchema, quickStartResponseSchemas } from "@/lib/types";
import type { WritingType } from "@/lib/types";
import { buildQuickStartPrompt } from "@/lib/prompts";
import { createRateLimit, getClientIp } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth";
import { callGemini } from "@/lib/gemini";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 10 });

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
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

    const parsed = quickStartRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const prompt = buildQuickStartPrompt(parsed.data);
    const text = await callGemini(prompt);
    const jsonString = text.replace(/```json\n?|```/g, "").trim();

    const rawSettings = (() => {
      try {
        return JSON.parse(jsonString);
      } catch {
        return null;
      }
    })();

    if (!rawSettings) {
      console.error("Quick start JSON parse failed:", jsonString.slice(0, 200));
      return NextResponse.json(
        { error: "AI 응답 파싱에 실패했습니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const schema = quickStartResponseSchemas[parsed.data.writingType as WritingType];
    const validated = schema.safeParse(rawSettings);

    if (!validated.success) {
      console.error("Quick start validation failed:", validated.error.message);
      return NextResponse.json(
        { error: "AI 응답이 올바른 형식이 아닙니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json(validated.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Quick Start API Error:", message);
    const userMessage =
      message.includes("시간이 초과") || message.includes("과부하") || message.includes("실패")
        ? message
        : "설정 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
