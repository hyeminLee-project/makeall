import { SeriesForm } from "@/components/writing/series-form";

export default function NewSeriesPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">새 시리즈</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          시리즈 정보를 입력하고 AI와 함께 연재를 시작하세요.
        </p>
      </div>
      <SeriesForm />
    </div>
  );
}
