import { sanitizeUserInput } from "./sanitize";
import type { TemplateSection, TemplateRules } from "./types";

export function substituteVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key];
    return value !== undefined ? sanitizeUserInput(value) : match;
  });
}

export function buildTemplatePrompt({
  sections,
  variables,
  rules,
  sampleOutput,
}: {
  sections: TemplateSection[];
  variables: Record<string, string>;
  rules: TemplateRules;
  sampleOutput?: string | null;
}) {
  const sectionInstructions = sections
    .map((s, i) => {
      const prompt = substituteVariables(s.prompt, variables);
      const constraints = [];
      if (s.minLength) constraints.push(`최소 ${s.minLength}자`);
      if (s.maxLength) constraints.push(`최대 ${s.maxLength}자`);
      const constraintStr = constraints.length > 0 ? ` (${constraints.join(", ")})` : "";
      return `${i + 1}. [${sanitizeUserInput(s.name)}]${s.required ? " (필수)" : " (선택)"}${constraintStr}\n       ${prompt}`;
    })
    .join("\n    ");

  const ruleInstructions = [];
  if (rules.minTotalLength) ruleInstructions.push(`전체 최소 ${rules.minTotalLength}자`);
  if (rules.maxTotalLength) ruleInstructions.push(`전체 최대 ${rules.maxTotalLength}자`);
  if (rules.requiredKeywords.length > 0)
    ruleInstructions.push(
      `반드시 포함할 키워드: ${rules.requiredKeywords.map((k) => sanitizeUserInput(k)).join(", ")}`
    );
  if (rules.forbiddenWords.length > 0)
    ruleInstructions.push(
      `사용 금지 단어: ${rules.forbiddenWords.map((w) => sanitizeUserInput(w)).join(", ")}`
    );

  const sampleBlock = sampleOutput
    ? `\n    [참고 예시]\n    ${sanitizeUserInput(sampleOutput.slice(0, 3000))}`
    : "";

  return `
    당신은 MakeAll 템플릿 자동화 시스템의 AI 작성자입니다.
    주어진 섹션 구조와 규칙에 맞게 콘텐츠를 생성합니다.

    [섹션별 작성 지시]
    ${sectionInstructions}

    [규칙]
    ${ruleInstructions.join("\n    ") || "없음"}
    ${sampleBlock}

    [출력 형식] (반드시 JSON으로 응답)
    {
      "content": "전체 생성된 글 (섹션 구분 포함)",
      "sections": {
        "섹션이름": "해당 섹션 내용"
      }
    }
  `;
}

export interface RuleValidationResult {
  passed: boolean;
  failures: string[];
}

export function validateRules(content: string, rules: TemplateRules): RuleValidationResult {
  const failures: string[] = [];

  if (rules.minTotalLength && content.length < rules.minTotalLength) {
    failures.push(`최소 길이 미달: ${content.length}자 (최소 ${rules.minTotalLength}자)`);
  }

  if (rules.maxTotalLength && content.length > rules.maxTotalLength) {
    failures.push(`최대 길이 초과: ${content.length}자 (최대 ${rules.maxTotalLength}자)`);
  }

  for (const keyword of rules.requiredKeywords) {
    if (!content.includes(keyword)) {
      failures.push(`필수 키워드 누락: "${keyword}"`);
    }
  }

  for (const word of rules.forbiddenWords) {
    if (content.includes(word)) {
      failures.push(`금지어 포함: "${word}"`);
    }
  }

  return { passed: failures.length === 0, failures };
}
