import { NextResponse } from "next/server";
import { seriesCreateRequestSchema } from "@/lib/types";
import { createRateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });

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

    const parsed = seriesCreateRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

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

    const { data, error } = await supabase
      .from("series")
      .insert({
        title,
        genre,
        setting,
        characters,
        plot_outline: plotOutline,
        target_episode_length: targetEpisodeLength,
        style_profile_id: styleProfileId ?? null,
        tone: tone ?? null,
        continuity_state: null,
        status: "active",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json({ error: "시리즈 생성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, createdAt: data.created_at }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Series Create API Error:", message);
    return NextResponse.json({ error: "시리즈 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
