import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GenreBadge } from "./genre-badge";

interface SeriesCardProps {
  id: string;
  title: string;
  genre: string;
  updatedAt: string;
}

export function SeriesCard({ id, title, genre, updatedAt }: SeriesCardProps) {
  return (
    <Link href={`/writing/${id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-md">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-xs">
                  {new Date(updatedAt).toLocaleDateString("ko-KR")}
                </CardDescription>
              </div>
            </div>
            <GenreBadge genre={genre} />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
