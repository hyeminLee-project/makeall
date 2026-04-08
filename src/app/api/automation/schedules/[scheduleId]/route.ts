import { NextResponse } from "next/server";
import { scheduleCreateRequestSchema } from "@/lib/types";
import { createRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

const limiter = createRateLimit({ windowMs: 60_000, maxRequests: 20 });

function getIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

export async function PUT(req: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  try {
    const ip = getIp(req);
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

    const { scheduleId } = await params;
    const parsed = scheduleCreateRequestSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    const d = parsed.data;
    if (d.cron !== undefined) updates.cron = d.cron;
    if (d.timezone !== undefined) updates.timezone = d.timezone;
    if (d.variableData !== undefined) updates.variable_data = d.variableData;
    if (d.isActive !== undefined) updates.is_active = d.isActive;

    const { data, error } = await supabaseAdmin
      .from("automation_schedules")
      .update(updates)
      .eq("id", scheduleId)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "스케줄 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Schedule PUT Error:", message);
    return NextResponse.json({ error: "스케줄 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const ip = getIp(req);
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

    const { scheduleId } = await params;

    const { error } = await supabaseAdmin
      .from("automation_schedules")
      .delete()
      .eq("id", scheduleId)
      .eq("user_id", userId);

    if (error) {
      console.error("Schedule delete error:", error.message);
      return NextResponse.json({ error: "스케줄 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Schedule DELETE Error:", message);
    return NextResponse.json({ error: "스케줄 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
