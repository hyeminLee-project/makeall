import type { Publisher, PublishContent, PublishResult, PlatformCredentials } from "./types";

const X_API_BASE = "https://api.x.com/2";
const MAX_TWEET_LENGTH = 280;

export class XPublisher implements Publisher {
  readonly platform = "x";

  async publish(content: PublishContent, credentials: PlatformCredentials): Promise<PublishResult> {
    const { accessToken } = credentials;
    if (!accessToken) {
      return { success: false, error: "X 액세스 토큰이 없습니다." };
    }

    const text = content.format === "html" ? this.stripHtml(content.body) : content.body;

    if (text.length <= MAX_TWEET_LENGTH) {
      return this.postTweet(text, accessToken);
    }

    return this.postThread(text, accessToken);
  }

  async validateConnection(credentials: PlatformCredentials): Promise<boolean> {
    const { accessToken } = credentials;
    if (!accessToken) return false;

    try {
      const res = await fetch(`${X_API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async postTweet(text: string, accessToken: string): Promise<PublishResult> {
    const res = await fetch(`${X_API_BASE}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `X API 오류: ${res.status} ${body.slice(0, 200)}` };
    }

    const data = await res.json();
    return {
      success: true,
      postId: data.data?.id,
      postUrl: data.data?.id ? `https://x.com/i/status/${data.data.id}` : undefined,
    };
  }

  private async postThread(text: string, accessToken: string): Promise<PublishResult> {
    const chunks = this.splitIntoChunks(text, MAX_TWEET_LENGTH);
    let replyToId: string | undefined;
    let firstPostUrl: string | undefined;

    for (const chunk of chunks) {
      const body: Record<string, unknown> = { text: chunk };
      if (replyToId) {
        body.reply = { in_reply_to_tweet_id: replyToId };
      }

      const res = await fetch(`${X_API_BASE}/tweets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return {
          success: false,
          error: `X 스레드 발행 실패: ${res.status} ${errorBody.slice(0, 200)}`,
          postUrl: firstPostUrl,
        };
      }

      const data = await res.json();
      const tweetId = data.data?.id;
      if (!replyToId && tweetId) {
        firstPostUrl = `https://x.com/i/status/${tweetId}`;
      }
      replyToId = tweetId;
    }

    return { success: true, postUrl: firstPostUrl, postId: replyToId };
  }

  private splitIntoChunks(text: string, maxLen: number): string[] {
    const sentences = text.split(/(?<=[.!?。])\s+/);
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
      if ((current + " " + sentence).trim().length > maxLen) {
        if (current) chunks.push(current.trim());
        current = sentence;
      } else {
        current = current ? current + " " + sentence : sentence;
      }
    }
    if (current) chunks.push(current.trim());

    return chunks;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}
