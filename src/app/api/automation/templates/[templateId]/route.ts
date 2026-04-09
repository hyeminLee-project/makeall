import { NextResponse } from "next/server";
import { templateCreateRequestSchema } from "@/lib/types";
import { createRateLimit, getClientIp } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });

export async function GET(_req: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const auth = await getAuthUser();
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const { templateId } = await params;

    const { data, error } = await supabaseAdmin
      .from("automation_templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "템플릿을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Template GET Error:", message);
    return NextResponse.json({ error: "템플릿 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const ip = getClientIp(req);
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

    const { templateId } = await params;
    const parsed = templateCreateRequestSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const d = parsed.data;
    if (d.name !== undefined) updates.name = d.name;
    if (d.description !== undefined) updates.description = d.description;
    if (d.category !== undefined) updates.category = d.category;
    if (d.sections !== undefined) updates.sections = d.sections;
    if (d.variables !== undefined) updates.variables = d.variables;
    if (d.rules !== undefined) updates.rules = d.rules;
    if (d.styleProfileId !== undefined) updates.style_profile_id = d.styleProfileId;
    if (d.sampleOutput !== undefined) updates.sample_output = d.sampleOutput;

    const { data, error } = await supabaseAdmin
      .from("automation_templates")
      .update(updates)
      .eq("id", templateId)
      .eq("user_id", userId)
      .select("id, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "템플릿 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, updatedAt: data.updated_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Template PUT Error:", message);
    return NextResponse.json({ error: "템플릿 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const ip = getClientIp(req);
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

    const { templateId } = await params;

    const { error } = await supabaseAdmin
      .from("automation_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", userId);

    if (error) {
      console.error("Template delete error:", error.message);
      return NextResponse.json({ error: "템플릿 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Template DELETE Error:", message);
    return NextResponse.json({ error: "템플릿 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
