import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MousePointerClick,
  Radio,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { Container } from "@/components/layout/container";
import {
  GuidedTour,
  type GuidedTourStep,
} from "@/components/onboarding/guided-tour";
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

const teacherReportTourSteps: GuidedTourStep[] = [
  {
    eyebrow: "리포트 안내",
    title: "이 화면은 정답률보다 과정을 먼저 봅니다",
    body: "상단 숫자는 몇 명이 참여했고, 몇 명이 끝냈고, 학생 조작 기록이 얼마나 쌓였는지를 보여줍니다.",
    detail:
      "숫자는 전체 분위기를 보는 입구입니다. 실제 수업 보완점은 아래 4개의 분석 카드에서 확인합니다.",
  },
  {
    eyebrow: "조작 흐름",
    title: "학생이 어떤 순서로 만졌는지 확인합니다",
    body: "선택, 드래그, 제출, 완료 같은 행동이 모이면 학생이 개념을 어떻게 탐구했는지 볼 수 있습니다.",
  },
  {
    eyebrow: "머문 시간과 오개념 신호",
    title: "오래 머문 곳과 반복된 실수를 함께 봅니다",
    body: "특정 활동에서 오래 머물거나 같은 신호가 반복되면, 다음 수업에서 다시 다뤄야 할 가능성이 큽니다.",
    detail:
      "여기서 말하는 오개념 신호는 확정 판정이 아니라 선생님이 살펴볼 만한 관찰 포인트입니다.",
  },
  {
    eyebrow: "다음 수업",
    title: "마지막 카드는 바로 쓸 수 있는 보완 액션입니다",
    body: "다음 시간에 어떤 장면을 다시 보여주고, 어떤 질문으로 출발하면 좋을지 수업 행동으로 바꿔 줍니다.",
  },
];

type ReportPanelProps = {
  title: string;
  kicker: string;
  items: string[];
  tone: string;
  icon: ComponentType<{ className?: string }>;
};

function ReportList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6 text-muted">
      {items.map((item) => (
        <li className="rounded-2xl bg-white/70 px-4 py-3" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ReportPanel({
  title,
  kicker,
  items,
  tone,
  icon: Icon,
}: ReportPanelProps) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem]">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {kicker}
            </p>
            <CardTitle className="mt-2">{title}</CardTitle>
          </div>
          <div className={`grid size-11 place-items-center rounded-2xl ${tone}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ReportList items={items} />
      </CardContent>
    </Card>
  );
}

export function TeacherReportView({ report }: TeacherReportViewProps) {
  const kpis = [
    {
      label: "참여",
      value: report.participantCount,
      description: "세션",
      icon: Users,
    },
    {
      label: "완료",
      value: report.completedCount,
      description: "완료 세션",
      icon: CheckCircle2,
    },
    {
      label: "이벤트",
      value: report.eventCount,
      description: "조작 로그",
      icon: Radio,
    },
  ];

  return (
    <main className="relative isolate overflow-hidden py-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_16%_20%,rgba(15,118,110,0.18),transparent_32%),radial-gradient(circle_at_84%_10%,rgba(245,158,11,0.18),transparent_28%)]"
      />
      <Container className="max-w-[1400px] space-y-6">
        <section className="rounded-[2rem] border border-border bg-[#12312e] p-5 text-white shadow-soft sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="border-white/20 bg-white/10 text-white">
                    교사 리포트
                  </Badge>
                  <Badge className="border-amber-200/40 bg-amber-300/15 text-amber-100">
                    참여 코드 {report.code}
                  </Badge>
                </div>
                <GuidedTour
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  startLabel="리포트 읽는 법"
                  steps={teacherReportTourSteps}
                  storageKey="mathpro:tour:teacher-report"
                />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {report.activityTitle}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-teal-50/80">
                  학생별 조작 이벤트를 바탕으로 조작 흐름, 머문 지점, 오개념 신호, 다음 수업 보완점을 모읍니다.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-teal-50/80">
              <p className="font-semibold text-white">분석 보드</p>
              <p className="mt-2">
                정답률보다 과정 신호를 먼저 봅니다. 어떤 조작이 반복됐고 어디서 멈췄는지를 다음 수업 질문으로 바꿉니다.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <Card className="rounded-[1.5rem]" key={kpi.label}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                  <div>
                    <p className="text-sm font-semibold text-muted">
                      {kpi.label}
                    </p>
                    <CardTitle className="mt-2 text-4xl">
                      {kpi.value}
                    </CardTitle>
                  </div>
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted">
                  {kpi.description}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section data-shell-grid="two">
          <ReportPanel
            icon={MousePointerClick}
            items={report.manipulationPatterns}
            kicker="조작 흐름"
            title="학생이 어떤 조작을 했는가"
            tone="bg-teal-100 text-teal-800"
          />
          <ReportPanel
            icon={Clock3}
            items={report.dwellPatterns}
            kicker="머문 시간"
            title="어디서 오래 머물렀는가"
            tone="bg-amber-100 text-amber-900"
          />
          <ReportPanel
            icon={AlertTriangle}
            items={report.misconceptionSignals}
            kicker="오개념 신호"
            title="어떤 오개념 신호가 보였는가"
            tone="bg-red-100 text-red-800"
          />
          <ReportPanel
            icon={Lightbulb}
            items={report.nextTeachingMoves}
            kicker="다음 수업"
            title="다음 수업에서 무엇을 보완할 것인가"
            tone="bg-lime-100 text-lime-900"
          />
        </section>
      </Container>
    </main>
  );
}
