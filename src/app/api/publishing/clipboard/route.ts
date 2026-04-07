import { NextResponse } from "next/server";
import { clipboardRequestSchema } from "@/lib/types";
import { createRateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";
import { getClipboardPublisher } from "@/lib/publisher";

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

    const parsed = clipboardRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { contentId, platform } = parsed.data;

    const { data: draftRow } = await supabase
      .from("drafts")
      .select("title, draft, final_content")
      .eq("id", contentId)
      .single();

    const { data: episodeRow } = !draftRow
      ? await supabase.from("episodes").select("draft, final_content").eq("id", contentId).single()
      : { data: null };

    const content = draftRow ?? episodeRow;
    const body = content?.final_content ?? content?.draft;
    if (!body) {
      return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다." }, { status: 404 });
    }

    const publisher = getClipboardPublisher(platform);
    const result = publisher.formatForClipboard({
      title: draftRow?.title ?? "",
      body,
      format: "html",
      tags: [],
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Clipboard API Error:", message);
    return NextResponse.json({ error: "클립보드 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
