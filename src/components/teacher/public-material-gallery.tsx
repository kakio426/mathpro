import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  CopyPlus,
  Eye,
  MonitorPlay,
  Sparkles,
  Users,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublishedAssignmentListItem } from "@/types/teacher";

export type PublicLibraryFilter = "all" | "preview" | "active";

type PublicMaterialGalleryProps = {
  assignments: PublishedAssignmentListItem[];
  loadError?: string | null;
  activeFilter?: PublicLibraryFilter;
};

const filterCopy = {
  all: "전체 자료",
  preview: "미리보기 가능",
  active: "바로 참여 가능",
} satisfies Record<PublicLibraryFilter, string>;

const difficultyLabels = {
  easy: "기초",
  standard: "표준",
  challenge: "도전",
} as const;

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function creatorNameFor(assignment: PublishedAssignmentListItem) {
  return assignment.creatorName ?? "수학프로 선생님";
}

export function filterPublicAssignments(
  assignments: PublishedAssignmentListItem[],
  filter: PublicLibraryFilter,
) {
  if (filter === "preview") {
    return assignments.filter((assignment) => assignment.hasHtmlArtifact);
  }

  if (filter === "active") {
    return assignments.filter((assignment) => assignment.status === "active");
  }

  return assignments;
}

function filterHref(filter: PublicLibraryFilter) {
  return filter === "all" ? "/library" : `/library?filter=${filter}`;
}

export function PublicMaterialGallery({
  assignments,
  loadError = null,
  activeFilter = "all",
}: PublicMaterialGalleryProps) {
  const visibleAssignments = filterPublicAssignments(assignments, activeFilter);
  const previewCount = assignments.filter(
    (assignment) => assignment.hasHtmlArtifact,
  ).length;
  const activeCount = assignments.filter(
    (assignment) => assignment.status === "active",
  ).length;

  return (
    <main className="relative isolate overflow-hidden py-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_16%_14%,rgba(15,118,110,0.22),transparent_32%),radial-gradient(circle_at_86%_10%,rgba(245,158,11,0.22),transparent_30%),linear-gradient(180deg,#fbf2df,transparent)]"
      />
      <Container className="max-w-[1500px] space-y-7">
        <section className="overflow-hidden rounded-[2.25rem] border border-border bg-[#12312e] p-5 text-white shadow-soft sm:p-7 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white">
                  공유 자료실
                </Badge>
                <Badge className="border-amber-200/40 bg-amber-300/15 text-amber-100">
                  미리보기 가능
                </Badge>
                <Badge className="border-white/20 bg-white/10 text-white">
                  NO LOGIN START
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-teal-100 uppercase">
                  MathPro Library
                </p>
                <h1 className="mt-3 max-w-4xl text-balance text-3xl font-semibold tracking-tight [word-break:keep-all] sm:text-5xl">
                  선생님들이 만든 움직이는 수업자료를 바로 열어보세요
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-teal-50/80 sm:text-base">
                  발행된 자료는 모두 이곳에 모입니다. 마음에 드는 자료는
                  미리보고, 복제해서 내 수업에 맞게 바꾸고, 참여 코드나 링크로
                  바로 학생에게 공유할 수 있습니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(filterCopy) as PublicLibraryFilter[]).map(
                  (filter) => (
                    <Button
                      asChild
                      className={
                        activeFilter === filter
                          ? undefined
                          : "border border-white/15 bg-white/10 text-white hover:bg-white/20"
                      }
                      key={filter}
                      size="sm"
                      variant={activeFilter === filter ? "secondary" : "ghost"}
                    >
                      <Link href={filterHref(filter) as Route}>
                        {filterCopy[filter]}
                      </Link>
                    </Button>
                  ),
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm text-teal-100/70">공개 자료</p>
                <p className="mt-2 text-4xl font-semibold">{assignments.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm text-teal-100/70">미리보기 가능</p>
                <p className="mt-2 text-4xl font-semibold">{previewCount}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm text-teal-100/70">바로 참여</p>
                <p className="mt-2 text-4xl font-semibold">{activeCount}</p>
              </div>
            </div>
          </div>
        </section>

        {loadError ? (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">공유 자료실을 불러오지 못했어요.</p>
            <p className="mt-1">{loadError}</p>
          </section>
        ) : null}

        {visibleAssignments.length === 0 ? (
          <Card className="rounded-[2rem] border-dashed bg-panel">
            <CardHeader className="items-center text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <BookOpenText className="size-6" />
              </div>
              <CardTitle className="mt-3">아직 공개된 자료가 없습니다</CardTitle>
            </CardHeader>
            <CardContent className="mx-auto max-w-xl space-y-5 text-center">
              <p className="text-sm leading-7 text-muted">
                첫 자료를 발행하면 공유 자료실에 자동으로 공개됩니다. 선택한
                조건에 맞는 자료가 없다면 전체 자료를 다시 열어보세요.
              </p>
              <Button asChild>
                <Link href={"/" as Route}>
                  첫 자료 만들기
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleAssignments.map((assignment) => (
              <Card
                className="group overflow-hidden rounded-[2rem] bg-[#fffaf0] transition hover:-translate-y-1 hover:shadow-soft"
                key={assignment.id}
              >
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent">참여 코드 {assignment.code}</Badge>
                    {assignment.hasHtmlArtifact ? (
                      <Badge className="bg-emerald-50 text-emerald-800">
                        미리보기 가능
                      </Badge>
                    ) : null}
                    <Badge>{assignment.gradeBand}학년군</Badge>
                    <Badge>{difficultyLabels[assignment.difficulty]}</Badge>
                  </div>
                  <div>
                    <CardTitle className="text-2xl leading-tight">
                      {assignment.title}
                    </CardTitle>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {assignment.goal}
                    </p>
                  </div>
                  <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/78 px-3 py-1 text-xs font-semibold text-muted">
                    <Users className="size-3.5 text-primary" />
                    만든 선생님 {creatorNameFor(assignment)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-3xl border border-border bg-white/76 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                      <Sparkles className="size-3.5" />
                      수업 활용
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground">
                      {assignment.teacherGuide ??
                        "학생이 먼저 조작해 본 뒤, 어떤 기준으로 선택했는지 말로 설명하게 해 보세요."}
                    </p>
                  </div>

                  {assignment.learningQuestions?.length ? (
                    <div className="grid gap-2 rounded-3xl bg-teal-50 px-4 py-3 text-sm leading-6 text-primary">
                      <p className="text-xs font-semibold tracking-[0.14em] text-primary/70 uppercase">
                        학습 질문
                      </p>
                      {assignment.learningQuestions.slice(0, 2).map((question) => (
                        <p key={question}>- {question}</p>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-3 gap-2 rounded-3xl bg-secondary/60 p-3 text-center text-xs font-semibold text-muted">
                    <span>
                      참여
                      <strong className="mt-1 block text-lg text-foreground">
                        {assignment.participantCount}
                      </strong>
                    </span>
                    <span>
                      완료
                      <strong className="mt-1 block text-lg text-foreground">
                        {assignment.completedCount}
                      </strong>
                    </span>
                    <span>
                      발행
                      <strong className="mt-1 block text-sm text-foreground">
                        {formatPublishedDate(assignment.publishedAt)}
                      </strong>
                    </span>
                  </div>

                  <div className="grid gap-2">
                    <Button asChild>
                      <Link
                        href={`/teacher/activities/${assignment.id}` as Route}
                      >
                        <Eye className="size-4" />
                        자료 미리보기
                      </Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link
                        href={`/?reuseAssignmentId=${assignment.id}` as Route}
                      >
                        <CopyPlus className="size-4" />
                        복제해서 내 자료로 만들기
                      </Link>
                    </Button>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button asChild variant="secondary">
                        <Link href={`/play/${assignment.code}` as Route}>
                          <MonitorPlay className="size-4" />
                          학생 참여 화면
                        </Link>
                      </Button>
                      <Button asChild variant="secondary">
                        <Link
                          href={`/teacher/assignments/${assignment.id}` as Route}
                        >
                          <BarChart3 className="size-4" />
                          결과 보기
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </Container>
    </main>
  );
}
