import { sanitizeUserInput } from "./sanitize";
import { Character, SeriesContinuity, StyleProfile } from "./types";

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
  const sanitized = sanitizeUserInput(input);
  const inputDesc =
    inputType === "url"
      ? `다음 URL의 내용을 참고하여 콘텐츠를 작성해주세요: ${sanitized}`
      : `다음 아이디어를 기반으로 콘텐츠를 작성해주세요: ${sanitized}`;

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
  const focusDesc = focus.includes("all") ? "보안, 성능, 가독성 전체" : focus.join(", ");

  return `
    당신은 시니어 소프트웨어 엔지니어입니다.
    다음 ${language} 코드를 리뷰해주세요.

    [리뷰 관점] ${focusDesc}

    [코드]
    \`\`\`${language}
    ${sanitizeUserInput(code)}
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
  const sampleText = samples.map((s, i) => `[샘플 ${i + 1}]\n${sanitizeUserInput(s)}`).join("\n\n");

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

export function buildEpisodeGenerationPrompt({
  title,
  genre,
  setting,
  characters,
  plotOutline,
  targetEpisodeLength,
  tone,
  continuity,
  episodeOutline,
  episodeNumber,
  focusCharacters,
  plotPoints,
  specialInstructions,
  styleProfile,
}: {
  title: string;
  genre: string;
  setting: string;
  characters: Character[];
  plotOutline: string;
  targetEpisodeLength: number;
  tone?: string | null;
  continuity?: SeriesContinuity | null;
  episodeOutline: string;
  episodeNumber: number;
  focusCharacters: string[];
  plotPoints: string[];
  specialInstructions?: string | null;
  styleProfile?: StyleProfile | null;
}) {
  const characterDesc = characters
    .map((c) => {
      const state = continuity?.characterStates[c.name];
      const rels = c.relationships.map((r) => `${r.characterName}: ${r.relationship}`).join(", ");
      return `- ${c.name} (${c.role}): ${c.description}
      성격: ${c.personality}${rels ? `\n      관계: ${rels}` : ""}${state ? `\n      현재 상태: ${state}` : ""}`;
    })
    .join("\n    ");

  const continuityBlock = continuity
    ? `
    [이전 이야기 요약]
    ${continuity.previousEpisodesSummary}

    [미해결 복선]
    ${continuity.unresolvedPlotThreads.map((t) => `- ${t}`).join("\n    ")}

    [타임라인 위치]
    ${continuity.timelinePosition}`
    : "[첫 번째 에피소드입니다]";

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

  return `
    당신은 연재 소설 작가의 조수입니다.
    사용자의 플롯 아웃라인을 기반으로 에피소드 초안을 작성합니다.
    사용자가 직접 수정할 것이므로, 완벽한 완성본이 아닌 좋은 초안을 목표로 합니다.

    [작품 정보]
    제목: ${sanitizeUserInput(title)}
    장르: ${genre}
    ${tone ? `톤: ${tone}` : ""}

    [세계관]
    ${sanitizeUserInput(setting)}

    [전체 줄거리]
    ${sanitizeUserInput(plotOutline)}

    [등장인물]
    ${characterDesc}

    ${continuityBlock}
    ${styleGuide}

    [에피소드 ${episodeNumber} 작성 요청]
    아웃라인: ${sanitizeUserInput(episodeOutline)}
    ${focusCharacters.length > 0 ? `중심 인물: ${focusCharacters.join(", ")}` : ""}
    포함할 사건:
    ${plotPoints.map((p) => `- ${sanitizeUserInput(p)}`).join("\n    ")}
    ${specialInstructions ? `특별 지시: ${sanitizeUserInput(specialInstructions)}` : ""}

    목표 분량: 약 ${targetEpisodeLength}자

    [출력 형식] (반드시 JSON으로 응답)
    {
      "draft": "에피소드 본문",
      "episodeNumber": ${episodeNumber},
      "wordCount": 글자수,
      "continuityNotes": ["이번 에피소드에서 바뀐 점 1", "바뀐 점 2"],
      "suggestedNextPlotPoints": ["다음 에피소드 제안 1", "제안 2"]
    }
  `;
}

export function buildContinuityUpdatePrompt({
  episodeContent,
  currentContinuity,
  characters,
  episodeNumber,
}: {
  episodeContent: string;
  currentContinuity: SeriesContinuity | null;
  characters: Character[];
  episodeNumber: number;
}) {
  const currentSummary = currentContinuity?.previousEpisodesSummary ?? "없음 (첫 에피소드)";
  const currentThreads = currentContinuity?.unresolvedPlotThreads ?? [];
  const characterNames = characters.map((c) => c.name).join(", ");

  return `
    다음은 연재 소설의 에피소드 ${episodeNumber}의 완성된 내용입니다.
    이 에피소드를 반영하여 연속성 상태를 업데이트해주세요.

    [기존 요약]
    ${currentSummary}

    [기존 미해결 복선]
    ${currentThreads.map((t) => `- ${t}`).join("\n    ") || "없음"}

    [에피소드 ${episodeNumber} 내용]
    ${sanitizeUserInput(episodeContent)}

    [등장인물 목록]
    ${characterNames}

    [출력 형식] (반드시 JSON으로 응답)
    {
      "previousEpisodesSummary": "에피소드 ${episodeNumber}까지의 통합 요약 (3000자 이내)",
      "characterStates": {
        "캐릭터이름": "현재 상태/상황 요약"
      },
      "unresolvedPlotThreads": ["미해결 복선 1", "복선 2"],
      "timelinePosition": "현재 시점 설명"
    }

    주의: 요약은 3000자를 넘지 않도록 이전 요약과 새 에피소드를 압축하세요.
    등장인물 중 이번 에피소드에 등장한 인물만 characterStates에 포함하세요.
  `;
}
