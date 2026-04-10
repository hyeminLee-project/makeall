"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAsyncAction } from "@/hooks/use-async-action";
import { apiClient } from "@/lib/api-client";

interface EssayFormData {
  title: string;
  topic: string;
  keywords: string;
  tone: string;
  referenceMaterials: string;
  referenceStyle: string;
}

interface EssayFormProps {
  initialData?: Partial<EssayFormData>;
}

export function EssayForm({ initialData }: EssayFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<EssayFormData>({
    title: initialData?.title ?? "",
    topic: initialData?.topic ?? "",
    keywords: initialData?.keywords ?? "",
    tone: initialData?.tone ?? "",
    referenceMaterials: initialData?.referenceMaterials ?? "",
    referenceStyle: initialData?.referenceStyle ?? "",
  });

  const submitAction = useCallback(async (data: EssayFormData) => {
    const keywordArray = data.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    return apiClient<{ id: string }>("/api/writing/projects/create", {
      method: "POST",
      body: JSON.stringify({
        writingType: "essay",
        title: data.title,
        tone: data.tone || undefined,
        referenceStyle: data.referenceStyle || undefined,
        metadata: {
          topic: data.topic,
          keywords: keywordArray.length > 0 ? keywordArray : ["일반"],
          referenceMaterials: data.referenceMaterials || undefined,
        },
      }),
    });
  }, []);

  const { execute, error, isLoading } = useAsyncAction(submitAction);

  function updateField<K extends keyof EssayFormData>(key: K, value: string) {
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

      <div>
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="에세이 제목"
          maxLength={200}
          required
        />
      </div>

      <div>
        <Label htmlFor="topic">주제</Label>
        <Textarea
          id="topic"
          value={form.topic}
          onChange={(e) => updateField("topic", e.target.value)}
          placeholder="에세이에서 다룰 주제를 설명해주세요"
          maxLength={2000}
          rows={3}
          required
        />
      </div>

      <div>
        <Label htmlFor="keywords">키워드 (쉼표로 구분)</Label>
        <Input
          id="keywords"
          value={form.keywords}
          onChange={(e) => updateField("keywords", e.target.value)}
          placeholder="예: 재택근무, 생산성, 워라밸"
        />
      </div>

      <div>
        <Label htmlFor="tone">톤/분위기 (선택)</Label>
        <Input
          id="tone"
          value={form.tone}
          onChange={(e) => updateField("tone", e.target.value)}
          placeholder="예: 따뜻하고 공감가는"
          maxLength={500}
        />
      </div>

      <div>
        <Label htmlFor="referenceMaterials">참고자료 (선택)</Label>
        <Textarea
          id="referenceMaterials"
          value={form.referenceMaterials}
          onChange={(e) => updateField("referenceMaterials", e.target.value)}
          placeholder="참고하고 싶은 자료나 링크를 적어주세요"
          maxLength={5000}
          rows={3}
        />
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
          {isLoading ? "생성 중..." : "에세이 프로젝트 생성"}
        </Button>
      </div>
    </form>
  );
}
