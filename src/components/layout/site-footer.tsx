import { siteConfig } from "@/lib/site";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/80">
      <Container className="flex flex-col gap-3 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{siteConfig.name} 제작실: 만들고, 배포하고, 조작 과정을 읽습니다.</p>
        <p className="text-xs font-semibold tracking-[0.12em] text-muted">
          움직이는 자료 / 과정 리포트
        </p>
      </Container>
    </footer>
  );
}
