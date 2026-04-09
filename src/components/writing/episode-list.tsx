import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EpisodeStatusBadge } from "./episode-status-badge";

interface Episode {
  id: string;
  episode_number: number;
  status: string;
  word_count: number | null;
  created_at: string;
  finalized_at: string | null;
}

interface EpisodeListProps {
  episodes: Episode[];
  seriesId: string;
}

export function EpisodeList({ episodes, seriesId }: EpisodeListProps) {
  if (episodes.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <p className="text-muted-foreground">아직 에피소드가 없습니다.</p>
        <Link href={`/writing/${seriesId}/episodes/generate`} className="mt-4">
          <Button variant="outline">첫 에피소드 생성하기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {episodes.map((ep) => (
        <div key={ep.id} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground w-8 text-sm font-medium">
              #{ep.episode_number}
            </span>
            <EpisodeStatusBadge status={ep.status} />
            {ep.word_count != null && (
              <span className="text-muted-foreground text-xs">
                {ep.word_count.toLocaleString()}자
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {new Date(ep.created_at).toLocaleDateString("ko-KR")}
            </span>
            <Link href={`/writing/${seriesId}/episodes/${ep.id}`}>
              <Button variant="ghost" size="sm">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
