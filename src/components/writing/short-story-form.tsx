"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAsyncAction } from "@/hooks/use-async-action";
import { apiClient } from "@/lib/api-client";

const genres = [
  { value: "fantasy", label: "판타지" },
  { value: "romance", label: "로맨스" },
  { value: "thriller", label: "스릴러" },
  { value: "sf", label: "SF" },
  { value: "horror", label: "호러" },
  { value: "slice_of_life", label: "일상" },
  { value: "historical", label: "사극" },
];

interface ShortStoryFormData {
  title: string;
  genre: string;
  setting: string;
  targetLength: number;
  tone: string;
  referenceStyle: string;
}

interface ShortStoryFormProps {
  initialData?: Partial<ShortStoryFormData>;
}

export function ShortStoryForm({ initialData }: ShortStoryFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ShortStoryFormData>({
    title: initialData?.title ?? "",
    genre: initialData?.genre ?? "fantasy",
    setting: initialData?.setting ?? "",
    targetLength: initialData?.targetLength ?? 5000,
    tone: initialData?.tone ?? "",
    referenceStyle: initialData?.referenceStyle ?? "",
  });

  const submitAction = useCallback(async (data: ShortStoryFormData) => {
    return apiClient<{ id: string }>("/api/writing/projects/create", {
      method: "POST",
      body: JSON.stringify({
        writingType: "short_story",
        title: data.title,
        tone: data.tone || undefined,
        referenceStyle: data.referenceStyle || undefined,
        metadata: {
          genre: data.genre,
          setting: data.setting,
          targetLength: data.targetLength,
        },
      }),
    });
  }, []);

  const { execute, error, isLoading } = useAsyncAction(submitAction);

  function updateField<K extends keyof ShortStoryFormData>(key: K, value: ShortStoryFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await execute(form);
    if (result) router.push(`/writing/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="단편소설 제목"
            maxLength={200}
            required
          />
        </div>
        <div>
          <Label htmlFor="genre">장르</Label>
          <Select value={form.genre} onValueChange={(v) => v && updateField("genre", v)}>
            <SelectTrigger id="genre">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {genres.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="setting">배경</Label>
        <Textarea
          id="setting"
          value={form.setting}
          onChange={(e) => updateField("setting", e.target.value)}
          placeholder="이야기가 펼쳐지는 배경을 설명해주세요"
          maxLength={3000}
          rows={4}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="targetLength">목표 분량 (자)</Label>
          <Input
            id="targetLength"
            type="number"
            value={form.targetLength}
            onChange={(e) => updateField("targetLength", Number(e.target.value))}
            min={500}
            max={30000}
          />
        </div>
        <div>
          <Label htmlFor="tone">톤/분위기 (선택)</Label>
          <Input
            id="tone"
            value={form.tone}
            onChange={(e) => updateField("tone", e.target.value)}
            placeholder="예: 몽환적이고 서정적인"
            maxLength={500}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="referenceStyle">참고 문체 (선택)</Label>
        <Textarea
          id="referenceStyle"
          value={form.referenceStyle}
          onChange={(e) => updateField("referenceStyle", e.target.value)}
          placeholder="참고하고 싶은 문체의 글을 붙여넣어주세요"
          maxLength={2000}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "생성 중..." : "단편소설 프로젝트 생성"}
        </Button>
      </div>
    </form>
  );
}
