import { loadLessonSpec } from "@/features/content";
import type { LoadedActivitySpec } from "@/types/content";
import type {
  ActivityBlock,
  CreateTeacherDraftRequest,
  HtmlArtifactEventType,
  InteractiveBlockKind,
  TeacherActivityDocument,
} from "@/types/teacher";
import { withHtmlArtifactSafety } from "./safety";

export const defaultHtmlArtifactEvents = [
  "ready",
  "interaction",
  "drag-end",
  "select",
  "hint-open",
  "retry",
  "submit",
  "complete",
] as const satisfies readonly HtmlArtifactEventType[];

function titleForActivity(activity: LoadedActivitySpec) {
  switch (activity.stage) {
    case "pre-diagnosis":
      return "출발점 확인";
    case "manipulation":
      return "직접 만져보는 탐구";
    case "prediction":
      return "결과 예상";
    case "explanation":
      return "내 말로 설명";
    case "generalization":
      return "다른 상황에 적용";
  }
}

function blockTypeForActivity(activity: LoadedActivitySpec): ActivityBlock["type"] {
  switch (activity.stage) {
    case "pre-diagnosis":
      return "intro";
    case "manipulation":
      return "manipulation";
    case "prediction":
      return "prediction";
    case "explanation":
      return "explanation";
    case "generalization":
      return "wrap-up";
  }
}

function interactionKindForActivity(
  activity: LoadedActivitySpec,
  requestedKind: InteractiveBlockKind,
): InteractiveBlockKind | undefined {
  if (activity.stage === "manipulation") {
    if (activity.kind === "fraction-bars" || activity.kind === "number-line") {
      return activity.kind;
    }

    return requestedKind;
  }

  if (activity.kind === "multiple-choice") {
    return "visual-choice";
  }

  return undefined;
}

function analysisHooksForActivity(activity: LoadedActivitySpec): ActivityBlock["analysisHooks"] {
  const hooks: ActivityBlock["analysisHooks"] = [
    {
      id: `${activity.id}:incorrect-final`,
      signal: "incorrect-final",
      label: "마지막 제출에서 개념 연결이 흔들림",
    },
  ];

  if (activity.stage === "manipulation") {
    hooks.push({
      id: `${activity.id}:manipulation-pattern`,
      signal: "manipulation-pattern",
      label: "조작 순서와 선택 패턴 관찰",
    });
  }

  hooks.push({
    id: `${activity.id}:slow-first-submit`,
    signal: "slow-first-submit",
    label: "첫 제출까지 오래 머무름",
  });

  return hooks;
}

function createHtmlArtifactBlock(
  input: CreateTeacherDraftRequest,
): ActivityBlock | null {
  if (!input.html) {
    return null;
  }

  return withHtmlArtifactSafety({
    id: "html-artifact-1",
    type: "html-artifact",
    title: `${input.concept} HTML 인터랙티브 자료`,
    instruction:
      "붙여넣은 HTML을 학생 화면에서 실행하고 postMessage 이벤트를 수집합니다.",
    interactionKind: input.interactionKind,
    html: input.html,
    allowedEvents: [...defaultHtmlArtifactEvents],
    analysisSchema: {
      collect: [
        "blockId",
        "eventType",
        "payload.isCorrect",
        "payload.response",
        "payload.misconceptionSignal",
      ],
    },
    promptTemplate: input.promptTemplate,
    safetyStatus: "unchecked",
    analysisHooks: [
      {
        id: "html-artifact-1:manipulation-pattern",
        signal: "manipulation-pattern",
        label: "HTML 활동 안에서 발생한 조작 순서와 선택 패턴",
      },
      {
        id: "html-artifact-1:retry-after-feedback",
        signal: "retry-after-feedback",
        label: "피드백 이후 재시도한 흔적",
      },
    ],
    teacherNotes:
      "HTML 내부에서 window.parent.postMessage로 수학프로 이벤트를 보내야 과정 분석이 가능합니다.",
  });
}

export function createTeacherActivityDraft(
  input: CreateTeacherDraftRequest,
): TeacherActivityDocument {
  const lesson = loadLessonSpec(input.sourceLessonSlug);
  const now = new Date().toISOString();
  const htmlArtifactBlock = createHtmlArtifactBlock(input);

  return {
    id: `draft-${crypto.randomUUID()}`,
    title: `${input.concept} 인터랙티브 탐구`,
    gradeBand: input.gradeBand,
    concept: input.concept,
    goal: input.goal,
    difficulty: input.difficulty,
    sourceLessonSlug: lesson.slug,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    blocks: htmlArtifactBlock
      ? [htmlArtifactBlock]
      : lesson.activities.map((activity) => ({
          id: activity.id,
          type: blockTypeForActivity(activity),
          title: titleForActivity(activity),
          instruction: activity.prompt,
          interactionKind: interactionKindForActivity(
            activity,
            input.interactionKind,
          ),
          sourceActivityId: activity.id,
          analysisHooks: analysisHooksForActivity(activity),
          teacherNotes:
            activity.stage === "manipulation"
              ? "학생이 선택을 바꾸는 순서와 힌트 사용 여부를 함께 봅니다."
              : undefined,
        })),
  };
}
