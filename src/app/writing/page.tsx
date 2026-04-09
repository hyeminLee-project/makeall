import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeriesCard } from "@/components/writing/series-card";
import { apiClient } from "@/lib/api-client";

interface Series {
  id: string;
  title: string;
  genre: string;
  writing_type: string;
  status: string;
  updated_at: string;
}

async function getSeriesList(): Promise<{ series: Series[]; total: number }> {
  try {
    // Server Component에서 내부 API 직접 호출 대신 Supabase 직접 사용
    // 하지만 auth가 필요하므로 API route를 통해 호출
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return await apiClient<{ series: Series[]; total: number }>(`${baseUrl}/api/writing/series`);
  } catch {
    return { series: [], total: 0 };
  }
}

export default async function WritingPage() {
  const { series } = await getSeriesList();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Writing Studio</h1>
          <p className="text-muted-foreground mt-1 text-sm">AI와 함께 글을 써보세요.</p>
        </div>
        <Link href="/writing/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />새 프로젝트
          </Button>
        </Link>
      </div>

      {series.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground">아직 프로젝트가 없습니다.</p>
          <Link href="/writing/new" className="mt-4">
            <Button variant="outline">첫 프로젝트 만들기</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <SeriesCard
              key={s.id}
              id={s.id}
              title={s.title}
              genre={s.genre}
              writingType={s.writing_type}
              updatedAt={s.updated_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
