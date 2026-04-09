import { NextResponse } from "next/server";
import { platformConnectRequestSchema } from "@/lib/types";
import { createRateLimit, getClientIp } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { getPublisher } from "@/lib/publisher";
import type { Platform } from "@/lib/types";

const getLimiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });
const postLimiter = createRateLimit({ windowMs: 60_000, maxRequests: 3 });

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success, retryAfter } = getLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
      );
    }

    const auth = await getAuthUser();
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const { data, error, count } = await supabaseAdmin
      .from("platform_connections")
      .select("id, platform, site_url, is_active, connected_at", { count: "exact" })
      .eq("user_id", userId)
      .order("connected_at", { ascending: false })
      .range(0, 49);

    if (error) {
      console.error("Platform list error:", error.message);
      return NextResponse.json({ error: "플랫폼 목록 조회에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ platforms: data ?? [], total: count ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Platforms GET Error:", message);
    return NextResponse.json({ error: "플랫폼 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success, retryAfter } = postLimiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
      );
    }

    const auth = await getAuthUser();
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

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

    const { data, error } = await supabaseAdmin
      .from("platform_connections")
      .upsert(
        {
          user_id: userId,
          platform,
          credentials_encrypted: encrypt(credentials),
          site_url: siteUrl ?? null,
          is_active: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" }
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
