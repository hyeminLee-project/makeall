"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { CharacterForm, type CharacterData } from "./character-form";
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

const emptyCharacter: CharacterData = {
  name: "",
  role: "protagonist",
  description: "",
  personality: "",
  relationships: [],
};

interface SeriesFormData {
  title: string;
  genre: string;
  setting: string;
  characters: CharacterData[];
  plotOutline: string;
  targetEpisodeLength: number;
  tone: string;
  referenceStyle: string;
}

interface SeriesFormProps {
  initialData?: SeriesFormData;
  seriesId?: string;
}

export function SeriesForm({ initialData, seriesId }: SeriesFormProps) {
  const router = useRouter();
  const isEditing = !!seriesId;

  const [form, setForm] = useState<SeriesFormData>(
    initialData ?? {
      title: "",
      genre: "fantasy",
      setting: "",
      characters: [{ ...emptyCharacter }],
      plotOutline: "",
      targetEpisodeLength: 5000,
      tone: "",
      referenceStyle: "",
    }
  );

  const submitAction = useCallback(
    async (data: SeriesFormData) => {
      const body = {
        title: data.title,
        genre: data.genre,
        setting: data.setting,
        characters: data.characters,
        plotOutline: data.plotOutline,
        targetEpisodeLength: data.targetEpisodeLength,
        tone: data.tone || undefined,
        referenceStyle: data.referenceStyle || undefined,
      };

      if (isEditing) {
        await apiClient(`/api/writing/series/${seriesId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        return { id: seriesId };
      }

      return apiClient<{ id: string }>("/api/writing/series/create", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    [isEditing, seriesId]
  );

  const { execute, error, isLoading } = useAsyncAction(submitAction);

  function updateField<K extends keyof SeriesFormData>(key: K, value: SeriesFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateCharacter(index: number, character: CharacterData) {
    const updated = [...form.characters];
    updated[index] = character;
    updateField("characters", updated);
  }

  function removeCharacter(index: number) {
    updateField(
      "characters",
      form.characters.filter((_, i) => i !== index)
    );
  }

  function addCharacter() {
    if (form.characters.length >= 20) return;
    updateField("characters", [...form.characters, { ...emptyCharacter }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await execute(form);
    if (result) {
      router.push(`/writing/${result.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">기본 정보</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="title">시리즈 제목</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="시리즈 제목을 입력하세요"
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
          <Label htmlFor="tone">톤/분위기 (선택)</Label>
          <Input
            id="tone"
            value={form.tone}
            onChange={(e) => updateField("tone", e.target.value)}
            placeholder="예: 어둡고 긴장감 있는"
            maxLength={500}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">세계관</h3>
        <div>
          <Label htmlFor="setting">배경/세계관</Label>
          <Textarea
            id="setting"
            value={form.setting}
            onChange={(e) => updateField("setting", e.target.value)}
            placeholder="이야기가 펼쳐지는 세계를 설명해주세요"
            maxLength={5000}
            rows={4}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">캐릭터</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCharacter}
            disabled={form.characters.length >= 20}
          >
            <Plus className="mr-1 h-4 w-4" />
            추가
          </Button>
        </div>
        <div className="space-y-3">
          {form.characters.map((char, i) => (
            <CharacterForm
              key={i}
              index={i}
              character={char}
              onChange={updateCharacter}
              onRemove={removeCharacter}
              canRemove={form.characters.length > 1}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">줄거리</h3>
        <div>
          <Label htmlFor="plotOutline">전체 줄거리</Label>
          <Textarea
            id="plotOutline"
            value={form.plotOutline}
            onChange={(e) => updateField("plotOutline", e.target.value)}
            placeholder="시리즈의 전체적인 줄거리를 작성해주세요"
            maxLength={10000}
            rows={6}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">설정</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="targetEpisodeLength">목표 에피소드 분량 (자)</Label>
            <Input
              id="targetEpisodeLength"
              type="number"
              value={form.targetEpisodeLength}
              onChange={(e) => updateField("targetEpisodeLength", Number(e.target.value))}
              min={1000}
              max={20000}
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
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEditing
              ? "수정 중..."
              : "생성 중..."
            : isEditing
              ? "시리즈 수정"
              : "시리즈 생성"}
        </Button>
      </div>
    </form>
  );
}
