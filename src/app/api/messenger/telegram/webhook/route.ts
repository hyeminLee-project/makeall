import { NextResponse } from "next/server";
import { telegramUpdateSchema } from "@/lib/types";
import { getMessenger } from "@/lib/messenger";
import { answerCallbackQuery } from "@/lib/messenger/telegram";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const messenger = getMessenger("telegram");
    const isValid = await messenger.verifyWebhook(req);
    if (!isValid) {
      return NextResponse.json({ error: "유효하지 않은 요청입니다." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = telegramUpdateSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("Telegram webhook parse failed:", parsed.error.message);
      return NextResponse.json({ ok: true });
    }

    const update = parsed.data;

    if (update.message?.text?.startsWith("/start ")) {
      const code = update.message.text.replace("/start ", "").trim();
      const chatId = update.message.chat.id;
      const userId = update.message.from.id;

      const { data } = await supabaseAdmin
        .from("messenger_connections")
        .select("id")
        .eq("verification_code", code)
        .eq("provider", "telegram")
        .eq("is_verified", false)
        .single();

      if (data) {
        const { error: updateError } = await supabaseAdmin
          .from("messenger_connections")
          .update({
            chat_id: String(chatId),
            provider_user_id: String(userId),
            is_verified: true,
            verification_code: null,
          })
          .eq("id", data.id);
        if (updateError) {
          console.error("Telegram verification update failed:", updateError.message);
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (update.callback_query) {
      const callback = messenger.parseCallback(body);
      if (!callback) {
        console.warn("Telegram callback parse returned null:", update.callback_query.id);
        return NextResponse.json({ ok: true });
      }

      const chatId = update.callback_query.message?.chat.id;
      if (chatId) {
        const { error: insertError } = await supabaseAdmin.from("messenger_notifications").insert({
          provider: "telegram",
          type: "draft_ready",
          draft_id: callback.draftId,
          response_action: callback.action,
          responded_at: new Date().toISOString(),
        });
        if (insertError) {
          console.error("Telegram notification insert failed:", insertError.message);
        }
      }

      await answerCallbackQuery(
        update.callback_query.id,
        callback.action === "approve" ? "승인 완료!" : "처리 완료"
      );

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Telegram Webhook Error:", message);
    return NextResponse.json({ ok: true });
  }
}
