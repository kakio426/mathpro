import Link from "next/link";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/82 backdrop-blur-xl">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link className="flex min-w-0 items-center gap-3" href="/">
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-card">
              수
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold tracking-tight">
                {siteConfig.name} 제작실
              </span>
              <span className="hidden text-xs font-semibold tracking-[0.16em] text-muted uppercase sm:block">
                교사용 인터랙티브 자료 제작
              </span>
            </span>
          </Link>
          <Badge variant="accent">{siteConfig.shellStage}</Badge>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/">자료 만들기</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href={"/join" as Route}>참여 코드</Link>
          </Button>
        </nav>
      </Container>
    </header>
  );
}
