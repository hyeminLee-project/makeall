export interface PublishContent {
  title: string;
  body: string;
  format: "html" | "markdown";
  tags: string[];
  category?: string;
  images?: string[];
}

export interface PublishResult {
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
}

export interface Publisher {
  readonly platform: string;
  publish(content: PublishContent, credentials: PlatformCredentials): Promise<PublishResult>;
  validateConnection(credentials: PlatformCredentials): Promise<boolean>;
}

export interface ClipboardResult {
  html: string;
  plainText: string;
  guide: string[];
}

export interface ClipboardPublisher {
  readonly platform: string;
  formatForClipboard(content: PublishContent): ClipboardResult;
}

export interface PlatformCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  siteUrl?: string;
  username?: string;
  password?: string;
  [key: string]: string | undefined;
}
