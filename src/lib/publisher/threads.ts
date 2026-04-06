import type { Publisher, PublishContent, PublishResult, PlatformCredentials } from "./types";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

export class ThreadsPublisher implements Publisher {
  readonly platform = "threads";

  async publish(content: PublishContent, credentials: PlatformCredentials): Promise<PublishResult> {
    const { accessToken } = credentials;
    if (!accessToken) {
      return { success: false, error: "Threads 액세스 토큰이 없습니다." };
    }

    const text = content.format === "html" ? this.stripHtml(content.body) : content.body;
    const truncated = text.slice(0, 500);

    try {
      const createRes = await fetch(`${THREADS_API_BASE}/me/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "TEXT",
          text: truncated,
          access_token: accessToken,
        }),
      });

      if (!createRes.ok) {
        const body = await createRes.text();
        return { success: false, error: `Threads 컨테이너 생성 실패: ${body.slice(0, 200)}` };
      }

      const { id: containerId } = await createRes.json();

      const publishRes = await fetch(`${THREADS_API_BASE}/me/threads_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      });

      if (!publishRes.ok) {
        const body = await publishRes.text();
        return { success: false, error: `Threads 발행 실패: ${body.slice(0, 200)}` };
      }

      const { id: postId } = await publishRes.json();
      return { success: true, postId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return { success: false, error: `Threads 연결 오류: ${message}` };
    }
  }

  async validateConnection(credentials: PlatformCredentials): Promise<boolean> {
    const { accessToken } = credentials;
    if (!accessToken) return false;

    try {
      const res = await fetch(`${THREADS_API_BASE}/me?access_token=${accessToken}`);
      return res.ok;
    } catch {
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }
}
