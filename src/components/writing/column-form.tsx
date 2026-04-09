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

interface ColumnFormData {
  title: string;
  topic: string;
  argument: string;
  targetAudience: string;
  tone: string;
  referenceStyle: string;
}

interface ColumnFormProps {
  initialData?: Partial<ColumnFormData>;
}

export function ColumnForm({ initialData }: ColumnFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ColumnFormData>({
    title: initialData?.title ?? "",
    topic: initialData?.topic ?? "",
    argument: initialData?.argument ?? "",
    targetAudience: initialData?.targetAudience ?? "",
    tone: initialData?.tone ?? "",
    referenceStyle: initialData?.referenceStyle ?? "",
  });

  const submitAction = useCallback(async (data: ColumnFormData) => {
    return apiClient<{ id: string }>("/api/writing/projects/create", {
      method: "POST",
      body: JSON.stringify({
        writingType: "column",
        title: data.title,
        tone: data.tone || undefined,
        referenceStyle: data.referenceStyle || undefined,
        metadata: {
          topic: data.topic,
          argument: data.argument,
          targetAudience: data.targetAudience || "일반 독자",
        },
      }),
    });
  }, []);

  const { execute, error, isLoading } = useAsyncAction(submitAction);

  function updateField<K extends keyof ColumnFormData>(key: K, value: string) {
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
          placeholder="칼럼 제목"
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
          placeholder="칼럼에서 다룰 주제를 설명해주세요"
          maxLength={2000}
          rows={3}
          required
        />
      </div>

      <div>
        <Label htmlFor="argument">핵심 논점</Label>
        <Textarea
          id="argument"
          value={form.argument}
          onChange={(e) => updateField("argument", e.target.value)}
          placeholder="이 칼럼에서 주장하고 싶은 핵심 논점"
          maxLength={3000}
          rows={3}
          required
        />
      </div>

      <div>
        <Label htmlFor="targetAudience">타겟 독자 (선택)</Label>
        <Input
          id="targetAudience"
          value={form.targetAudience}
          onChange={(e) => updateField("targetAudience", e.target.value)}
          placeholder="예: IT 업계 종사자, 20대 직장인"
          maxLength={500}
        />
      </div>

      <div>
        <Label htmlFor="tone">톤/분위기 (선택)</Label>
        <Input
          id="tone"
          value={form.tone}
          onChange={(e) => updateField("tone", e.target.value)}
          placeholder="예: 날카롭고 분석적인"
          maxLength={500}
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
          {isLoading ? "생성 중..." : "칼럼 프로젝트 생성"}
        </Button>
      </div>
    </form>
  );
}
