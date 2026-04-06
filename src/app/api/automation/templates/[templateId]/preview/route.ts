import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createRateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";
import { buildTemplatePrompt } from "@/lib/template-engine";
import { z } from "zod/v4";

const TIMEOUT_MS = 30_000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 5 });

const previewRequestSchema = z.object({
  variables: z.record(z.string(), z.string()),
});

export async function POST(req: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
    const { success, retryAfter } = limiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const { templateId } = await params;
    const parsed = previewRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data: template, error: templateError } = await supabase
      .from("automation_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "템플릿을 찾을 수 없습니다." }, { status: 404 });
    }

    const prompt = buildTemplatePrompt({
      sections: template.sections,
      variables: parsed.data.variables,
      rules: template.rules,
      sampleOutput: template.sample_output,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API request timed out")), TIMEOUT_MS)
    );

    const result = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      }),
      timeoutPromise,
    ]);

    const text = result.text ?? "";
    const jsonString = text.replace(/```json\n?|```/g, "").trim();

    let content: string;
    try {
      const parsed = JSON.parse(jsonString);
      content = parsed.content ?? jsonString;
    } catch {
      content = jsonString;
    }

    return NextResponse.json({ content, preview: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Template Preview Error:", message);
    return NextResponse.json({ error: "미리보기 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
