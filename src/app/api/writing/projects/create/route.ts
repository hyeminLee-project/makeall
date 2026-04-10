import { NextResponse } from "next/server";
import { projectCreateRequestSchema } from "@/lib/types";
import { createRateLimit, getClientIp } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });

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
    const { userId } = auth;

    const parsed = projectCreateRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const input = parsed.data;

    if (input.writingType === "serial") {
      const { data, error } = await supabaseAdmin
        .from("series")
        .insert({
          user_id: userId,
          writing_type: "serial",
          title: input.title,
          genre: input.genre,
          setting: input.setting,
          characters: input.characters,
          plot_outline: input.plotOutline,
          target_episode_length: input.targetEpisodeLength,
          style_profile_id: input.styleProfileId ?? null,
          tone: input.tone ?? null,
          continuity_state: null,
          status: "active",
        })
        .select("id, created_at")
        .single();

      if (error) {
        console.error("Supabase insert error:", error.message);
        return NextResponse.json({ error: "프로젝트 생성에 실패했습니다." }, { status: 500 });
      }

      return NextResponse.json({ id: data.id, createdAt: data.created_at }, { status: 201 });
    }

    // essay, column, short_story
    const { data, error } = await supabaseAdmin
      .from("series")
      .insert({
        user_id: userId,
        writing_type: input.writingType,
        title: input.title,
        tone: input.tone ?? null,
        type_metadata: input.metadata,
        characters: [],
        status: "active",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json({ error: "프로젝트 생성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, createdAt: data.created_at }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Project Create API Error:", message);
    return NextResponse.json({ error: "프로젝트 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
