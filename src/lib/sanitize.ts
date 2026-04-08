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
];

export function sanitizeUserInput(input: string): string {
  let sanitized = input;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replaceAll(pattern, "[FILTERED]");
  }

  return sanitized;
}
