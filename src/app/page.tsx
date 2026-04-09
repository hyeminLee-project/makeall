import Link from "next/link";
import { PenTool, Share2, BarChart3, Music, Video, Code2, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const modules = [
  {
    name: "Writing Studio",
    description: "AI 초안 생성, 에디터, 문체 학습, 연재 소설",
    href: "/writing",
    icon: PenTool,
    ready: true,
  },
  {
    name: "Publishing Hub",
    description: "멀티플랫폼 동시 발행, 예약 게시",
    href: "/publishing",
    icon: Share2,
    ready: false,
  },
  {
    name: "Analytics",
    description: "플랫폼별 성과 분석, 수익 추적",
    href: "/analytics",
    icon: BarChart3,
    ready: false,
  },
  {
    name: "Music Lab",
    description: "AI 작곡, 작사",
    href: "/music",
    icon: Music,
    ready: false,
  },
  {
    name: "Video Lab",
    description: "AI 영상 제작, 자막, BGM, 썸네일",
    href: "/video",
    icon: Video,
    ready: false,
  },
  {
    name: "Code Review",
    description: "GitHub PR 분석, 보안/성능 리뷰",
    href: "/code-review",
    icon: Code2,
    ready: false,
  },
  {
    name: "Automation",
    description: "워크플로우 자동화, 템플릿, 스케줄",
    href: "/automation",
    icon: Zap,
    ready: false,
  },
];

export default function Home() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">AI Creative Studio</h1>
        <p className="text-muted-foreground mt-1">
          글쓰기, 작곡, 영상 제작, 코드 리뷰 — 하나의 공간에서.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const content = (
            <Card
              key={mod.name}
              className={
                mod.ready ? "cursor-pointer transition-shadow hover:shadow-md" : "opacity-50"
              }
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-md">
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{mod.name}</CardTitle>
                    <CardDescription className="text-xs">{mod.description}</CardDescription>
                  </div>
                </div>
                {!mod.ready && <span className="text-muted-foreground mt-2 text-xs">준비 중</span>}
              </CardHeader>
            </Card>
          );

          return mod.ready ? (
            <Link key={mod.name} href={mod.href}>
              {content}
            </Link>
          ) : (
            <div key={mod.name}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
