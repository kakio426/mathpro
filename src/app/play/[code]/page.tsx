import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { LessonRunner } from "@/components/lesson-runner/lesson-runner";
import { HtmlArtifactRunner } from "@/components/teacher/html-artifact-runner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadLessonSpec } from "@/features/content";
import { createAppTeacherService, TeacherServiceError } from "@/features/teacher";
import type { PublishedAssignment } from "@/types/teacher";

export const dynamic = "force-dynamic";

type PlayAssignmentPageProps = {
  params: Promise<{ code: string }>;
};

export function isHtmlE2eFixtureEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.MATHPRO_E2E_FIXTURES === "1"
  );
}

function loadE2eHtmlAssignmentFixture(
  code: string,
): PublishedAssignment | null {
  if (!isHtmlE2eFixtureEnabled()) {
    return null;
  }

  if (code.toUpperCase() !== "HTML01") {
    return null;
  }

  const now = "2026-04-24T00:00:00.000Z";

  return {
    id: "assignment-html-e2e",
    activityId: "activity-html-e2e",
    code: "HTML01",
    status: "active",
    publishedAt: now,
    shareUrl: "http://127.0.0.1:3001/play/HTML01",
    document: {
      id: "activity-html-e2e",
      title: "분수 HTML 조작 자료",
      gradeBand: "3-4",
      concept: "분수의 의미",
      goal: "HTML 자료를 직접 조작하며 전체와 부분의 관계를 설명한다.",
      difficulty: "standard",
      sourceLessonSlug: "whole-and-part",
      status: "published",
      createdAt: now,
      updatedAt: now,
      blocks: [
        {
          id: "html-artifact-e2e",
          type: "html-artifact",
          title: "분수 막대 실험",
          instruction:
            "막대 조각을 눌러 선택하고, 완료 버튼으로 활동을 끝내 보세요.",
          interactionKind: "html-artifact",
          html: `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>수학프로 HTML E2E Fixture</title>
    <style>
      body {
        font-family: sans-serif;
        padding: 32px;
        background: #fff8e8;
        color: #2f2417;
      }
      button {
        display: block;
        margin: 12px 0;
        border: 2px solid #d18b20;
        border-radius: 16px;
        background: #fff;
        padding: 14px 18px;
        font-size: 18px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <h1>분수 막대 실험</h1>
    <p>전체를 같은 크기로 나눈 뒤 한 조각을 선택해 보세요.</p>
    <button type="button" id="select">첫 번째 조각 선택</button>
    <button type="button" id="complete">완료하기</button>
    <script>
      const source = "mathpro-html-activity";
      window.parent.postMessage({ source, eventType: "ready" }, "*");
      document.getElementById("select").addEventListener("click", () => {
        window.parent.postMessage({
          source,
          eventType: "select",
          payload: { selectedParts: [1], response: "1/4" }
        }, "*");
      });
      document.getElementById("complete").addEventListener("click", () => {
        window.parent.postMessage({
          source,
          eventType: "complete",
          payload: { isCorrect: true }
        }, "*");
      });
    </script>
  </body>
</html>`,
          allowedEvents: ["ready", "select", "submit", "complete"],
          safetyStatus: "passed",
          analysisHooks: [
            {
              id: "html-artifact-e2e:manipulation-pattern",
              signal: "manipulation-pattern",
              label: "HTML fixture 조작 패턴",
            },
          ],
        },
      ],
    },
  };
}

async function loadPlayAssignment(code: string) {
  const fixture = loadE2eHtmlAssignmentFixture(code);

  if (fixture) {
    return {
      assignment: fixture,
      lesson: loadLessonSpec(fixture.document.sourceLessonSlug),
    };
  }

  const teacherService = createAppTeacherService();
  const assignment = await teacherService.getAssignmentByCode(code);
  const lesson = loadLessonSpec(assignment.document.sourceLessonSlug);

  return {
    assignment,
    lesson,
  };
}

export default async function PlayAssignmentPage({
  params,
}: PlayAssignmentPageProps) {
  const { code } = await params;
  let loaded: Awaited<ReturnType<typeof loadPlayAssignment>>;

  try {
    loaded = await loadPlayAssignment(code);
  } catch (error) {
    if (error instanceof TeacherServiceError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const { assignment, lesson } = loaded;
  const htmlArtifactBlock = assignment.document.blocks.find(
    (block) => block.type === "html-artifact" && block.html,
  );

  return (
    <>
      <section className="pt-[var(--space-section)]">
        <Container className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="accent">참여 코드 {assignment.code}</Badge>
            <Badge>{assignment.document.gradeBand}학년군</Badge>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{assignment.document.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm leading-6 text-muted sm:grid-cols-3">
              <p>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em]">
                  개념
                </span>
                {assignment.document.concept}
              </p>
              <p>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em]">
                  목표
                </span>
                {assignment.document.goal}
              </p>
              <p>
                <span className="block text-xs font-semibold uppercase tracking-[0.16em]">
                  분석
                </span>
                블록별 조작, 힌트, 재시도, 설명을 기록합니다.
              </p>
            </CardContent>
          </Card>
        </Container>
      </section>
      {htmlArtifactBlock ? (
        <HtmlArtifactRunner
          assignment={assignment}
          block={htmlArtifactBlock}
        />
      ) : (
        <LessonRunner
          lesson={lesson}
          moduleTitle={`${assignment.document.title} | 수학프로 참여`}
          sessionStart={{
            key: `assignment:${assignment.code}`,
            endpoint: `/api/assignments/${assignment.code}/sessions`,
            body: {},
          }}
        />
      )}
    </>
  );
}
