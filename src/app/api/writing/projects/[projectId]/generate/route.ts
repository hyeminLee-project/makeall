import { NextResponse } from "next/server";
import { draftGenerateResponseSchema } from "@/lib/types";
import {
  buildEssayGenerationPrompt,
  buildColumnGenerationPrompt,
  buildShortStoryGenerationPrompt,
} from "@/lib/prompts";
import { createRateLimit, getClientIp } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { callGemini } from "@/lib/gemini";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 3 });

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
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
    const { userId } = auth;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const { projectId } = await params;

    const { data: project, error: fetchError } = await supabaseAdmin
      .from("series")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
    }

    if (project.writing_type === "serial") {
      return NextResponse.json(
        { error: "연재소설은 에피소드 생성 API를 사용해주세요." },
        { status: 400 }
      );
    }

    const metadata = project.type_metadata;
    let prompt: string;

    switch (project.writing_type) {
      case "essay":
        prompt = buildEssayGenerationPrompt({
          title: project.title,
          topic: metadata.topic,
          keywords: metadata.keywords,
          tone: project.tone,
          referenceMaterials: metadata.referenceMaterials,
          styleProfile: null,
          referenceStyle: project.reference_style,
        });
        break;
      case "column":
        prompt = buildColumnGenerationPrompt({
          title: project.title,
          topic: metadata.topic,
          argument: metadata.argument,
          targetAudience: metadata.targetAudience,
          tone: project.tone,
          styleProfile: null,
          referenceStyle: project.reference_style,
        });
        break;
      case "short_story":
        prompt = buildShortStoryGenerationPrompt({
          title: project.title,
          genre: metadata.genre,
          setting: metadata.setting,
          targetLength: metadata.targetLength,
          tone: project.tone,
          styleProfile: null,
          referenceStyle: project.reference_style,
        });
        break;
      default:
        return NextResponse.json({ error: "지원하지 않는 글 유형입니다." }, { status: 400 });
    }

    const text = await callGemini(prompt);
    const jsonString = text.replace(/```json\n?|```/g, "").trim();

    const responseParsed = draftGenerateResponseSchema.safeParse(
      (() => {
        try {
          return JSON.parse(jsonString);
        } catch {
          return null;
        }
      })()
    );

    if (!responseParsed.success) {
      console.error("Draft generate parse failed:", jsonString.slice(0, 200));
      return NextResponse.json(
        { error: "AI 응답 파싱에 실패했습니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const result = responseParsed.data;

    const { data: draftData, error: insertError } = await supabaseAdmin
      .from("drafts")
      .insert({
        user_id: userId,
        title: project.title,
        input: JSON.stringify(metadata),
        input_type: "idea",
        draft: result.draft,
        suggestions: result.suggestions,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Draft insert error:", insertError.message);
      return NextResponse.json({ error: "초안 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ id: draftData.id, ...result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Draft Generate API Error:", message);
    const userMessage =
      message.includes("시간이 초과") || message.includes("과부하") || message.includes("실패")
        ? message
        : "초안 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
