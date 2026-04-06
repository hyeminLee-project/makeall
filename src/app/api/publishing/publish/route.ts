import { NextResponse } from "next/server";
import { publishRequestSchema } from "@/lib/types";
import { createRateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";
import { publishToMultiple } from "@/lib/publisher";
import type { PlatformCredentials } from "@/lib/publisher";
import type { Platform } from "@/lib/types";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 5 });

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

    const parsed = publishRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { contentId, platforms, overrides, scheduledAt } = parsed.data;

    if (scheduledAt) {
      const { error } = await supabase.from("scheduled_publishes").insert({
        content_id: contentId,
        platforms,
        overrides: overrides ?? null,
        scheduled_at: scheduledAt,
        status: "pending",
      });

      if (error) {
        console.error("Schedule insert error:", error.message);
        return NextResponse.json({ error: "예약 발행 등록에 실패했습니다." }, { status: 500 });
      }

      return NextResponse.json({ scheduled: true, scheduledAt }, { status: 201 });
    }

    const { data: draft } = await supabase
      .from("episodes")
      .select("draft, final_content")
      .eq("id", contentId)
      .single();

    const body = draft?.final_content ?? draft?.draft;
    if (!body) {
      return NextResponse.json({ error: "발행할 콘텐츠를 찾을 수 없습니다." }, { status: 404 });
    }

    const baseContent = {
      title: "",
      body,
      format: "html" as const,
      tags: [] as string[],
    };

    const results = await publishToMultiple(
      platforms,
      baseContent,
      async (platform: Platform): Promise<PlatformCredentials | null> => {
        const { data } = await supabase
          .from("platform_connections")
          .select("credentials_encrypted, site_url")
          .eq("platform", platform)
          .eq("is_active", true)
          .single();

        if (!data) return null;

        return {
          ...data.credentials_encrypted,
          siteUrl: data.site_url,
        };
      }
    );

    for (const result of results) {
      await supabase.from("publish_history").insert({
        content_id: contentId,
        platform: result.platform,
        post_url: result.postUrl ?? null,
        status: result.success ? "published" : "failed",
        published_at: result.success ? new Date().toISOString() : null,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Publish API Error:", message);
    return NextResponse.json({ error: "발행 중 오류가 발생했습니다." }, { status: 500 });
  }
}
