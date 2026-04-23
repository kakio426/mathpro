import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/70 backdrop-blur">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link className="truncate text-lg font-semibold tracking-tight" href="/">
            {siteConfig.name}
          </Link>
          <Badge variant="accent">{siteConfig.shellStage}</Badge>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/lab/whole-and-part">학습 시작</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/report/demo-session">리포트 상태 보기</Link>
          </Button>
        </nav>
      </Container>
    </header>
  );
}
