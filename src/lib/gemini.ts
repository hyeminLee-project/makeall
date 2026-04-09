import { GoogleGenAI } from "@google/genai";

const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3_000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

export async function callGemini(prompt: string): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS)
      );
      const result = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        }),
        timeoutPromise,
      ]);
      return result.text ?? "";
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isRetryable =
        message.includes("503") || message.includes("UNAVAILABLE") || message === "TIMEOUT";
      if (!isRetryable || attempt === MAX_RETRIES) {
        if (message === "TIMEOUT")
          throw new Error("AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
        if (message.includes("503") || message.includes("UNAVAILABLE"))
          throw new Error("AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.");
        throw error;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw new Error("AI 요청에 실패했습니다.");
}
