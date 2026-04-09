"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenTool, Share2, BarChart3, Music, Video, Code2, Zap, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  { name: "홈", href: "/", icon: Home },
  { name: "Writing Studio", href: "/writing", icon: PenTool },
  { name: "Publishing Hub", href: "/publishing", icon: Share2 },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Music Lab", href: "/music", icon: Music },
  { name: "Video Lab", href: "/video", icon: Video },
  { name: "Code Review", href: "/code-review", icon: Code2 },
  { name: "Automation", href: "/automation", icon: Zap },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-sidebar-border bg-sidebar flex h-full w-60 flex-col border-r">
      <div className="border-sidebar-border flex h-14 items-center gap-2 border-b px-4">
        <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold">
          M
        </div>
        <span className="text-sm font-semibold">MakeAll</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {modules.map((mod) => {
          const isActive = mod.href === "/" ? pathname === "/" : pathname.startsWith(mod.href);
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <mod.icon className="h-4 w-4" />
              {mod.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
