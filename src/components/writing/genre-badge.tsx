import { Badge } from "@/components/ui/badge";

const genreLabels: Record<string, string> = {
  fantasy: "판타지",
  romance: "로맨스",
  thriller: "스릴러",
  sf: "SF",
  horror: "호러",
  slice_of_life: "일상",
  historical: "사극",
};

export function GenreBadge({ genre }: { genre: string }) {
  return <Badge variant="secondary">{genreLabels[genre] ?? genre}</Badge>;
}
