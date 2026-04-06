import type { Messenger, NotificationMessage, ActionButton } from "./types";

const TELEGRAM_API = "https://api.telegram.org/bot";

function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.");
  return token;
}

async function callApi(method: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${TELEGRAM_API}${getToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram API ${method} 실패: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const TYPE_EMOJI: Record<string, string> = {
  draft_ready: "📝",
  publish_complete: "✅",
  publish_failed: "❌",
  review_needed: "⚠️",
};

export class TelegramMessenger implements Messenger {
  readonly provider = "telegram";

  async sendNotification(chatId: string, message: NotificationMessage): Promise<void> {
    const emoji = TYPE_EMOJI[message.type] ?? "📌";
    const text = `${emoji} ${message.title}\n\n${message.preview}`;

    const buttons = [
      [
        {
          text: "승인",
          callback_data: JSON.stringify({ action: "approve", draftId: message.draftId }),
        },
        {
          text: "거절",
          callback_data: JSON.stringify({ action: "reject", draftId: message.draftId }),
        },
      ],
      [
        {
          text: "미리보기",
          callback_data: JSON.stringify({ action: "preview", draftId: message.draftId }),
        },
        {
          text: "피드백",
          callback_data: JSON.stringify({ action: "feedback", draftId: message.draftId }),
        },
      ],
    ];

    await callApi("sendMessage", {
      chat_id: chatId,
      text,
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async sendButtons(chatId: string, text: string, buttons: ActionButton[]): Promise<void> {
    const keyboard = buttons.map((b) => [
      { text: b.label, callback_data: JSON.stringify({ action: b.action, draftId: b.payload }) },
    ]);

    await callApi("sendMessage", {
      chat_id: chatId,
      text,
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  async verifyWebhook(request: Request): Promise<boolean> {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret) return false;
    const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
    return headerSecret === secret;
  }

  parseCallback(data: unknown): { action: string; draftId: string } | null {
    const update = data as { callback_query?: { data?: string } };
    const callbackData = update?.callback_query?.data;
    if (!callbackData) return null;

    try {
      const parsed = JSON.parse(callbackData);
      if (parsed.action && parsed.draftId) {
        return { action: parsed.action, draftId: parsed.draftId };
      }
    } catch {
      return null;
    }
    return null;
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  await callApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text ?? "처리 완료",
  });
}

export async function setWebhook(url: string): Promise<void> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  await callApi("setWebhook", {
    url,
    ...(secret ? { secret_token: secret } : {}),
  });
}
