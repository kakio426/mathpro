import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TeacherReportSummary } from "@/types/teacher";

type TeacherReportViewProps = {
  report: TeacherReportSummary;
};

function ReportList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6 text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function TeacherReportView({ report }: TeacherReportViewProps) {
  return (
    <main className="py-[var(--space-section)]">
      <Container className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="accent">교사 리포트</Badge>
          <Badge>참여 코드 {report.code}</Badge>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {report.activityTitle}
          </h1>
          <p className="text-sm leading-6 text-muted">
            학생별 조작 이벤트를 바탕으로 조작 흐름, 머문 지점, 오개념 신호, 다음 수업 보완점을 모읍니다.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>참여</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {report.participantCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>완료</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {report.completedCount}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>이벤트</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {report.eventCount}
            </CardContent>
          </Card>
        </div>

        <div data-shell-grid="two">
          <Card>
            <CardHeader>
              <CardTitle>학생이 어떤 조작을 했는가</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportList items={report.manipulationPatterns} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>어디서 오래 머물렀는가</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportList items={report.dwellPatterns} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>어떤 오개념 신호가 보였는가</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportList items={report.misconceptionSignals} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>다음 수업에서 무엇을 보완할 것인가</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportList items={report.nextTeachingMoves} />
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
