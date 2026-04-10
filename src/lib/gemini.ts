import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2_000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

async function callGeminiInternal(prompt: string): Promise<string> {
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
      const isQuotaExhausted = message.includes("429") || message.includes("RESOURCE_EXHAUSTED");
      if (isQuotaExhausted) {
        throw new Error("QUOTA_EXHAUSTED");
      }
      const isRetryable =
        message.includes("503") || message.includes("UNAVAILABLE") || message === "TIMEOUT";
      if (!isRetryable || attempt === MAX_RETRIES) {
        throw error;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw new Error("GEMINI_FAILED");
}

async function callOpenAIFallback(prompt: string): Promise<string> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS)
  );
  const result = await Promise.race([
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    }),
    timeoutPromise,
  ]);
  return result.choices[0]?.message?.content ?? "";
}

export async function callGemini(prompt: string): Promise<string> {
  try {
    return await callGeminiInternal(prompt);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isGeminiFail =
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message === "TIMEOUT" ||
      message === "GEMINI_FAILED" ||
      message === "QUOTA_EXHAUSTED";

    if (isGeminiFail && process.env.OPENAI_API_KEY) {
      console.warn("Gemini failed, falling back to GPT-4o-mini");
      try {
        return await callOpenAIFallback(prompt);
      } catch (fallbackError) {
        const fbMsg = fallbackError instanceof Error ? fallbackError.message : "";
        if (fbMsg === "TIMEOUT")
          throw new Error("AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
        throw new Error("AI 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    }

    if (message === "QUOTA_EXHAUSTED")
      throw new Error("AI API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.");
    if (message === "TIMEOUT")
      throw new Error("AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
    if (message.includes("503") || message.includes("UNAVAILABLE"))
      throw new Error("AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.");
    throw error;
  }
}
