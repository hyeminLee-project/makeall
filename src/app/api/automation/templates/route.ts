import { NextResponse } from "next/server";
import { templateCreateRequestSchema } from "@/lib/types";
import { createRateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });

function getIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

export async function GET(req: Request) {
  try {
    const ip = getIp(req);
    const { success, retryAfter } = limiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
      );
    }

    const { data, error } = await supabase
      .from("automation_templates")
      .select("id, name, description, category, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Template list error:", error.message);
      return NextResponse.json({ error: "템플릿 목록 조회에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ templates: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Templates GET Error:", message);
    return NextResponse.json({ error: "템플릿 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    const { success, retryAfter } = limiter.check(ip);
    if (!success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfter / 1000)) } }
      );
    }

    const parsed = templateCreateRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const {
      name,
      description,
      category,
      sections,
      variables,
      rules,
      styleProfileId,
      sampleOutput,
    } = parsed.data;

    const { data, error } = await supabase
      .from("automation_templates")
      .insert({
        name,
        description,
        category,
        sections,
        variables,
        rules,
        style_profile_id: styleProfileId ?? null,
        sample_output: sampleOutput ?? null,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Template insert error:", error.message);
      return NextResponse.json({ error: "템플릿 생성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, createdAt: data.created_at }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Template POST Error:", message);
    return NextResponse.json({ error: "템플릿 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
