import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { LessonRunner } from "@/components/lesson-runner/lesson-runner";
import {
  GuidedTour,
  type GuidedTourStep,
} from "@/components/onboarding/guided-tour";
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
import {
  toFriendlyConcept,
  toFriendlyMaterialTitle,
} from "@/features/teacher/display";
import type { PublishedAssignment } from "@/types/teacher";

export const dynamic = "force-dynamic";

type PlayAssignmentPageProps = {
  params: Promise<{ code: string }>;
};

const playTourSteps: GuidedTourStep[] = [
  {
    eyebrow: "학생 화면 안내",
    title: "참여 코드를 확인하고 바로 활동합니다",
    body: "이 화면은 학생이 링크나 참여 코드로 들어온 뒤 보는 활동 화면입니다. 상단에는 오늘 활동 이름과 간단한 목표만 보여줍니다.",
    detail:
      "학생에게는 제작 과정이나 어려운 설정을 보여주지 않고, 바로 조작 활동에 집중하게 합니다.",
  },
  {
    eyebrow: "활동 무대",
    title: "가운데 큰 영역이 학생이 직접 만지는 공간입니다",
    body: "학생은 버튼을 누르거나 조각을 선택하면서 개념을 탐구합니다. 수학프로는 정답만 보는 것이 아니라 어떤 순서로 만졌는지도 함께 기록합니다.",
    detail:
      "기록은 선생님이 나중에 '어디서 헷갈렸는지'를 볼 수 있도록 돕는 자료입니다.",
  },
  {
    eyebrow: "저장 상태",
    title: "활동 저장 상태는 필요한 때만 확인합니다",
    body: "화면 아래의 저장 상태는 평소에는 접혀 있습니다. 문제가 생겼을 때만 열어 보면 최근 조작 기록이 저장되고 있는지 확인할 수 있습니다.",
  },
  {
    eyebrow: "완료",
    title: "활동이 끝나면 리포트로 이어집니다",
    body: "학생이 활동을 완료하면 결과 화면으로 이동합니다. 이후 교사는 참여자들의 조작 흐름을 모아 수업 보완점을 확인할 수 있습니다.",
  },
];

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
      title: "분수 막대 조작 자료",
      gradeBand: "3-4",
      concept: "분수의 의미",
      goal: "막대를 직접 조작하며 전체와 부분의 관계를 설명한다.",
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
  const materialTitle = toFriendlyMaterialTitle(
    assignment.document.title,
    assignment.document.concept,
  );
  const friendlyConcept = toFriendlyConcept(assignment.document.concept);

  return (
    <>
      <section className="pt-6 sm:pt-8">
        <Container className="max-w-[1500px]">
          <Card className="overflow-hidden rounded-[2rem] bg-panel">
            <CardHeader className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">참여 코드 {assignment.code}</Badge>
                  <Badge>{assignment.document.gradeBand}학년군</Badge>
                  <Badge>조작 기록 저장</Badge>
                </div>
                <GuidedTour
                  autoOpen
                  startLabel="학생 화면 안내"
                  steps={playTourSteps}
                  storageKey="mathpro:tour:play"
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">
                    {materialTitle}
                  </CardTitle>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                    {assignment.document.goal}
                  </p>
                </div>
                <CardContent className="grid gap-3 p-0 text-sm leading-6 text-muted sm:grid-cols-2 lg:grid-cols-1">
                  <p className="rounded-2xl bg-white/70 p-4">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em]">
                      개념
                    </span>
                    {friendlyConcept}
                  </p>
                  <p className="rounded-2xl bg-white/70 p-4">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em]">
                      분석
                    </span>
                    조작, 힌트, 재시도, 제출 흐름을 기록합니다.
                  </p>
                </CardContent>
              </div>
            </CardHeader>
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
          moduleTitle={`${materialTitle} | 수학프로 참여`}
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
