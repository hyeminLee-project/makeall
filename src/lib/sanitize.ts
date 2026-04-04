const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts)/i,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
  /\[\s*INST\s*\]/i,
  /<\|im_start\|>/i,
];

export function sanitizeUserInput(input: string): string {
  let sanitized = input;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[FILTERED]");
  }

  return sanitized;
}
