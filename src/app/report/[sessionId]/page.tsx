import { SessionReportStatus } from "@/components/report/session-report-status";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";

type ReportPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { sessionId } = await params;

  return (
    <section className="py-[var(--space-section)]">
      <Container className="space-y-6">
        <div className="space-y-4">
          <Badge variant="accent">수학프로 리포트</Badge>
          <div className="space-y-3">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              수학프로 학습 리포트
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted">
              방금 끝낸 학습 세션의 저장 상태와 리포트 준비 상황을 보여줍니다.
            </p>
          </div>
        </div>

        <SessionReportStatus sessionId={sessionId} />
      </Container>
    </section>
  );
}
