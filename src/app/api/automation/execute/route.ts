import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { buildTemplatePrompt, validateRules } from "@/lib/template-engine";
import { automationAiResponseSchema } from "@/lib/types";
import { z } from "zod/v4";

const TIMEOUT_MS = 30_000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 3 });

const executeRequestSchema = z.object({
  templateId: z.uuid(),
  variables: z.record(z.string(), z.string()),
});

export async function POST(req: Request) {
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

    const auth = await getAuthUser();
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const parsed = executeRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { templateId, variables } = parsed.data;

    const { data: template, error: templateError } = await supabaseAdmin
      .from("automation_templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", userId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "템플릿을 찾을 수 없습니다." }, { status: 404 });
    }

    const prompt = buildTemplatePrompt({
      sections: template.sections,
      variables,
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

    let parsed2: { content: string };
    try {
      parsed2 = JSON.parse(jsonString);
    } catch {
      return NextResponse.json({ error: "AI 응답 파싱에 실패했습니다." }, { status: 502 });
    }

    const aiParsed = automationAiResponseSchema.safeParse(parsed2);
    if (!aiParsed.success) {
      return NextResponse.json({ error: "AI 응답 형식이 올바르지 않습니다." }, { status: 502 });
    }

    const content = aiParsed.data.content;

    const ruleValidation = validateRules(content, template.rules);

    const publishedPlatforms: string[] = [];
    let published = false;

    if (
      ruleValidation.passed &&
      template.rules.autoPublish &&
      template.rules.platforms.length > 0
    ) {
      published = true;
      publishedPlatforms.push(...template.rules.platforms);
    }

    await supabaseAdmin.from("automation_executions").insert({
      user_id: userId,
      template_id: templateId,
      variables_used: variables,
      content,
      rule_passed: ruleValidation.passed,
      published,
      executed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      content,
      ruleValidation,
      published,
      publishedPlatforms,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Automation Execute Error:", message);
    return NextResponse.json({ error: "자동화 실행 중 오류가 발생했습니다." }, { status: 500 });
  }
}
