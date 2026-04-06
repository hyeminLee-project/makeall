import type { Messenger, NotificationMessage, ActionButton } from "./types";

const DISCORD_API = "https://discord.com/api/v10";

function getToken(): string {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN이 설정되지 않았습니다.");
  return token;
}

const TYPE_EMOJI: Record<string, string> = {
  draft_ready: "📝",
  publish_complete: "✅",
  publish_failed: "❌",
  review_needed: "⚠️",
};

export class DiscordMessenger implements Messenger {
  readonly provider = "discord";

  async sendNotification(channelId: string, message: NotificationMessage): Promise<void> {
    const emoji = TYPE_EMOJI[message.type] ?? "📌";

    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 3,
            label: "승인",
            custom_id: JSON.stringify({ action: "approve", draftId: message.draftId }),
          },
          {
            type: 2,
            style: 4,
            label: "거절",
            custom_id: JSON.stringify({ action: "reject", draftId: message.draftId }),
          },
          {
            type: 2,
            style: 2,
            label: "미리보기",
            custom_id: JSON.stringify({ action: "preview", draftId: message.draftId }),
          },
          {
            type: 2,
            style: 1,
            label: "피드백",
            custom_id: JSON.stringify({ action: "feedback", draftId: message.draftId }),
          },
        ],
      },
    ];

    await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `${emoji} **${message.title}**\n\n${message.preview}`,
        components,
      }),
    });
  }

  async sendButtons(channelId: string, text: string, buttons: ActionButton[]): Promise<void> {
    const components = [
      {
        type: 1,
        components: buttons.map((b) => ({
          type: 2,
          style: 1,
          label: b.label,
          custom_id: JSON.stringify({ action: b.action, draftId: b.payload }),
        })),
      },
    ];

    await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: text, components }),
    });
  }

  async verifyWebhook(request: Request): Promise<boolean> {
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!publicKey) return false;

    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    if (!signature || !timestamp) return false;

    const body = await request.clone().text();
    const message = new TextEncoder().encode(timestamp + body);

    try {
      const keyData = hexToUint8Array(publicKey).buffer as ArrayBuffer;
      const key = await crypto.subtle.importKey("raw", keyData, { name: "Ed25519" }, false, [
        "verify",
      ]);
      const sigData = hexToUint8Array(signature).buffer as ArrayBuffer;
      return await crypto.subtle.verify("Ed25519", key, sigData, message);
    } catch {
      return false;
    }
  }

  parseCallback(data: unknown): { action: string; draftId: string } | null {
    const interaction = data as { type?: number; data?: { custom_id?: string } };
    if (interaction?.type !== 3) return null;

    const customId = interaction?.data?.custom_id;
    if (!customId) return null;

    try {
      const parsed = JSON.parse(customId);
      if (parsed.action && parsed.draftId) {
        return { action: parsed.action, draftId: parsed.draftId };
      }
    } catch {
      return null;
    }
    return null;
  }
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
