import { StyleProfile } from "./types";

export function buildWritingPrompt({
  input,
  inputType,
  platforms,
  styleProfile,
}: {
  input: string;
  inputType: "idea" | "url";
  platforms: string[];
  styleProfile?: StyleProfile | null;
}) {
  const inputDesc =
    inputType === "url"
      ? `다음 URL의 내용을 참고하여 콘텐츠를 작성해주세요: ${input}`
      : `다음 아이디어를 기반으로 콘텐츠를 작성해주세요: ${input}`;

  const styleGuide = styleProfile
    ? `
    [작성자 문체 가이드]
    - 문장 길이: ${styleProfile.sentenceLength}
    - 톤: ${styleProfile.tone}
    - 문장 종결: ${styleProfile.ending}
    - 유머: ${styleProfile.humor}
    - 글 구조: ${styleProfile.structure}
    - 자주 쓰는 표현: ${styleProfile.expressions.join(", ")}
    이 문체를 최대한 반영하여 작성해주세요.`
    : "";

  const platformInstructions = platforms
    .map((p) => {
      switch (p) {
        case "blog":
          return "blog: 1500~2000자 블로그 글 (H2 태그 포함, SEO 최적화)";
        case "instagram":
          return "instagram: 3줄 이내 카피 + 해시태그 10개";
        case "x_thread":
          return "x_thread: 5개 트윗 스레드 (각 280자 이내, 첫 트윗은 훅)";
        case "newsletter":
          return "newsletter: 개인적 톤의 뉴스레터 도입부 (300자) + 본문 링크 유도";
        case "shorts_script":
          return "shorts_script: 30초 숏폼 대본 (hook/body/closer 구조)";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n    ");

  return `
    당신은 MakeAll의 AI 콘텐츠 어시스턴트입니다.
    사용자의 아이디어를 기반으로 여러 플랫폼에 맞는 콘텐츠 초안을 생성합니다.

    ${inputDesc}
    ${styleGuide}

    [생성할 플랫폼별 콘텐츠]
    ${platformInstructions}

    [출력 형식] (반드시 JSON으로 응답)
    {
      "draft": "메인 블로그 초안 (가장 긴 버전)",
      "platforms": {
        "blog": "블로그 버전",
        "instagram": "인스타 버전",
        ...요청된 플랫폼만 포함
      },
      "seoScore": 0~100,
      "suggestions": ["개선 제안 1", "개선 제안 2"]
    }
  `;
}

export function buildCodeReviewPrompt({
  code,
  language,
  focus,
}: {
  code: string;
  language: string;
  focus: string[];
}) {
  const focusDesc = focus.includes("all")
    ? "보안, 성능, 가독성 전체"
    : focus.join(", ");

  return `
    당신은 시니어 소프트웨어 엔지니어입니다.
    다음 ${language} 코드를 리뷰해주세요.

    [리뷰 관점] ${focusDesc}

    [코드]
    \`\`\`${language}
    ${code}
    \`\`\`

    [출력 형식] (반드시 JSON으로 응답)
    {
      "summary": "전체 요약 (2~3문장)",
      "issues": [
        {
          "line": 줄번호 또는 null,
          "severity": "critical" | "warning" | "info",
          "message": "문제 설명",
          "suggestion": "수정 제안"
        }
      ],
      "score": 0~100 (코드 품질 점수)
    }
  `;
}

export function buildStyleAnalysisPrompt(samples: string[]) {
  const sampleText = samples.map((s, i) => `[샘플 ${i + 1}]\n${s}`).join("\n\n");

  return `
    다음은 한 사람이 작성한 글 샘플들입니다. 이 사람의 글쓰기 스타일을 분석해주세요.

    ${sampleText}

    [출력 형식] (반드시 JSON으로 응답)
    {
      "sentenceLength": "short" | "medium" | "long",
      "tone": "formal" | "casual" | "conversational",
      "ending": "da" | "yo" | "seumnida" | "mixed",
      "humor": "none" | "occasional" | "frequent",
      "structure": "conclusion_first" | "introduction_first" | "mixed",
      "vocabulary": ["자주 사용하는 단어 5~10개"],
      "expressions": ["특징적인 표현 패턴 3~5개"]
    }
  `;
}
