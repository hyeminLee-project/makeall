import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const { data, error, count } = await supabaseAdmin
      .from("series")
      .select("id, title, genre, status, tone, created_at, updated_at", { count: "exact" })
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .range(0, 49);

    if (error) {
      console.error("Series list error:", error.message);
      return NextResponse.json({ error: "시리즈 목록을 가져올 수 없습니다." }, { status: 500 });
    }

    return NextResponse.json({ series: data ?? [], total: count ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Series List API Error:", message);
    return NextResponse.json(
      { error: "시리즈 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
