import { NextResponse } from "next/server";
import { discordInteractionSchema } from "@/lib/types";
import { getMessenger } from "@/lib/messenger";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const messenger = getMessenger("discord");
    const isValid = await messenger.verifyWebhook(req);
    if (!isValid) {
      return NextResponse.json({ error: "유효하지 않은 요청입니다." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = discordInteractionSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("Discord webhook parse failed:", parsed.error.message);
      return NextResponse.json({ type: 1 });
    }

    const interaction = parsed.data;

    // PING — Discord 웹훅 검증
    if (interaction.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // MESSAGE_COMPONENT — 버튼 클릭
    if (interaction.type === 3) {
      const callback = messenger.parseCallback(body);
      if (!callback) {
        console.warn("Discord callback parse returned null:", JSON.stringify(body.data?.custom_id));
        return NextResponse.json({ type: 1 });
      }

      const { error: insertError } = await supabaseAdmin.from("messenger_notifications").insert({
        provider: "discord",
        type: "draft_ready",
        draft_id: callback.draftId,
        response_action: callback.action,
        responded_at: new Date().toISOString(),
      });
      if (insertError) {
        console.error("Discord notification insert failed:", insertError.message);
      }

      return NextResponse.json({
        type: 4,
        data: {
          content:
            callback.action === "approve" ? "✅ 승인 완료!" : `📌 ${callback.action} 처리 완료`,
        },
      });
    }

    return NextResponse.json({ type: 1 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Discord Webhook Error:", message);
    return NextResponse.json({ type: 1 });
  }
}
