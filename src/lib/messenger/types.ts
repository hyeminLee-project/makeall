export interface NotificationMessage {
  title: string;
  preview: string;
  type: "draft_ready" | "publish_complete" | "publish_failed" | "review_needed";
  draftId: string;
}

export interface ActionButton {
  label: string;
  action: string;
  payload: string;
}

export interface Messenger {
  readonly provider: string;
  sendNotification(chatId: string, message: NotificationMessage): Promise<void>;
  sendButtons(chatId: string, text: string, buttons: ActionButton[]): Promise<void>;
  verifyWebhook(request: Request): Promise<boolean>;
  parseCallback(data: unknown): { action: string; draftId: string } | null;
}
