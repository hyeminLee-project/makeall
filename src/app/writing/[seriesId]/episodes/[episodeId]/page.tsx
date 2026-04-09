"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EpisodeEditor } from "@/components/writing/episode-editor";
import { apiClient } from "@/lib/api-client";

interface EpisodeData {
  id: string;
  episode_number: number;
  status: string;
  draft: string | null;
  final_content: string | null;
}

interface SeriesData {
  title: string;
}

export default function EpisodeEditorPage() {
  const { seriesId, episodeId } = useParams<{
    seriesId: string;
    episodeId: string;
  }>();
  const [episode, setEpisode] = useState<EpisodeData | null>(null);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [epData, seriesData] = await Promise.all([
        apiClient<EpisodeData>(`/api/writing/series/${seriesId}/episodes/${episodeId}`),
        apiClient<{ series: SeriesData }>(`/api/writing/series/${seriesId}`),
      ]);
      setEpisode(epData);
      setSeriesTitle(seriesData.series.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [seriesId, episodeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-destructive">{error ?? "에피소드를 찾을 수 없습니다."}</p>
      </div>
    );
  }

  const content = episode.final_content ?? episode.draft ?? "";

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link
        href={`/writing/${seriesId}`}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {seriesTitle}
      </Link>
      <EpisodeEditor
        episodeId={episodeId}
        seriesId={seriesId}
        episodeNumber={episode.episode_number}
        status={episode.status}
        initialContent={content}
      />
    </div>
  );
}
