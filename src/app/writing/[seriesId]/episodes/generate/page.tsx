"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EpisodeGenerateForm } from "@/components/writing/episode-generate-form";
import { EpisodeGenerateResult } from "@/components/writing/episode-generate-result";
import { useAsyncAction } from "@/hooks/use-async-action";
import { apiClient } from "@/lib/api-client";

interface Series {
  id: string;
  title: string;
  characters: Array<{ name: string }>;
}

interface Episode {
  episode_number: number;
}

interface GenerateResult {
  id: string;
  draft: string;
  episodeNumber: number;
  wordCount: number;
  continuityNotes: string[];
  suggestedNextPlotPoints: string[];
}

export default function EpisodeGeneratePage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [nextEpisodeNumber, setNextEpisodeNumber] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const fetchSeries = useCallback(async () => {
    try {
      const data = await apiClient<{ series: Series; episodes: Episode[] }>(
        `/api/writing/series/${seriesId}`
      );
      setSeries(data.series);
      const maxEp = Math.max(0, ...data.episodes.map((e) => e.episode_number));
      setNextEpisodeNumber(maxEp + 1);
    } catch {
      // handled by UI
    } finally {
      setIsPageLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const generateAction = useCallback(
    async (input: {
      episodeNumber: number;
      episodeOutline: string;
      focusCharacters: string[];
      plotPoints: string[];
      specialInstructions?: string;
    }) => {
      return apiClient<GenerateResult>(`/api/writing/series/${seriesId}/episodes/generate`, {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    [seriesId]
  );

  const { execute, data: result, error, isLoading: isGenerating } = useAsyncAction(generateAction);

  if (isPageLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-destructive">시리즈를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Link
          href={`/writing/${seriesId}`}
          className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {series.title}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">새 에피소드 생성</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          AI가 에피소드 초안을 작성합니다. 약 30초~1분 소요됩니다.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isGenerating && (
        <div className="mb-6 space-y-4">
          <div className="rounded-lg border p-6 text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-sm font-medium">AI가 에피소드를 생성하고 있습니다...</p>
            <p className="text-muted-foreground mt-1 text-xs">
              시리즈 설정과 연속성을 분석하여 초안을 작성합니다.
            </p>
          </div>
        </div>
      )}

      {result ? (
        <EpisodeGenerateResult
          episodeId={result.id}
          seriesId={seriesId}
          draft={result.draft}
          episodeNumber={result.episodeNumber}
          wordCount={result.wordCount}
          continuityNotes={result.continuityNotes}
          suggestedNextPlotPoints={result.suggestedNextPlotPoints}
        />
      ) : (
        !isGenerating && (
          <EpisodeGenerateForm
            nextEpisodeNumber={nextEpisodeNumber}
            characterNames={series.characters?.map((c) => c.name) ?? []}
            onSubmit={execute}
            isLoading={isGenerating}
          />
        )
      )}
    </div>
  );
}
