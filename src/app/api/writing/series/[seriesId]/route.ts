import { NextResponse } from "next/server";
import { seriesCreateRequestSchema } from "@/lib/types";
import { createRateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });

function getIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

function checkRateLimit(ip: string) {
  const { success, retryAfter } = limiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
    );
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ seriesId: string }> }) {
  try {
    const { seriesId } = await params;

    const { data: series, error } = await supabase
      .from("series")
      .select("*")
      .eq("id", seriesId)
      .single();

    if (error || !series) {
      return NextResponse.json({ error: "시리즈를 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: episodes } = await supabase
      .from("episodes")
      .select("id, episode_number, status, word_count, created_at, finalized_at")
      .eq("series_id", seriesId)
      .order("episode_number", { ascending: true });

    return NextResponse.json({ series, episodes: episodes ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Series GET API Error:", message);
    return NextResponse.json({ error: "시리즈 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ seriesId: string }> }) {
  try {
    const ip = getIp(req);
    const rateLimitResponse = checkRateLimit(ip);
    if (rateLimitResponse) return rateLimitResponse;

    const { seriesId } = await params;

    const body = await req.json();
    const parsed = seriesCreateRequestSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const {
      title,
      genre,
      setting,
      characters,
      plotOutline,
      targetEpisodeLength,
      styleProfileId,
      tone,
    } = parsed.data;

    if (title !== undefined) updates.title = title;
    if (genre !== undefined) updates.genre = genre;
    if (setting !== undefined) updates.setting = setting;
    if (characters !== undefined) updates.characters = characters;
    if (plotOutline !== undefined) updates.plot_outline = plotOutline;
    if (targetEpisodeLength !== undefined) updates.target_episode_length = targetEpisodeLength;
    if (styleProfileId !== undefined) updates.style_profile_id = styleProfileId;
    if (tone !== undefined) updates.tone = tone;

    const { data, error } = await supabase
      .from("series")
      .update(updates)
      .eq("id", seriesId)
      .select("id, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "시리즈 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, updatedAt: data.updated_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Series PUT API Error:", message);
    return NextResponse.json({ error: "시리즈 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}
