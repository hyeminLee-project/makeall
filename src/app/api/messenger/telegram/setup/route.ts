import { NextResponse } from "next/server";
import { createRateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth";
import { setWebhook } from "@/lib/messenger/telegram";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 2 });

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

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN이 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const webhookUrl = `${protocol}://${host}/api/messenger/telegram/webhook`;

    await setWebhook(webhookUrl);

    return NextResponse.json({ webhookUrl, setup: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Telegram Setup Error:", message);
    return NextResponse.json({ error: "텔레그램 웹훅 설정에 실패했습니다." }, { status: 500 });
  }
}
