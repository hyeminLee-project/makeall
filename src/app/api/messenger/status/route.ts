import { NextResponse } from "next/server";
import { createRateLimit, getClientIp } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });

export async function GET(req: Request) {
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

    const { data, error, count } = await supabaseAdmin
      .from("messenger_connections")
      .select("id, provider, is_verified, created_at", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(0, 49);

    if (error) {
      console.error("Messenger status error:", error.message);
      return NextResponse.json({ error: "메신저 상태 조회에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ connections: data ?? [], total: count ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Messenger Status Error:", message);
    return NextResponse.json(
      { error: "메신저 상태 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
