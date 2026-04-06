import { NextResponse } from "next/server";
import { platformConnectRequestSchema } from "@/lib/types";
import { createRateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";
import { getPublisher } from "@/lib/publisher";
import type { Platform } from "@/lib/types";

const getLimiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });
const postLimiter = createRateLimit({ windowMs: 60_000, maxRequests: 3 });

function getIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

export async function GET(req: Request) {
  try {
    const ip = getIp(req);
    const { success, retryAfter } = getLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
      );
    }

    const { data, error } = await supabase
      .from("platform_connections")
      .select("id, platform, site_url, is_active, connected_at")
      .order("connected_at", { ascending: false });

    if (error) {
      console.error("Platform list error:", error.message);
      return NextResponse.json({ error: "플랫폼 목록 조회에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ platforms: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Platforms GET Error:", message);
    return NextResponse.json({ error: "플랫폼 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    const { success, retryAfter } = postLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
      );
    }

    const parsed = platformConnectRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { platform, credentials, siteUrl } = parsed.data;

    const publisher = getPublisher(platform as Platform);
    const isValid = await publisher.validateConnection({
      ...credentials,
      siteUrl,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: `${platform} 연결 인증에 실패했습니다. 자격 증명을 확인해주세요.` },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("platform_connections")
      .upsert(
        {
          platform,
          credentials_encrypted: credentials,
          site_url: siteUrl ?? null,
          is_active: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "platform" }
      )
      .select("id, platform, is_active")
      .single();

    if (error) {
      console.error("Platform connect error:", error.message);
      return NextResponse.json({ error: "플랫폼 연결 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ connected: true, ...data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Platform Connect Error:", message);
    return NextResponse.json({ error: "플랫폼 연결 중 오류가 발생했습니다." }, { status: 500 });
  }
}
