import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Eye,
  FilePlus2,
  MonitorPlay,
  Users,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { AssignmentShareCard } from "@/components/teacher/assignment-share-card";
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
  toFriendlyConcept,
  toFriendlyMaterialTitle,
} from "@/features/teacher/display";
import type { PublishedAssignmentListItem } from "@/types/teacher";

export type TeacherAssignmentListMode = "library" | "distribution" | "reports";

type TeacherActivityListProps = {
  assignments: PublishedAssignmentListItem[];
  loadError?: string | null;
  mode?: TeacherAssignmentListMode;
};

const difficultyLabels = {
  easy: "기초",
  standard: "표준",
  challenge: "도전",
} as const;

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: PublishedAssignmentListItem["status"]) {
  return status === "active" ? "배포 중" : "종료됨";
}

function completionRate(assignment: PublishedAssignmentListItem) {
  if (assignment.participantCount === 0) {
    return 0;
  }

  return Math.round(
    (assignment.completedCount / assignment.participantCount) * 100,
  );
}

const modeCopy = {
  library: {
    badge: "내 자료",
    accent: "발행 자료 관리",
    title: "다시 꺼내 쓰는 수업자료 보관함",
    description:
      "발행한 자료의 참여 코드, 학생 링크, 결과 리포트를 한곳에서 확인합니다. 수업 직전에도 여기서 바로 공유할 수 있습니다.",
    totalLabel: "총 발행 자료",
    helper: "발행한 자료를 모두 모아 보여줍니다.",
    emptyTitle: "아직 발행한 자료가 없습니다",
    emptyDescription:
      "제작실에서 움직이는 수업자료를 만들고 발행하면, 이곳에서 참여 코드, 학생 링크, 결과 리포트 링크를 다시 확인할 수 있습니다.",
  },
  distribution: {
    badge: "배포/참여",
    accent: "교실 공유 보드",
    title: "수업 직전에 바로 공유하는 배포 보드",
    description:
      "활성화된 참여 코드와 학생 링크를 빠르게 꺼내 교실 화면, 메신저, 학급 플랫폼에 공유합니다.",
    totalLabel: "공유 가능한 자료",
    helper: "참여 코드와 학생 링크를 다시 찾기 쉬운 순서로 보여줍니다.",
    emptyTitle: "아직 공유할 자료가 없습니다",
    emptyDescription:
      "자료를 발행하면 참여 코드와 학생 링크가 이곳에 모입니다. 수업 중에는 이 화면만 열어도 바로 배포할 수 있습니다.",
  },
  reports: {
    badge: "결과 보기",
    accent: "과정 리포트",
    title: "학생 조작 흐름을 다시 읽는 결과 보드",
    description:
      "각 자료별 참여 수, 완료 수, 교사 리포트 링크를 확인하고 다음 수업 보완점으로 이어갑니다.",
    totalLabel: "리포트 자료",
    helper: "결과 보기는 발행된 자료별 리포트 입구를 제공합니다.",
    emptyTitle: "아직 확인할 결과가 없습니다",
    emptyDescription:
      "학생이 참여한 자료가 생기면 이곳에서 결과 리포트로 이동할 수 있습니다. 먼저 자료를 만들고 참여 코드를 공유해 보세요.",
  },
} satisfies Record<
  TeacherAssignmentListMode,
  {
    badge: string;
    accent: string;
    title: string;
    description: string;
    totalLabel: string;
    helper: string;
    emptyTitle: string;
    emptyDescription: string;
  }
>;

function EmptyState({ mode }: { mode: TeacherAssignmentListMode }) {
  const copy = modeCopy[mode];

  return (
    <Card className="rounded-[2rem] border-dashed bg-panel">
      <CardHeader className="items-center text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <FilePlus2 className="size-6" />
        </div>
        <CardTitle className="mt-3">{copy.emptyTitle}</CardTitle>
      </CardHeader>
      <CardContent className="mx-auto max-w-xl space-y-5 text-center">
        <p className="text-sm leading-7 text-muted">
          {copy.emptyDescription}
        </p>
        <Button asChild>
          <Link href={"/" as Route}>
            첫 자료 만들기
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ClosedParticipationPill() {
  return (
    <div className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-white/65 px-5 text-sm font-semibold text-muted">
      <MonitorPlay className="size-4" />
      참여 종료됨
    </div>
  );
}

function StudentParticipationAction({
  assignment,
  label = "학생 링크 열기",
  variant = "secondary",
}: {
  assignment: PublishedAssignmentListItem;
  label?: string;
  variant?: "default" | "secondary";
}) {
  if (assignment.status !== "active") {
    return <ClosedParticipationPill />;
  }

  return (
    <Button asChild variant={variant}>
      <Link href={`/play/${assignment.code}` as Route}>
        <MonitorPlay className="size-4" />
        {label}
      </Link>
    </Button>
  );
}

function DistributionQuickGuide() {
  return (
    <div className="grid gap-3 rounded-3xl border border-teal-100 bg-teal-50/80 p-4 text-sm leading-6 text-primary md:grid-cols-3">
      <p>
        <span className="block text-xs font-semibold tracking-[0.14em] uppercase text-primary/70">
          1. 화면에 띄우기
        </span>
        QR과 참여 코드를 교실 화면에 크게 보여주세요.
      </p>
      <p>
        <span className="block text-xs font-semibold tracking-[0.14em] uppercase text-primary/70">
          2. 링크 공유
        </span>
        학급 채팅방에는 링크 복사를 눌러 바로 보냅니다.
      </p>
      <p>
        <span className="block text-xs font-semibold tracking-[0.14em] uppercase text-primary/70">
          3. 결과 확인
        </span>
        수업 후 결과 보기에서 조작 흐름을 확인합니다.
      </p>
    </div>
  );
}

function ReportProgressPanel({
  assignment,
}: {
  assignment: PublishedAssignmentListItem;
}) {
  const rate = completionRate(assignment);

  return (
    <div className="grid gap-4 rounded-3xl border border-border bg-white/75 p-4 md:grid-cols-[1fr_1fr_1.4fr] md:items-center">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          참여
        </p>
        <p className="mt-1 text-3xl font-semibold text-foreground">
          {assignment.participantCount}
          <span className="ml-1 text-base text-muted">명</span>
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          완료
        </p>
        <p className="mt-1 text-3xl font-semibold text-foreground">
          {assignment.completedCount}
          <span className="ml-1 text-base text-muted">명</span>
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            완료율
          </p>
          <p className="text-sm font-semibold text-foreground">{rate}%</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${rate}%` }}
          />
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">
          결과 보기를 열면 학생별 조작 흐름과 다음 수업 보완점을 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export function TeacherActivityList({
  assignments,
  loadError = null,
  mode = "library",
}: TeacherActivityListProps) {
  const copy = modeCopy[mode];

  return (
    <main className="relative isolate overflow-hidden py-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_18%_18%,rgba(15,118,110,0.18),transparent_32%),radial-gradient(circle_at_84%_8%,rgba(245,158,11,0.2),transparent_30%)]"
      />
      <Container className="max-w-[1400px] space-y-6">
        <section className="rounded-[2rem] border border-border bg-[#12312e] p-5 text-white shadow-soft sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white">
                  {copy.badge}
                </Badge>
                <Badge className="border-amber-200/40 bg-amber-300/15 text-amber-100">
                  {copy.accent}
                </Badge>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                  {copy.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-teal-50/80 sm:text-base">
                  {copy.description}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6">
              <p className="text-teal-100/70">{copy.totalLabel}</p>
              <p className="mt-2 text-4xl font-semibold">{assignments.length}</p>
            </div>
          </div>
        </section>

        {loadError ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">자료 목록을 불러오지 못했어요.</p>
            <p className="mt-1">{loadError}</p>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted">
            {copy.helper}
          </p>
          <Button asChild>
            <Link href={"/" as Route}>
              새 자료 만들기
              <FilePlus2 className="size-4" />
            </Link>
          </Button>
        </div>

        {assignments.length === 0 ? (
          <EmptyState mode={mode} />
        ) : (
          <section className="grid gap-4">
            {assignments.map((assignment) => {
              const showShareCard =
                mode !== "reports" && assignment.status === "active";
              const friendlyConcept = toFriendlyConcept(assignment.concept);
              const friendlyTitle = toFriendlyMaterialTitle(
                assignment.title,
                assignment.concept,
              );
              const friendlyPreviewTitle = assignment.previewBlockTitle
                ? toFriendlyActivityTitle(
                    assignment.previewBlockTitle,
                    assignment.concept,
                  )
                : null;

              return (
              <Card
                className="overflow-hidden rounded-[1.75rem]"
                key={assignment.id}
              >
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="accent">참여 코드 {assignment.code}</Badge>
                        <Badge>{statusLabel(assignment.status)}</Badge>
                        <Badge>{assignment.gradeBand}학년군</Badge>
                        <Badge>{difficultyLabels[assignment.difficulty]}</Badge>
                      </div>
                      <div>
                        <CardTitle className="text-2xl">
                          {friendlyTitle}
                        </CardTitle>
                        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
                          {assignment.goal}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-1 text-xs font-semibold text-muted">
                          <Users className="size-3.5 text-primary" />
                          만든 선생님{" "}
                          {assignment.creatorName ?? "수학프로 선생님"}
                        </p>
                        {mode === "library" && assignment.teacherGuide ? (
                          <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                            <span className="mb-1 block text-xs font-semibold tracking-[0.14em] text-amber-700 uppercase">
                              수업 활용
                            </span>
                            {assignment.teacherGuide}
                          </p>
                        ) : null}
                        {mode === "library" && assignment.learningQuestions?.length ? (
                          <div className="mt-3 grid gap-2 rounded-2xl bg-teal-50 px-4 py-3 text-sm leading-6 text-primary">
                            <span className="text-xs font-semibold tracking-[0.14em] text-primary/70 uppercase">
                              학습 질문
                            </span>
                            {assignment.learningQuestions
                              .slice(0, 2)
                              .map((question) => (
                                <p key={question}>- {question}</p>
                              ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-2 rounded-2xl bg-secondary/60 p-4 text-sm text-muted sm:grid-cols-3 lg:min-w-[360px]">
                      <span className="flex items-center gap-2">
                        <ClipboardList className="size-4 text-primary" />
                        {assignment.hasHtmlArtifact
                          ? friendlyPreviewTitle ?? "미리보기 가능"
                          : `${assignment.blockCount}개 블록`}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="size-4 text-primary" />
                        참여 {assignment.participantCount}
                      </span>
                      <span className="flex items-center gap-2">
                        <BarChart3 className="size-4 text-primary" />
                        완료 {assignment.completedCount}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showShareCard ? (
                    <AssignmentShareCard
                      code={assignment.code}
                      compact
                      shareUrl={assignment.shareUrl}
                      title="교실 공유"
                    />
                  ) : mode === "reports" ? null : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                      학생 참여가 종료된 자료입니다. 자료를 다시 쓰려면 복제해서
                      새 참여 코드를 만들어 주세요.
                    </div>
                  )}
                  {mode === "distribution" && assignment.status === "active" ? (
                    <DistributionQuickGuide />
                  ) : null}
                  {mode === "reports" ? (
                    <ReportProgressPanel assignment={assignment} />
                  ) : null}
                  <div className="grid gap-3 text-sm leading-6 text-muted md:grid-cols-[1fr_1fr_auto] md:items-center">
                    <p className="rounded-2xl bg-white/70 px-4 py-3">
                      <span className="block text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                        개념
                      </span>
                      {friendlyConcept}
                    </p>
                    <p className="rounded-2xl bg-white/70 px-4 py-3">
                      <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                        <CalendarDays className="size-3.5" />
                        발행일
                      </span>
                      {formatPublishedDate(assignment.publishedAt)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mode === "reports" ? (
                        <Button asChild>
                          <Link
                            href={`/teacher/assignments/${assignment.id}` as Route}
                          >
                            <BarChart3 className="size-4" />
                            결과 보기
                          </Link>
                        </Button>
                      ) : null}
                      {mode === "distribution" ? (
                        <StudentParticipationAction
                          assignment={assignment}
                          label="학생 링크 열기"
                          variant="default"
                        />
                      ) : null}
                      <Button
                        asChild
                        variant={mode === "library" ? "default" : "secondary"}
                      >
                        <Link
                          href={`/teacher/activities/${assignment.id}` as Route}
                        >
                          <Eye className="size-4" />
                          자료 보기
                        </Link>
                      </Button>
                      {mode === "library" ? (
                        <StudentParticipationAction assignment={assignment} />
                      ) : null}
                      {mode !== "reports" ? (
                        <Button asChild>
                          <Link
                            href={`/teacher/assignments/${assignment.id}` as Route}
                          >
                            <BarChart3 className="size-4" />
                            결과 보기
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild variant="secondary">
                        <Link
                          href={`/?reuseAssignmentId=${assignment.id}` as Route}
                        >
                          <FilePlus2 className="size-4" />
                          복제해서 수정
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </section>
        )}
      </Container>
    </main>
  );
}
