import { NextResponse } from "next/server";
import { scheduleCreateRequestSchema } from "@/lib/types";
import { createRateLimit, getClientIp } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });

export async function GET(req: Request) {
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

    const { data, error, count } = await supabaseAdmin
      .from("automation_schedules")
      .select("*, automation_templates(name, category)", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(0, 49);

    if (error) {
      console.error("Schedule list error:", error.message);
      return NextResponse.json({ error: "스케줄 목록 조회에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ schedules: data ?? [], total: count ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Schedules GET Error:", message);
    return NextResponse.json({ error: "스케줄 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const parsed = scheduleCreateRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { templateId, cron, timezone, variableData, isActive } = parsed.data;

    const { data: template } = await supabaseAdmin
      .from("automation_templates")
      .select("id")
      .eq("id", templateId)
      .single();

    if (!template) {
      return NextResponse.json({ error: "템플릿을 찾을 수 없습니다." }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("automation_schedules")
      .insert({
        user_id: userId,
        template_id: templateId,
        cron,
        timezone,
        variable_data: variableData,
        is_active: isActive,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Schedule insert error:", error.message);
      return NextResponse.json({ error: "스케줄 등록에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, createdAt: data.created_at }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Schedule POST Error:", message);
    return NextResponse.json({ error: "스케줄 등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}
