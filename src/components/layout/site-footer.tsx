import { siteConfig } from "@/lib/site";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/80">
      <Container className="flex flex-col gap-3 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{siteConfig.name}는 교사 저작, 코드 배포, 학생 조작 기록, 리포트 생성을 하나의 흐름으로 묶습니다.</p>
        <p className="font-mono text-xs uppercase tracking-[0.16em]">Responsive Web / Korean Only</p>
      </Container>
    </footer>
  );
}
