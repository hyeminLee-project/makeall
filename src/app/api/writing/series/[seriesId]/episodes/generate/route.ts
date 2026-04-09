import { NextResponse } from "next/server";
import { episodeGenerateRequestSchema, episodeGenerateResponseSchema } from "@/lib/types";
import { buildEpisodeGenerationPrompt } from "@/lib/prompts";
import { createRateLimit, getClientIp } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { callGemini } from "@/lib/gemini";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 3 });

export async function POST(req: Request, { params }: { params: Promise<{ seriesId: string }> }) {
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

    const { seriesId } = await params;

    const parsed = episodeGenerateRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data: series, error: seriesError } = await supabaseAdmin
      .from("series")
      .select("*")
      .eq("id", seriesId)
      .eq("user_id", userId)
      .single();

    if (seriesError || !series) {
      return NextResponse.json({ error: "시리즈를 찾을 수 없습니다." }, { status: 404 });
    }

    const { episodeNumber, episodeOutline, focusCharacters, plotPoints, specialInstructions } =
      parsed.data;

    const prompt = buildEpisodeGenerationPrompt({
      title: series.title,
      genre: series.genre,
      setting: series.setting,
      characters: series.characters,
      plotOutline: series.plot_outline,
      targetEpisodeLength: series.target_episode_length,
      tone: series.tone,
      continuity: series.continuity_state,
      episodeOutline,
      episodeNumber,
      focusCharacters,
      plotPoints,
      specialInstructions,
      styleProfile: null,
      referenceStyle: series.reference_style,
    });

    const text = await callGemini(prompt);
    const jsonString = text.replace(/```json\n?|```/g, "").trim();

    const responseParsed = episodeGenerateResponseSchema.safeParse(
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

    const episode = responseParsed.data;

    const { data: episodeData, error: insertError } = await supabaseAdmin
      .from("episodes")
      .insert({
        series_id: seriesId,
        episode_number: episodeNumber,
        outline: episodeOutline,
        draft: episode.draft,
        continuity_notes: episode.continuityNotes,
        status: "draft",
        word_count: episode.wordCount,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Episode insert error:", insertError.message);
      return NextResponse.json({ error: "에피소드 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ id: episodeData.id, ...episode }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Episode Generate API Error:", message);
    const userMessage =
      message.includes("시간이 초과") || message.includes("과부하") || message.includes("실패")
        ? message
        : "에피소드 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
