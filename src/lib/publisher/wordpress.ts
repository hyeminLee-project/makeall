import type { Publisher, PublishContent, PublishResult, PlatformCredentials } from "./types";

export class WordPressPublisher implements Publisher {
  readonly platform = "wordpress";

  async publish(content: PublishContent, credentials: PlatformCredentials): Promise<PublishResult> {
    const { siteUrl, username, password } = credentials;
    if (!siteUrl || !username || !password) {
      return { success: false, error: "WordPress 사이트 URL, 사용자명, 앱 비밀번호가 필요합니다." };
    }

    const apiUrl = `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: content.title,
          content: content.body,
          status: "publish",
          tags: content.tags,
          format: "standard",
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return { success: false, error: `WordPress API 오류: ${res.status} ${body.slice(0, 200)}` };
      }

      const data = await res.json();
      return {
        success: true,
        postId: String(data.id),
        postUrl: data.link,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return { success: false, error: `WordPress 연결 오류: ${message}` };
    }
  }

  async validateConnection(credentials: PlatformCredentials): Promise<boolean> {
    const { siteUrl, username, password } = credentials;
    if (!siteUrl || !username || !password) return false;

    try {
      const auth = Buffer.from(`${username}:${password}`).toString("base64");
      const res = await fetch(`${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/users/me`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
