"use client";

import { useState } from "react";
import { BookOpen, FileText, Newspaper, BookMarked, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SeriesForm } from "@/components/writing/series-form";
import { EssayForm } from "@/components/writing/essay-form";
import { ColumnForm } from "@/components/writing/column-form";
import { ShortStoryForm } from "@/components/writing/short-story-form";
import { useAsyncAction } from "@/hooks/use-async-action";
import { apiClient } from "@/lib/api-client";
import type { WritingType } from "@/lib/types";

const writingTypes = [
  {
    value: "serial" as WritingType,
    label: "연재소설",
    description: "캐릭터와 줄거리를 설정하고 에피소드를 생성",
    icon: BookOpen,
  },
  {
    value: "essay" as WritingType,
    label: "에세이",
    description: "주제와 키워드로 에세이 초안 생성",
    icon: FileText,
  },
  {
    value: "column" as WritingType,
    label: "칼럼",
    description: "논점과 타겟 독자를 설정하고 칼럼 작성",
    icon: Newspaper,
  },
  {
    value: "short_story" as WritingType,
    label: "단편소설",
    description: "간단한 설정으로 단편소설 초안 생성",
    icon: BookMarked,
  },
];

type Step = "type" | "idea" | "form";

export default function NewProjectPage() {
  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<WritingType | null>(null);
  const [idea, setIdea] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prefillData, setPrefillData] = useState<any>(null);

  const quickStartAction = async (input: { idea: string; writingType: WritingType }) => {
    return apiClient<Record<string, unknown>>("/api/writing/quick-start", {
      method: "POST",
      body: JSON.stringify(input),
    });
  };

  const {
    execute: executeQuickStart,
    error: quickStartError,
    isLoading: isGenerating,
  } = useAsyncAction(quickStartAction);

  function selectType(type: WritingType) {
    setSelectedType(type);
    setStep("idea");
  }

  async function handleQuickStart() {
    if (!selectedType || !idea.trim()) return;
    const result = await executeQuickStart({ idea: idea.trim(), writingType: selectedType });
    if (result) {
      setPrefillData(result);
      setStep("form");
    }
  }

  function skipToForm() {
    setStep("form");
  }

  function goBack() {
    if (step === "form") {
      setPrefillData(null);
      setStep("idea");
    } else if (step === "idea") {
      setSelectedType(null);
      setStep("type");
    }
  }

  const typeLabel = writingTypes.find((t) => t.value === selectedType)?.label ?? "";

  return (
    <div className="mx-auto max-w-3xl p-6">
      {step !== "type" && (
        <button
          onClick={goBack}
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          뒤로
        </button>
      )}

      {step === "type" && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">새 프로젝트</h1>
            <p className="text-muted-foreground mt-1 text-sm">어떤 글을 쓰고 싶으신가요?</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {writingTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => selectType(type.value)}
                className="hover:border-primary/50 flex items-start gap-4 rounded-lg border p-5 text-left transition-colors"
              >
                <type.icon className="text-muted-foreground mt-0.5 h-6 w-6 shrink-0" />
                <div>
                  <p className="font-medium">{type.label}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "idea" && selectedType && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{typeLabel} 시작하기</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              아이디어를 한 줄로 적으면 AI가 설정을 생성해드려요.
            </p>
          </div>

          {quickStartError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{quickStartError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="예: 재택근무의 장단점에 대한 솔직한 이야기"
              maxLength={500}
              disabled={isGenerating}
            />
            <div className="flex gap-3">
              <Button onClick={handleQuickStart} disabled={!idea.trim() || isGenerating}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "AI가 생성 중..." : "AI로 설정 생성"}
              </Button>
              <Button variant="outline" onClick={skipToForm} disabled={isGenerating}>
                직접 입력하기
              </Button>
            </div>
          </div>
        </>
      )}

      {step === "form" && selectedType && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">
              {prefillData ? `${typeLabel} 설정 확인` : `${typeLabel} 정보 입력`}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {prefillData
                ? "AI가 생성한 설정을 확인하고 수정해주세요."
                : `${typeLabel} 정보를 입력하고 AI와 함께 시작하세요.`}
            </p>
          </div>

          {selectedType === "serial" && <SeriesForm initialData={prefillData} />}
          {selectedType === "essay" && (
            <EssayForm
              initialData={
                prefillData
                  ? {
                      title: prefillData.title,
                      topic: prefillData.topic,
                      keywords: prefillData.keywords?.join(", ") ?? "",
                      tone: prefillData.tone ?? "",
                    }
                  : undefined
              }
            />
          )}
          {selectedType === "column" && (
            <ColumnForm
              initialData={
                prefillData
                  ? {
                      title: prefillData.title,
                      topic: prefillData.topic,
                      argument: prefillData.argument ?? "",
                      targetAudience: prefillData.targetAudience ?? "",
                      tone: prefillData.tone ?? "",
                    }
                  : undefined
              }
            />
          )}
          {selectedType === "short_story" && (
            <ShortStoryForm
              initialData={
                prefillData
                  ? {
                      title: prefillData.title,
                      genre: prefillData.genre,
                      setting: prefillData.setting ?? "",
                      targetLength: prefillData.targetLength ?? 5000,
                      tone: prefillData.tone ?? "",
                    }
                  : undefined
              }
            />
          )}
        </>
      )}
    </div>
  );
}
