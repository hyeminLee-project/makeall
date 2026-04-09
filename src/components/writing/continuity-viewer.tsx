import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, GitBranch, Clock, Users } from "lucide-react";

interface ContinuityState {
  previousEpisodesSummary: string;
  characterStates: Record<string, string>;
  unresolvedPlotThreads: string[];
  timelinePosition: string;
  lastEpisodeNumber: number;
}

interface ContinuityViewerProps {
  continuity: ContinuityState | null;
}

export function ContinuityViewer({ continuity }: ContinuityViewerProps) {
  if (!continuity) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <BookOpen className="text-muted-foreground mb-2 h-8 w-8" />
        <p className="text-muted-foreground">
          아직 완성된 에피소드가 없어 연속성 데이터가 없습니다.
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          에피소드를 완성 처리하면 자동으로 생성됩니다.
        </p>
      </div>
    );
  }

  const characterEntries = Object.entries(continuity.characterStates);

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Badge variant="secondary">EP {continuity.lastEpisodeNumber}까지 반영</Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            이야기 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {continuity.previousEpisodesSummary}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            현재 시점
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{continuity.timelinePosition}</p>
        </CardContent>
      </Card>

      {characterEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              캐릭터 현재 상태
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {characterEntries.map(([name, state], i) => (
              <div key={name}>
                {i > 0 && <Separator className="my-3" />}
                <div>
                  <span className="text-sm font-medium">{name}</span>
                  <p className="text-muted-foreground mt-0.5 text-sm">{state}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {continuity.unresolvedPlotThreads.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4" />
              미해결 복선
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {continuity.unresolvedPlotThreads.map((thread, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  {thread}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
