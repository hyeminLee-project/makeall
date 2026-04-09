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
    - 자주 쓰는 표현: ${styleProfile.expressions.map((e) => sanitizeUserInput(e)).join(", ")}
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

const FOCUS_TO_CRITERIA: Record<string, string[]> = {
  all: ["maintainability", "understanding", "logic", "security", "comprehension"],
  security: ["security"],
  performance: ["logic"],
  readability: ["maintainability"],
  maintainability: ["maintainability"],
  logic: ["logic"],
  comprehension: ["comprehension", "understanding"],
};

function mapFocusToCriteria(focus: string[]): string[] {
  return [...new Set(focus.flatMap((f) => FOCUS_TO_CRITERIA[f] ?? [f]))];
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
  const criteria = mapFocusToCriteria(focus);
  const criteriaDesc = criteria
    .map((c) => {
      switch (c) {
        case "maintainability":
          return `1. 코드 유지보수성 (maintainability)
       - 변수/함수 네이밍이 의도를 명확히 전달하는가
       - 함수 분리, 단일 책임 원칙 준수
       - dead code, eslint-disable 남용, 불필요한 주석
       - 중복 코드, 과도한 중첩`;
        case "understanding":
          return `2. 코드 이해도 향상 (understanding)
       - 복잡한 로직에 "왜 이렇게 했는지" 설명이 필요한 부분
       - 비자명한 알고리즘이나 패턴에 대한 문서화 필요성
       - 코드를 처음 보는 개발자가 이해할 수 있는 수준인가`;
        case "logic":
          return `3. 로직 정확성 (logic)
       - 조건문 오류, off-by-one, 잘못된 흐름 제어
       - edge case 누락 (null, undefined, 빈 배열, 경계값)
       - 비동기 처리 오류, race condition, 에러 핸들링 누락`;
        case "security":
          return `4. 보안 취약점 (security)
       - 인증/인가 누락, API 키 하드코딩
       - 입력 검증 미비, injection 가능성 (SQL, XSS, command)
       - 민감 데이터 로깅, 불안전한 의존성 사용`;
        case "comprehension":
          return `5. 코드 이해도 검증 (comprehension) — 핵심 기준
       - 작성자가 이 코드를 직접 설명할 수 있는가?
       - "블랙박스" 패턴 탐지: eslint-disable, magic numbers, 설명 없는 정규식, 복잡한 체이닝
       - 복사-붙여넣기로 추정되는 코드 (이해 없이 사용한 패턴)
       - 요구사항 변경 시 어디를 수정해야 하는지 작성자가 파악 가능한가
       - 작성자에게 물어볼 comprehension questions를 생성하세요`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n    ");

  return `
    당신은 시니어 소프트웨어 엔지니어이자 코드 교육자입니다.
    다음 ${language} 코드를 아래 평가 기준에 따라 리뷰해주세요.
    특히 바이브 코딩(AI 생성 코드)의 "이해 부채(Comprehension Debt)"를 방지하는 관점에서,
    작성자가 자신의 코드를 설명·분석·수정할 수 있는지 검증하는 것이 중요합니다.

    [평가 기준]
    ${criteriaDesc}

    [코드]
    \`\`\`${language}
    ${sanitizeUserInput(code)}
    \`\`\`

    [출력 형식] (반드시 JSON으로 응답, 모든 텍스트는 한국어로)
    {
      "summary": "전체 요약 (2~3문장)",
      "score": 0~100,
      "issues": [
        {
          "line": 줄번호 또는 null,
          "severity": "critical" | "warning" | "info",
          "category": "maintainability" | "understanding" | "logic" | "security" | "comprehension",
          "message": "문제 설명 (한 줄)",
          "explanation": "왜 문제인지 상세 설명 (2~3문장, 개발자 학습에 도움이 되도록)",
          "suggestion": "수정 제안",
          "fixPrompt": "AI 코딩 도구에 넘길 수 있는 구체적 수정 지시문 (파일명, 라인, 변경 내용 포함)"
        }
      ],
      "categoryScores": [
        { "category": "카테고리명", "score": 0~100, "summary": "해당 기준 한줄 평가" }
      ],
      "comprehensionQuestions": [
        {
          "question": "작성자가 답해야 할 질문 (예: '이 함수에서 timeout을 30초로 설정한 이유는?')",
          "targetLines": [12, 15],
          "difficulty": "basic" | "intermediate" | "advanced"
        }
      ],
      "comprehensionRisks": [
        {
          "section": "lines 12-25 또는 함수명",
          "riskLevel": "low" | "medium" | "high",
          "reason": "이해도 위험이 있는 이유",
          "blackBoxPatterns": ["eslint-disable", "magic number 30000"]
        }
      ],
      "overallComprehensionLevel": "A1~C2 (A1=기초 구문만, B1=중급 패턴, C1=고급 패턴, C2=전문가 수준)"
    }

    [이해도 레벨 기준]
    A1: 변수 선언, if/else, 함수 호출 수준
    A2: 배열 메서드, 객체 구조분해, 기본 비동기
    B1: Promise 체이닝, 에러 핸들링, 모듈 패턴
    B2: 제네릭, 고차 함수, 스트림/이터레이터
    C1: 메타프로그래밍, 데코레이터, 복잡한 타입 시스템
    C2: 컴파일러 패턴, AST 조작, 저수준 최적화

    주의사항:
    - issues 배열에서 각 이슈는 반드시 category를 포함하세요
    - comprehensionQuestions는 최소 2개, 최대 5개 생성하세요
    - fixPrompt는 Claude Code나 Cursor 같은 AI 도구에 바로 붙여넣을 수 있을 만큼 구체적으로 작성하세요
    - 이슈가 없는 카테고리도 categoryScores에 포함하세요 (점수만 높게)
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
  referenceStyle,
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
  referenceStyle?: string | null;
}) {
  const characterDesc = characters
    .map((c) => {
      const state = continuity?.characterStates[c.name];
      const rels = c.relationships
        .map((r) => `${sanitizeUserInput(r.characterName)}: ${sanitizeUserInput(r.relationship)}`)
        .join(", ");
      return `- ${sanitizeUserInput(c.name)} (${sanitizeUserInput(c.role)}): ${sanitizeUserInput(c.description)}
      성격: ${sanitizeUserInput(c.personality)}${rels ? `\n      관계: ${rels}` : ""}${state ? `\n      현재 상태: ${sanitizeUserInput(state)}` : ""}`;
    })
    .join("\n    ");

  const continuityBlock = continuity
    ? `
    [이전 이야기 요약]
    ${sanitizeUserInput(continuity.previousEpisodesSummary)}

    [미해결 복선]
    ${continuity.unresolvedPlotThreads.map((t) => `- ${sanitizeUserInput(t)}`).join("\n    ")}

    [타임라인 위치]
    ${sanitizeUserInput(continuity.timelinePosition)}`
    : "[첫 번째 에피소드입니다]";

  const styleGuide = styleProfile
    ? `
    [작성자 문체 가이드]
    - 문장 길이: ${styleProfile.sentenceLength}
    - 톤: ${styleProfile.tone}
    - 문장 종결: ${styleProfile.ending}
    - 유머: ${styleProfile.humor}
    - 글 구조: ${styleProfile.structure}
    - 자주 쓰는 표현: ${styleProfile.expressions.map((e) => sanitizeUserInput(e)).join(", ")}
    이 문체를 최대한 반영하여 작성해주세요.`
    : "";

  const referenceBlock = referenceStyle
    ? `
    [레퍼런스 문체 — 반드시 이 문체를 유지하세요]
    아래는 이 시리즈의 기준이 되는 문체 샘플입니다. 문장 길이, 종결어미, 묘사 방식, 리듬감을 최대한 일치시켜 주세요.
    ---
    ${sanitizeUserInput(referenceStyle)}
    ---`
    : "";

  return `
    당신은 연재 소설 작가의 조수입니다.
    사용자의 플롯 아웃라인을 기반으로 에피소드 초안을 작성합니다.
    사용자가 직접 수정할 것이므로, 완벽한 완성본이 아닌 좋은 초안을 목표로 합니다.

    [작품 정보]
    제목: ${sanitizeUserInput(title)}
    장르: ${genre}
    ${tone ? `톤: ${sanitizeUserInput(tone)}` : ""}

    [세계관]
    ${sanitizeUserInput(setting)}

    [전체 줄거리]
    ${sanitizeUserInput(plotOutline)}

    [등장인물]
    ${characterDesc}

    ${continuityBlock}
    ${styleGuide}
    ${referenceBlock}

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
  const currentSummary = currentContinuity
    ? sanitizeUserInput(currentContinuity.previousEpisodesSummary)
    : "없음 (첫 에피소드)";
  const currentThreads = currentContinuity?.unresolvedPlotThreads ?? [];
  const characterNames = characters.map((c) => sanitizeUserInput(c.name)).join(", ");

  return `
    다음은 연재 소설의 에피소드 ${episodeNumber}의 완성된 내용입니다.
    이 에피소드를 반영하여 연속성 상태를 업데이트해주세요.

    [기존 요약]
    ${currentSummary}

    [기존 미해결 복선]
    ${currentThreads.map((t) => `- ${sanitizeUserInput(t)}`).join("\n    ") || "없음"}

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

export function buildAffiliateAnalysisPrompt({
  draftContent,
  maxSuggestions,
}: {
  draftContent: string;
  maxSuggestions: number;
}) {
  return `
    당신은 콘텐츠 수익화 전문가입니다.
    아래 글을 읽고, 어필리에이트(제휴) 링크를 자연스럽게 삽입할 수 있는 위치를 제안해주세요.

    [규칙]
    - 제품 언급이 자연스럽게 어울리는 위치만 제안하세요. 강제 삽입은 피하세요.
    - 글의 맥락과 관련 없는 제품은 제안하지 마세요.
    - 최대 ${maxSuggestions}개까지만 제안하세요.
    - 각 제안에 대해 왜 이 위치가 적절한지 이유를 설명하세요.

    [글 내용]
    ${sanitizeUserInput(draftContent)}

    [출력 형식] (반드시 JSON으로 응답)
    {
      "suggestions": [
        {
          "anchorText": "링크를 걸 텍스트 (글에서 그대로 발췌)",
          "surroundingContext": "해당 문장 전체",
          "position": {
            "paragraphIndex": 문단 번호 (0부터),
            "startOffset": 문단 내 시작 위치,
            "endOffset": 문단 내 끝 위치
          },
          "productCategory": "제품 카테고리 (예: electronics/earphones)",
          "reasoning": "이 위치가 적절한 이유",
          "confidence": 0~100
        }
      ],
      "overallFit": 0~100 (이 글의 수익화 적합도),
      "tips": ["수익화 개선 팁 1", "팁 2"]
    }
  `;
}
