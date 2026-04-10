"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Settings, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenreBadge } from "@/components/writing/genre-badge";
import { EpisodeList } from "@/components/writing/episode-list";
import { CharacterList } from "@/components/writing/character-list";
import { ContinuityViewer } from "@/components/writing/continuity-viewer";
import { apiClient } from "@/lib/api-client";

interface Series {
  id: string;
  title: string;
  writing_type: "serial" | "essay" | "column" | "short_story";
  genre: string | null;
  setting: string | null;
  characters: Array<{
    name: string;
    role: "protagonist" | "antagonist" | "supporting" | "minor";
    description: string;
    personality: string;
    relationships: { characterName: string; relationship: string }[];
  }> | null;
  plot_outline: string | null;
  tone: string | null;
  target_episode_length: number | null;
  type_metadata: Record<string, unknown> | null;
  continuity_state: {
    previousEpisodesSummary: string;
    characterStates: Record<string, string>;
    unresolvedPlotThreads: string[];
    timelinePosition: string;
    lastEpisodeNumber: number;
  } | null;
}

interface Episode {
  id: string;
  episode_number: number;
  status: string;
  word_count: number | null;
  created_at: string;
  finalized_at: string | null;
}

interface DraftResult {
  id: string;
  draft: string;
  suggestions: string[];
}

const WRITING_TYPE_LABELS: Record<string, string> = {
  serial: "연재소설",
  essay: "에세이",
  column: "칼럼",
  short_story: "단편소설",
};

const METADATA_LABELS: Record<string, Record<string, string>> = {
  essay: { topic: "주제", keywords: "키워드", referenceMaterials: "참고자료" },
  column: { topic: "주제", argument: "핵심 논점", targetAudience: "타겟 독자" },
  short_story: { genre: "장르", setting: "배경", targetLength: "목표 분량" },
};

function ProjectMetadataView({
  writingType,
  metadata,
}: {
  writingType: string;
  metadata: Record<string, unknown>;
}) {
  const labels = METADATA_LABELS[writingType] ?? {};
  const entries = Object.entries(metadata).filter(([, v]) => v != null && v !== "");

  if (entries.length === 0) {
    return <p className="text-muted-foreground">설정 정보가 없습니다.</p>;
  }

  return (
    <dl className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt className="text-muted-foreground text-xs font-medium">{labels[key] ?? key}</dt>
          <dd className="mt-0.5">{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function SeriesDetailPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<{ series: Series; episodes: Episode[] }>(
        `/api/writing/series/${seriesId}`
      );
      setSeries(data.series);
      setEpisodes(data.episodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const data = await apiClient<DraftResult>(`/api/writing/projects/${seriesId}/generate`, {
        method: "POST",
      });
      setDraftResult(data);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "초안 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive">{error ?? "프로젝트를 찾을 수 없습니다."}</p>
        <Link href="/writing" className="mt-4">
          <Button variant="outline">목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const isSerial = series.writing_type === "serial";

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{series.title}</h1>
            {isSerial && series.genre && <GenreBadge genre={series.genre} />}
            {!isSerial && (
              <span className="text-muted-foreground rounded-md border px-2 py-0.5 text-xs">
                {WRITING_TYPE_LABELS[series.writing_type] ?? series.writing_type}
              </span>
            )}
          </div>
          {series.tone && <p className="text-muted-foreground mt-1 text-sm">{series.tone}</p>}
        </div>
        <div className="flex gap-2">
          {isSerial ? (
            <Link href={`/writing/${seriesId}/episodes/generate`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />새 에피소드
              </Button>
            </Link>
          ) : (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "생성 중..." : "초안 생성"}
            </Button>
          )}
          <Link href={`/writing/${seriesId}/edit`}>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {generateError && <p className="text-destructive mb-4 text-sm">{generateError}</p>}

      {!isSerial && draftResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">생성된 초안</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">{draftResult.draft}</div>
            {draftResult.suggestions.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="text-muted-foreground mb-2 text-xs font-medium">AI 제안</p>
                <ul className="text-muted-foreground list-disc pl-4 text-sm">
                  {draftResult.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isSerial ? (
        <Tabs defaultValue="episodes">
          <TabsList>
            <TabsTrigger value="episodes">에피소드 ({episodes.length})</TabsTrigger>
            <TabsTrigger value="characters">캐릭터 ({series.characters?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="continuity">연속성</TabsTrigger>
          </TabsList>

          <TabsContent value="episodes" className="mt-4">
            <EpisodeList episodes={episodes} seriesId={seriesId} />
          </TabsContent>

          <TabsContent value="characters" className="mt-4">
            <CharacterList characters={series.characters ?? []} seriesId={seriesId} />
          </TabsContent>

          <TabsContent value="continuity" className="mt-4">
            <ContinuityViewer continuity={series.continuity_state} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {series.type_metadata ? (
              <ProjectMetadataView
                writingType={series.writing_type}
                metadata={series.type_metadata}
              />
            ) : (
              <p className="text-muted-foreground">설정 정보가 없습니다.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
