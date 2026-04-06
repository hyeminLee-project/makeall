import type { MessengerProvider } from "@/lib/types";
import type { Messenger, NotificationMessage } from "./types";
import { TelegramMessenger } from "./telegram";
import { DiscordMessenger } from "./discord";
import { supabase } from "@/lib/supabase";

const messengers: Record<MessengerProvider, Messenger> = {
  telegram: new TelegramMessenger(),
  discord: new DiscordMessenger(),
};

export function getMessenger(provider: MessengerProvider): Messenger {
  return messengers[provider];
}

export async function notifyAllConnected(
  userId: string,
  message: NotificationMessage
): Promise<void> {
  const { data: connections } = await supabase
    .from("messenger_connections")
    .select("provider, chat_id")
    .eq("user_id", userId)
    .eq("is_verified", true);

  if (!connections || connections.length === 0) return;

  const tasks = connections.map(async (conn) => {
    try {
      const messenger = getMessenger(conn.provider as MessengerProvider);
      await messenger.sendNotification(conn.chat_id, message);

      await supabase.from("messenger_notifications").insert({
        user_id: userId,
        provider: conn.provider,
        type: message.type,
        draft_id: message.draftId,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`${conn.provider} 알림 전송 실패:`, error);
    }
  });

  await Promise.allSettled(tasks);
}
