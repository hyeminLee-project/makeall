import type { Publisher, PublishContent, PublishResult, PlatformCredentials } from "./types";

const TISTORY_API_BASE = "https://www.tistory.com/apis";

export class TistoryPublisher implements Publisher {
  readonly platform = "tistory";

  async publish(content: PublishContent, credentials: PlatformCredentials): Promise<PublishResult> {
    const { accessToken, siteUrl } = credentials;
    if (!accessToken || !siteUrl) {
      return { success: false, error: "Tistory 액세스 토큰 또는 블로그 주소가 없습니다." };
    }

    const blogName = this.extractBlogName(siteUrl);

    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        output: "json",
        blogName,
        title: content.title,
        content: content.format === "markdown" ? content.body : content.body,
        visibility: "3",
        category: content.category ?? "0",
        tag: content.tags.join(","),
      });

      const res = await fetch(`${TISTORY_API_BASE}/post/write?${params.toString()}`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.text();
        return { success: false, error: `Tistory API 오류: ${res.status} ${body.slice(0, 200)}` };
      }

      const data = await res.json();
      const postId = data.tistory?.postId;
      const postUrl = postId ? `${siteUrl}/${postId}` : undefined;

      return { success: true, postId, postUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return { success: false, error: `Tistory 연결 오류: ${message}` };
    }
  }

  async validateConnection(credentials: PlatformCredentials): Promise<boolean> {
    const { accessToken } = credentials;
    if (!accessToken) return false;

    try {
      const res = await fetch(
        `${TISTORY_API_BASE}/blog/info?access_token=${accessToken}&output=json`
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  private extractBlogName(siteUrl: string): string {
    try {
      const url = new URL(siteUrl);
      return url.hostname.replace(".tistory.com", "");
    } catch {
      return siteUrl;
    }
  }
}
