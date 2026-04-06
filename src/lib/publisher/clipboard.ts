import type { ClipboardPublisher, PublishContent, ClipboardResult } from "./types";

export class NaverClipboardPublisher implements ClipboardPublisher {
  readonly platform = "naver_blog";

  formatForClipboard(content: PublishContent): ClipboardResult {
    const html =
      content.format === "html"
        ? content.body
        : `<h2>${content.title}</h2>\n${this.markdownToHtml(content.body)}`;

    const plainText = this.stripHtml(html);

    return {
      html,
      plainText,
      guide: [
        "1. 네이버 블로그 에디터를 엽니다 (blog.naver.com)",
        "2. 새 글쓰기를 클릭합니다",
        "3. 제목을 입력합니다: " + content.title,
        "4. 본문 영역에 복사한 내용을 붙여넣기 합니다 (Ctrl+V / Cmd+V)",
        "5. 태그를 추가합니다: " + content.tags.join(", "),
        "6. 발행 버튼을 클릭합니다",
      ],
    };
  }

  private markdownToHtml(md: string): string {
    return md
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");
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

export class PostypeClipboardPublisher implements ClipboardPublisher {
  readonly platform = "postype";

  formatForClipboard(content: PublishContent): ClipboardResult {
    const html =
      content.format === "html"
        ? content.body
        : `<h2>${content.title}</h2>\n${this.markdownToHtml(content.body)}`;

    const plainText = this.stripHtml(html);

    return {
      html,
      plainText,
      guide: [
        "1. 포스타입에 로그인합니다 (postype.com)",
        "2. 새 포스트 작성을 클릭합니다",
        "3. 제목을 입력합니다: " + content.title,
        "4. 본문 영역에 복사한 내용을 붙여넣기 합니다 (Ctrl+V / Cmd+V)",
        "5. 시리즈/태그를 설정합니다",
        "6. 발행합니다",
      ],
    };
  }

  private markdownToHtml(md: string): string {
    return md
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");
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
