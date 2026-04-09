"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { GenreBadge } from "@/components/writing/genre-badge";
import { EpisodeList } from "@/components/writing/episode-list";
import { CharacterList } from "@/components/writing/character-list";
import { ContinuityViewer } from "@/components/writing/continuity-viewer";
import { apiClient } from "@/lib/api-client";

interface Series {
  id: string;
  title: string;
  genre: string;
  setting: string;
  characters: Array<{
    name: string;
    role: "protagonist" | "antagonist" | "supporting" | "minor";
    description: string;
    personality: string;
    relationships: { characterName: string; relationship: string }[];
  }>;
  plot_outline: string;
  tone: string | null;
  target_episode_length: number;
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

export default function SeriesDetailPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <p className="text-destructive">{error ?? "시리즈를 찾을 수 없습니다."}</p>
        <Link href="/writing" className="mt-4">
          <Button variant="outline">목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{series.title}</h1>
            <GenreBadge genre={series.genre} />
          </div>
          {series.tone && <p className="text-muted-foreground mt-1 text-sm">{series.tone}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/writing/${seriesId}/episodes/generate`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />새 에피소드
            </Button>
          </Link>
          <Link href={`/writing/${seriesId}/edit`}>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

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
    </div>
  );
}
