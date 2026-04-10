import Link from "next/link";
import { BookOpen, FileText, Newspaper, BookMarked } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenreBadge } from "./genre-badge";

const typeConfig: Record<string, { label: string; icon: typeof BookOpen }> = {
  serial: { label: "연재", icon: BookOpen },
  essay: { label: "에세이", icon: FileText },
  column: { label: "칼럼", icon: Newspaper },
  short_story: { label: "단편", icon: BookMarked },
};

interface SeriesCardProps {
  id: string;
  title: string;
  genre: string;
  writingType?: string;
  updatedAt: string;
}

export function SeriesCard({
  id,
  title,
  genre,
  writingType = "serial",
  updatedAt,
}: SeriesCardProps) {
  const config = typeConfig[writingType] ?? typeConfig.serial;
  const Icon = config.icon;

  return (
    <Link href={`/writing/${id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-md">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-xs">
                  {new Date(updatedAt).toLocaleDateString("ko-KR")}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
              {genre && writingType === "serial" && <GenreBadge genre={genre} />}
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
