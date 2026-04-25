import Link from "next/link";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/82 backdrop-blur-xl">
      <Container className="flex flex-col gap-3 py-3 lg:min-h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <div className="flex w-full min-w-0 items-center justify-between gap-3 lg:w-auto lg:justify-start">
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
          <Badge className="hidden shrink-0 sm:inline-flex" variant="accent">
            {siteConfig.shellStage}
          </Badge>
        </div>
        <nav className="-mx-1 flex w-full items-center gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:w-auto lg:overflow-visible lg:px-0 lg:pb-0">
          <Button asChild className="shrink-0" size="sm" variant="ghost">
            <Link href="/">자료 만들기</Link>
          </Button>
          <Button asChild className="shrink-0" size="sm" variant="ghost">
            <Link href={"/library" as Route}>공유 자료실</Link>
          </Button>
          <Button asChild className="shrink-0" size="sm" variant="ghost">
            <Link href={"/teacher/activities" as Route}>내 자료</Link>
          </Button>
          <Button asChild className="shrink-0" size="sm" variant="ghost">
            <Link href={"/teacher/distribution" as Route}>배포</Link>
          </Button>
          <Button asChild className="shrink-0" size="sm" variant="ghost">
            <Link href={"/teacher/reports" as Route}>결과</Link>
          </Button>
          <Button asChild className="shrink-0" size="sm" variant="secondary">
            <Link href={"/join" as Route}>참여 코드</Link>
          </Button>
        </nav>
      </Container>
    </header>
  );
}
