const ZERO_WIDTH_CHARS = /[\u200B\u200C\u200D\u2060\uFEFF]/g;

const FULLWIDTH_MAP: Record<string, string> = {};
for (let i = 0xff01; i <= 0xff5e; i++) {
  FULLWIDTH_MAP[String.fromCharCode(i)] = String.fromCharCode(i - 0xfee0);
}

function normalize(text: string): string {
  return text
    .replace(ZERO_WIDTH_CHARS, "")
    .replace(/[\uFF01-\uFF5E]/g, (ch) => FULLWIDTH_MAP[ch] ?? ch)
    .normalize("NFKC");
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)/gi,
  /forget\s+(all\s+)?(previous|above|prior|everything)/gi,
  /new\s+instructions?\s*:/gi,
  /you\s+are\s+now\s+/gi,
  /(act|behave|pretend|role.?play)\s+(as|like)\s+/gi,
  /system\s*:\s*/gi,
  /\[\s*INST\s*\]/gi,
  /<\|im_start\|>/gi,
  /```\s*(system|assistant|user)\s*/gi,
  /\[system\]/gi,
  /<\/(system|instruction|prompt)>/gi,
  /<\|?(system|user|assistant|endoftext)\|?>/gi,
  /###\s*(system|instruction|user)\s*/gi,
];

export function sanitizeUserInput(input: string): string {
  let sanitized = normalize(input);

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    sanitized = sanitized.replaceAll(pattern, "[FILTERED]");
  }

  return sanitized;
}
