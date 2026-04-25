import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Lightbulb,
  ListChecks,
  MousePointerClick,
  Radio,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ComponentType } from "react";
import { Container } from "@/components/layout/container";
import {
  GuidedTour,
  type GuidedTourStep,
} from "@/components/onboarding/guided-tour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  toFriendlyActivityTitle,
  toFriendlyMaterialTitle,
} from "@/features/teacher/display";
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
      {items.map((item, index) => (
        <li className="rounded-2xl bg-white/70 px-4 py-3" key={`${item}:${index}`}>
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

function formatReportDate(value: string | null) {
  if (!value) {
    return "기록 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: TeacherReportSummary["sessionDetails"][number]["status"]) {
  switch (status) {
    case "completed":
      return "완료";
    case "abandoned":
      return "중단";
    case "started":
      return "진행 중";
  }
}

function statusClassName(
  status: TeacherReportSummary["sessionDetails"][number]["status"],
) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "abandoned":
      return "border-red-200 bg-red-50 text-red-700";
    case "started":
      return "border-amber-200 bg-amber-50 text-amber-900";
  }
}

function blockTypeLabel(
  blockType: TeacherReportSummary["activitySummaries"][number]["blockType"],
) {
  switch (blockType) {
    case "intro":
      return "도입";
    case "html-artifact":
      return "움직이는 자료";
    case "manipulation":
      return "조작 탐구";
    case "prediction":
      return "예측";
    case "explanation":
      return "설명";
    case "wrap-up":
      return "정리";
  }
}

function StudentSessionBoard({
  sessions,
}: {
  sessions: TeacherReportSummary["sessionDetails"];
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              학생별 참여
            </p>
            <CardTitle className="mt-2">누가 어떻게 활동했는가</CardTitle>
          </div>
          <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="size-5" />
          </div>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          학생 계정 없이 참여한 세션을 시간순 참여자로 정리합니다. 실제 이름표
          연결은 다음 확장 단계에서 붙이고, 지금은 조작 흐름과 막힌 지점을 먼저 봅니다.
        </p>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/60 p-5 text-sm leading-6 text-muted">
            아직 참여 세션이 없습니다. 참여 코드를 공유한 뒤 학생이 활동을 시작하면
            이곳에 학생별 흐름이 표시됩니다.
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.map((session) => (
              <article
                className="rounded-3xl border border-border bg-white/72 p-4"
                key={session.sessionId}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{session.label}</Badge>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName(session.status)}`}
                      >
                        {statusLabel(session.status)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted">
                      {session.observation}
                    </p>
                  </div>
                  <div className="grid gap-2 text-xs text-muted sm:grid-cols-4 lg:min-w-[460px]">
                    <span className="rounded-2xl bg-secondary/60 p-3">
                      조작 {session.eventCount}
                    </span>
                    <span className="rounded-2xl bg-secondary/60 p-3">
                      제출 {session.submitCount}
                    </span>
                    <span className="rounded-2xl bg-secondary/60 p-3">
                      힌트 {session.hintCount}
                    </span>
                    <span className="rounded-2xl bg-secondary/60 p-3">
                      재시도 {session.retryCount}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-muted md:grid-cols-3">
                  <p className="rounded-2xl bg-white/80 p-3">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      주로 머문 활동
                    </span>
                    {toFriendlyActivityTitle(session.topActivityTitle)}
                  </p>
                  <p className="rounded-2xl bg-white/80 p-3">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      마지막 기록
                    </span>
                    {formatReportDate(session.lastEventAt ?? session.latestEventAt)}
                  </p>
                  <p className="rounded-2xl bg-white/80 p-3">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      마지막 응답
                    </span>
                    {session.lastResponse ?? "아직 제출 응답 없음"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivitySummaryBoard({
  activities,
}: {
  activities: TeacherReportSummary["activitySummaries"];
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              활동별 로그
            </p>
            <CardTitle className="mt-2">어느 블록에서 무엇이 쌓였는가</CardTitle>
          </div>
          <div className="grid size-11 place-items-center rounded-2xl bg-accent/15 text-accent-foreground">
            <ListChecks className="size-5" />
          </div>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          HTML 자료 안의 각 블록을 기준으로 조작, 제출, 힌트, 재시도, 완료를
          다시 묶었습니다. 다음 수업에서 어느 장면을 다시 보여줄지 고르기 위한 보드입니다.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 lg:grid-cols-2">
          {activities.map((activity) => (
            <article
              className="rounded-3xl border border-border bg-white/72 p-4"
              key={activity.activityId}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge>{blockTypeLabel(activity.blockType)}</Badge>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                    {toFriendlyActivityTitle(activity.title)}
                  </h3>
                </div>
                <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Activity className="size-4" />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                {activity.summary}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted">
                <span className="rounded-2xl bg-secondary/60 p-3">
                  세션 {activity.sessionCount}
                </span>
                <span className="rounded-2xl bg-secondary/60 p-3">
                  제출 {activity.submitCount}
                </span>
                <span className="rounded-2xl bg-secondary/60 p-3">
                  오답 {activity.incorrectSubmitCount}
                </span>
                <span className="rounded-2xl bg-secondary/60 p-3">
                  힌트 {activity.hintCount}
                </span>
                <span className="rounded-2xl bg-secondary/60 p-3">
                  재시도 {activity.retryCount}
                </span>
                <span className="rounded-2xl bg-secondary/60 p-3">
                  완료 {activity.completeCount}
                </span>
              </div>
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                {activity.nextAction}
              </p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TeacherReportView({ report }: TeacherReportViewProps) {
  const activityTitle = toFriendlyMaterialTitle(report.activityTitle);
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
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    size="sm"
                    variant="secondary"
                  >
                    <Link href={`/?reuseAssignmentId=${report.assignmentId}` as Route}>
                      다시 수정해서 쓰기
                    </Link>
                  </Button>
                  <GuidedTour
                    autoOpen
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    startLabel="리포트 읽는 법"
                    steps={teacherReportTourSteps}
                    storageKey="mathpro:tour:teacher-report"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {activityTitle}
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

        <section className="grid gap-6">
          <StudentSessionBoard sessions={report.sessionDetails} />
          <ActivitySummaryBoard activities={report.activitySummaries} />
        </section>
      </Container>
    </main>
  );
}
