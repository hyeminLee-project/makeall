import { NextResponse } from "next/server";
import { messengerConnectRequestSchema } from "@/lib/types";
import { createRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

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

    const auth = await getAuthUser();
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const parsed = messengerConnectRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { provider } = parsed.data;

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data, error } = await supabaseAdmin
      .from("messenger_connections")
      .insert({
        user_id: userId,
        provider,
        verification_code: code,
        is_verified: false,
      })
      .select("id, verification_code")
      .single();

    if (error) {
      console.error("Messenger connect error:", error.message);
      return NextResponse.json({ error: "연동 코드 생성에 실패했습니다." }, { status: 500 });
    }

    const instructions =
      provider === "telegram"
        ? `텔레그램 봇에 /start ${code} 를 입력하세요.`
        : `디스코드 봇 DM에 /link ${code} 를 입력하세요.`;

    return NextResponse.json({
      code: data.verification_code,
      provider,
      instructions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Messenger Connect Error:", message);
    return NextResponse.json({ error: "메신저 연동 중 오류가 발생했습니다." }, { status: 500 });
  }
}
