import type { Publisher, PublishContent, PublishResult, PlatformCredentials } from "./types";

const MEDIUM_API_BASE = "https://api.medium.com/v1";

export class MediumPublisher implements Publisher {
  readonly platform = "medium";

  async publish(content: PublishContent, credentials: PlatformCredentials): Promise<PublishResult> {
    const { accessToken } = credentials;
    if (!accessToken) {
      return { success: false, error: "Medium Integration Token이 없습니다." };
    }

    try {
      const userId = await this.getUserId(accessToken);
      if (!userId) {
        return { success: false, error: "Medium 사용자 정보를 가져올 수 없습니다." };
      }

      const res = await fetch(`${MEDIUM_API_BASE}/users/${userId}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: content.title,
          contentFormat: content.format,
          content: content.body,
          tags: content.tags.slice(0, 5),
          publishStatus: "public",
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return { success: false, error: `Medium API 오류: ${res.status} ${body.slice(0, 200)}` };
      }

      const data = await res.json();
      return {
        success: true,
        postId: data.data?.id,
        postUrl: data.data?.url,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return { success: false, error: `Medium 연결 오류: ${message}` };
    }
  }

  async validateConnection(credentials: PlatformCredentials): Promise<boolean> {
    const { accessToken } = credentials;
    if (!accessToken) return false;

    try {
      const res = await fetch(`${MEDIUM_API_BASE}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async getUserId(accessToken: string): Promise<string | null> {
    try {
      const res = await fetch(`${MEDIUM_API_BASE}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data?.id ?? null;
    } catch {
      return null;
    }
  }
}
