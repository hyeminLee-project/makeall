"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SeriesForm } from "@/components/writing/series-form";
import { apiClient } from "@/lib/api-client";

interface SeriesData {
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
  target_episode_length: number;
  tone: string | null;
  reference_style: string | null;
}

export default function EditSeriesPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [series, setSeries] = useState<SeriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSeries = useCallback(async () => {
    try {
      const data = await apiClient<{ series: SeriesData }>(`/api/writing/series/${seriesId}`);
      setSeries(data.series);
    } catch {
      // error handled by form
    } finally {
      setIsLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive">시리즈를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">시리즈 편집</h1>
        <p className="text-muted-foreground mt-1 text-sm">{series.title}</p>
      </div>
      <SeriesForm
        seriesId={seriesId}
        initialData={{
          title: series.title,
          genre: series.genre,
          setting: series.setting,
          characters: series.characters ?? [],
          plotOutline: series.plot_outline,
          targetEpisodeLength: series.target_episode_length,
          tone: series.tone ?? "",
          referenceStyle: series.reference_style ?? "",
        }}
      />
    </div>
  );
}
