import Link from "next/link";
import { ArrowRight, FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface EpisodeGenerateResultProps {
  episodeId: string;
  seriesId: string;
  draft: string;
  episodeNumber: number;
  wordCount: number;
  continuityNotes: string[];
  suggestedNextPlotPoints: string[];
}

export function EpisodeGenerateResult({
  episodeId,
  seriesId,
  draft,
  episodeNumber,
  wordCount,
  continuityNotes,
  suggestedNextPlotPoints,
}: EpisodeGenerateResultProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">에피소드 {episodeNumber} 초안</h3>
          <Badge variant="secondary">{wordCount.toLocaleString()}자</Badge>
        </div>
        <Link href={`/writing/${seriesId}/episodes/${episodeId}`}>
          <Button>
            편집하기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            초안 미리보기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 max-h-96 overflow-y-auto rounded-md p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{draft}</p>
          </div>
        </CardContent>
      </Card>

      {continuityNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">연속성 노트</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {continuityNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {suggestedNextPlotPoints.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4" />
                다음 에피소드 제안
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {suggestedNextPlotPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
