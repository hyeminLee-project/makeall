import type { Platform, ClipboardPlatform } from "@/lib/types";
import type {
  Publisher,
  ClipboardPublisher,
  PlatformCredentials,
  PublishContent,
  PublishResult,
} from "./types";
import { XPublisher } from "./x";
import { ThreadsPublisher } from "./threads";
import { TistoryPublisher } from "./tistory";
import { WordPressPublisher } from "./wordpress";
import { MediumPublisher } from "./medium";
import { NaverClipboardPublisher, PostypeClipboardPublisher } from "./clipboard";

const publishers: Record<Platform, Publisher> = {
  x: new XPublisher(),
  threads: new ThreadsPublisher(),
  tistory: new TistoryPublisher(),
  wordpress: new WordPressPublisher(),
  medium: new MediumPublisher(),
};

const clipboardPublishers: Record<ClipboardPlatform, ClipboardPublisher> = {
  naver_blog: new NaverClipboardPublisher(),
  postype: new PostypeClipboardPublisher(),
};

export function getPublisher(platform: Platform): Publisher {
  return publishers[platform];
}

export function getClipboardPublisher(platform: ClipboardPlatform): ClipboardPublisher {
  return clipboardPublishers[platform];
}

export async function publishToMultiple(
  platforms: Platform[],
  content: PublishContent,
  getCredentials: (platform: Platform) => Promise<PlatformCredentials | null>
): Promise<{ platform: string; success: boolean; postUrl?: string; error?: string }[]> {
  const tasks = platforms.map(async (platform): Promise<PublishResult & { platform: string }> => {
    const credentials = await getCredentials(platform);
    if (!credentials) {
      return { platform, success: false, error: `${platform} 연결 정보가 없습니다.` };
    }

    try {
      const publisher = getPublisher(platform);
      const result = await publisher.publish(content, credentials);
      return { platform, ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return { platform, success: false, error: message };
    }
  });

  return Promise.allSettled(tasks).then((results) =>
    results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { platform: "unknown", success: false, error: "발행 중 오류가 발생했습니다." }
    )
  );
}
