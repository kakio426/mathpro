import Link from "next/link";
import type { Route } from "next";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CopyPlus,
  MonitorPlay,
  PlayCircle,
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
  toFriendlyHtmlArtifactSource,
  toFriendlyMaterialTitle,
} from "@/features/teacher/display";
import type { ActivityBlock, PublishedAssignment } from "@/types/teacher";

type TeacherActivityPreviewProps = {
  assignment: PublishedAssignment;
};

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function findPreviewBlock(
  assignment: PublishedAssignment,
): ActivityBlock | undefined {
  return assignment.document.blocks.find(
    (block) => block.type === "html-artifact" && block.html,
  );
}

export function TeacherActivityPreview({
  assignment,
}: TeacherActivityPreviewProps) {
  const document = assignment.document;
  const previewBlock = findPreviewBlock(assignment);
  const learningQuestions = document.learningQuestions?.slice(0, 3) ?? [];
  const materialTitle = toFriendlyMaterialTitle(document.title, document.concept);
  const previewTitle = previewBlock
    ? toFriendlyActivityTitle(previewBlock.title, document.concept)
    : "미리보기 가능한 학생 화면이 없습니다";
  const previewSource = previewBlock?.html
    ? toFriendlyHtmlArtifactSource(previewBlock.html, document.concept)
    : "";

  return (
    <main className="relative isolate overflow-hidden py-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_18%_18%,rgba(15,118,110,0.18),transparent_32%),radial-gradient(circle_at_84%_8%,rgba(245,158,11,0.2),transparent_30%)]"
      />
      <Container className="max-w-[1500px] space-y-6">
        <section className="rounded-[2rem] border border-border bg-[#12312e] p-5 text-white shadow-soft sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white">
                  내 자료
                </Badge>
                <Badge className="border-amber-200/40 bg-amber-300/15 text-amber-100">
                  참여 코드 {assignment.code}
                </Badge>
                <Badge className="border-white/20 bg-white/10 text-white">
                  저장 완료
                </Badge>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                  {materialTitle}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-teal-50/80 sm:text-base">
                  {document.goal}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6">
              <p className="flex items-center gap-2 text-teal-100/70">
                <CalendarDays className="size-4" />
                발행일
              </p>
              <p className="mt-2 font-semibold">
                {formatPublishedDate(assignment.publishedAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="overflow-hidden rounded-[2rem] bg-[#fefbf5]">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">교사용 미리보기</Badge>
                  <Badge className="bg-emerald-50 text-emerald-800">
                    태블릿/컴퓨터 기준
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-2xl">
                  {previewTitle}
                </CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted">
                  이 화면은 선생님 확인용입니다. 실제 수업에서 많이 쓰는 태블릿, 노트북, 전자칠판 비율에 가깝게 보여주며 학생 참여 세션을 만들거나 조작 기록을 저장하지 않습니다.
                </p>
              </div>
              {previewBlock ? (
                <Badge className="bg-emerald-50 text-emerald-800">
                  미리보기 가능
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              {previewBlock?.html ? (
                <div className="overflow-hidden rounded-[1.6rem] border border-border bg-white shadow-soft">
                  <iframe
                    allow=""
                    className="h-[min(72vh,780px)] min-h-[560px] w-full bg-white"
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts"
                    srcDoc={previewSource}
                    title={`${previewTitle} 교사용 미리보기`}
                  />
                </div>
              ) : (
                <div className="grid min-h-[420px] place-items-center rounded-[1.6rem] border border-dashed border-border bg-white/72 p-8 text-center">
                  <div className="max-w-md space-y-3">
                    <MonitorPlay className="mx-auto size-10 text-primary" />
                    <p className="text-lg font-semibold text-foreground">
                      미리보기 가능한 학생 화면이 없습니다
                    </p>
                    <p className="text-sm leading-6 text-muted">
                      이 자료는 HTML 수업자료가 아니라 기본 lesson 블록으로 저장되어 있습니다. 학생 참여 화면에서 실행 상태를 확인해 주세요.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="space-y-5">
            <Card className="rounded-[1.75rem] bg-panel">
              <CardHeader>
                <Badge variant="accent">자료 정보</Badge>
                <CardTitle className="mt-2 text-xl">수업에서 이렇게 활용하세요</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted">
                <p className="rounded-2xl bg-white/72 px-4 py-3 text-foreground">
                  {document.teacherGuide ??
                    "학생이 먼저 조작해 본 뒤, 어떤 기준으로 선택했는지 말로 설명하게 해 보세요."}
                </p>
                <div className="grid gap-3 rounded-2xl bg-white/72 px-4 py-3">
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    <BookOpenCheck className="size-4 text-primary" />
                    학습 질문
                  </p>
                  {learningQuestions.length > 0 ? (
                    <ol className="space-y-2">
                      {learningQuestions.map((question, index) => (
                        <li className="flex gap-2" key={question}>
                          <span className="font-mono text-xs text-muted">
                            {index + 1}
                          </span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>
                      아직 저장된 학습 질문이 없습니다. 다음에 자료를 만들 때 Gemini 답변 전체를 붙여넣으면 자동으로 질문을 분리해 저장합니다.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <AssignmentShareCard
              code={assignment.code}
              compact
              shareUrl={assignment.shareUrl}
              title="학생 배포"
            />

            <Card className="rounded-[1.75rem] bg-panel">
              <CardContent className="grid gap-2 p-4">
                <Button asChild>
                  <Link href={`/play/${assignment.code}` as Route}>
                    <PlayCircle className="size-4" />
                    학생 참여 화면 열기
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/?reuseAssignmentId=${assignment.id}` as Route}>
                    <CopyPlus className="size-4" />
                    복제해서 수정
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/teacher/assignments/${assignment.id}` as Route}>
                    <BarChart3 className="size-4" />
                    결과 보기
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </section>
      </Container>
    </main>
  );
}
