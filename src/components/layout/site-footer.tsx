import { siteConfig } from "@/lib/site";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/80">
      <Container className="flex flex-col gap-3 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{siteConfig.name}의 첫 모듈인 {siteConfig.moduleName}에서 학습 세션을 진행하고, 완료 뒤 리포트 상태까지 바로 확인할 수 있습니다.</p>
        <p className="font-mono text-xs uppercase tracking-[0.16em]">Responsive Web / Korean Only</p>
      </Container>
    </footer>
  );
}
