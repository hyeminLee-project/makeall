import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { continuityUpdateResponseSchema } from "@/lib/types";
import { buildContinuityUpdatePrompt } from "@/lib/prompts";
import { createRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

const TIMEOUT_MS = 30_000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 5 });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ seriesId: string; episodeId: string }> }
) {
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
    const { userId } = auth;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const { seriesId, episodeId } = await params;

    const { data: episode, error: episodeError } = await supabaseAdmin
      .from("episodes")
      .select("*")
      .eq("id", episodeId)
      .eq("series_id", seriesId)
      .single();

    if (episodeError || !episode) {
      return NextResponse.json({ error: "에피소드를 찾을 수 없습니다." }, { status: 404 });
    }

    const content = episode.final_content ?? episode.draft;
    if (!content) {
      return NextResponse.json({ error: "에피소드 내용이 비어있습니다." }, { status: 400 });
    }

    const { data: series, error: seriesError } = await supabaseAdmin
      .from("series")
      .select("characters, continuity_state")
      .eq("id", seriesId)
      .eq("user_id", userId)
      .single();

    if (seriesError || !series) {
      return NextResponse.json({ error: "시리즈를 찾을 수 없습니다." }, { status: 404 });
    }

    const prompt = buildContinuityUpdatePrompt({
      episodeContent: content,
      currentContinuity: series.continuity_state,
      characters: series.characters,
      episodeNumber: episode.episode_number,
    });

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

    const continuityParsed = continuityUpdateResponseSchema.safeParse(
      (() => {
        try {
          return JSON.parse(jsonString);
        } catch {
          return null;
        }
      })()
    );

    if (!continuityParsed.success) {
      console.error("Failed to parse continuity response:", jsonString.slice(0, 200));
      return NextResponse.json(
        { error: "연속성 업데이트 파싱에 실패했습니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const newContinuity = {
      ...continuityParsed.data,
      lastEpisodeNumber: episode.episode_number,
    };

    const seriesUpdate: Record<string, unknown> = {
      continuity_state: newContinuity,
      updated_at: new Date().toISOString(),
    };

    if (episode.episode_number === 1) {
      seriesUpdate.reference_style = content.slice(0, 2000);
    }

    const { error: updateSeriesError } = await supabaseAdmin
      .from("series")
      .update(seriesUpdate)
      .eq("id", seriesId);

    if (updateSeriesError) {
      console.error("Series continuity update error:", updateSeriesError.message);
      return NextResponse.json({ error: "연속성 상태 저장에 실패했습니다." }, { status: 500 });
    }

    const { error: updateEpisodeError } = await supabaseAdmin
      .from("episodes")
      .update({ status: "finalized", finalized_at: new Date().toISOString() })
      .eq("id", episodeId);

    if (updateEpisodeError) {
      console.error("Episode finalize error:", updateEpisodeError.message);
      return NextResponse.json(
        { error: "에피소드 상태 업데이트에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      episodeId,
      status: "finalized",
      continuity: newContinuity,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Episode Finalize API Error:", message);
    return NextResponse.json(
      { error: "에피소드 완성 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
