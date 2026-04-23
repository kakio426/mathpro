import { siteConfig } from "@/lib/site";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/80">
      <Container className="flex flex-col gap-3 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{siteConfig.name}의 첫 모듈인 {siteConfig.moduleName} 프로젝트 골격입니다. 이후 S2-S6 태스크가 이 구조 위에 올라갑니다.</p>
        <p className="font-mono text-xs uppercase tracking-[0.16em]">Responsive Web / Korean Only</p>
      </Container>
    </footer>
  );
}
