import { NextResponse } from "next/server";
import { createRateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";
import { z } from "zod/v4";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });

const episodeUpdateSchema = z.object({
  finalContent: z.string().min(1).max(100000),
});

export async function PUT(
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

    const { seriesId, episodeId } = await params;

    const parsed = episodeUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("episodes")
      .update({
        final_content: parsed.data.finalContent,
        word_count: parsed.data.finalContent.length,
        status: "editing",
      })
      .eq("id", episodeId)
      .eq("series_id", seriesId)
      .select("id, status, word_count")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "에피소드를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Episode PUT API Error:", message);
    return NextResponse.json({ error: "에피소드 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
