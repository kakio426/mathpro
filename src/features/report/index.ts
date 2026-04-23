import type {
  ContentBundle,
  LoadedActivitySpec,
  LoadedLessonSpec,
  MisconceptionRule,
} from "@/types/content";
import type {
  SessionReportSummary,
  TrackedSessionEventRecord,
} from "@/types/session";

export const REPORT_GENERATOR_VERSION = "s5-rules-v1";
export const NO_CLEAR_MISCONCEPTION_TEXT = "현재 뚜렷한 오개념 없음";
export const EXPLANATION_SUMMARY_FALLBACK =
  "아직 아이의 설명이 충분히 제출되지 않았습니다.";

const MISCONCEPTION_THRESHOLD = 3;
const SLOW_FIRST_SUBMIT_MS = 15_000;

type ActivitySubmitEvent = TrackedSessionEventRecord & {
  eventType: "submit" | "free-text-submit";
};

type ActivityDiagnosticFacts = {
  activityId: string;
  attemptCount: number;
  hintUsageCount: number;
  retryCount: number;
  finalCorrect: boolean | null;
  timeToFirstSubmitMs: number | null;
  latestExplanationText: string | null;
};

type MisconceptionObservation = {
  ruleId: string;
  score: number;
  diagnosisTextTemplate: string;
  nextLessonSlug?: string;
  activityIndex: number;
  ruleIndex: number;
};

function compareEvents(
  left: TrackedSessionEventRecord,
  right: TrackedSessionEventRecord,
) {
  const clientDiff =
    new Date(left.clientTs).getTime() - new Date(right.clientTs).getTime();

  if (clientDiff !== 0) {
    return clientDiff;
  }

  const receivedDiff =
    new Date(left.receivedAt).getTime() - new Date(right.receivedAt).getTime();

  if (receivedDiff !== 0) {
    return receivedDiff;
  }

  return left.id.localeCompare(right.id);
}

function isSubmitEvent(
  event: TrackedSessionEventRecord,
): event is ActivitySubmitEvent {
  return event.eventType === "submit" || event.eventType === "free-text-submit";
}

function readBooleanPayloadValue(
  event: TrackedSessionEventRecord,
  key: "isCorrect" | "isLengthValid",
) {
  const value = event.payload[key];
  return typeof value === "boolean" ? value : null;
}

function readStringPayloadValue(event: TrackedSessionEventRecord, key: "text") {
  const value = event.payload[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function buildActivityFacts(
  activity: LoadedActivitySpec,
  events: TrackedSessionEventRecord[],
): ActivityDiagnosticFacts {
  const orderedEvents = [...events].sort(compareEvents);
  const submitEvents = orderedEvents.filter(isSubmitEvent);
  const hintUsageCount = orderedEvents.filter(
    (event) => event.eventType === "hint-open",
  ).length;
  const retryCount = orderedEvents.filter(
    (event) => event.eventType === "retry",
  ).length;
  const firstInteraction = orderedEvents[0] ?? null;
  const firstSubmit = submitEvents[0] ?? null;
  const latestSubmit = submitEvents.at(-1) ?? null;

  let latestExplanationText: string | null = null;

  if (activity.kind === "free-text") {
    submitEvents.forEach((event) => {
      if (
        event.eventType === "free-text-submit" &&
        readBooleanPayloadValue(event, "isLengthValid")
      ) {
        latestExplanationText = readStringPayloadValue(event, "text");
      }
    });
  }

  let finalCorrect: boolean | null = null;

  if (latestSubmit) {
    finalCorrect =
      latestSubmit.eventType === "submit"
        ? readBooleanPayloadValue(latestSubmit, "isCorrect")
        : readBooleanPayloadValue(latestSubmit, "isLengthValid");
  }

  const timeToFirstSubmitMs =
    firstInteraction && firstSubmit
      ? Math.max(
          0,
          new Date(firstSubmit.clientTs).getTime() -
            new Date(firstInteraction.clientTs).getTime(),
        )
      : null;

  return {
    activityId: activity.id,
    attemptCount: submitEvents.length,
    hintUsageCount,
    retryCount,
    finalCorrect,
    timeToFirstSubmitMs,
    latestExplanationText,
  };
}

function scoreMisconception(
  rule: MisconceptionRule,
  facts: ActivityDiagnosticFacts,
) {
  let score = 0;

  if (rule.allowedSignals.includes("correctness") && facts.finalCorrect === false) {
    score += 3;
  }

  if (rule.allowedSignals.includes("attempt-count") && facts.attemptCount > 1) {
    score += Math.min(facts.attemptCount - 1, 2);
  }

  if (rule.allowedSignals.includes("hint-usage-count") && facts.hintUsageCount > 0) {
    score += 1;
  }

  if (
    rule.allowedSignals.includes("self-correction-after-retry") &&
    facts.retryCount > 0 &&
    facts.finalCorrect === true
  ) {
    score += 1;
  }

  if (
    rule.allowedSignals.includes("time-to-first-submit") &&
    facts.timeToFirstSubmitMs !== null &&
    facts.timeToFirstSubmitMs >= SLOW_FIRST_SUBMIT_MS
  ) {
    score += 1;
  }

  return score;
}

function findLessonOrThrow(bundle: ContentBundle, lessonSlug: string) {
  const lesson = bundle.lessons.find((entry) => entry.slug === lessonSlug);

  if (!lesson) {
    throw new Error(`Lesson "${lessonSlug}" is missing from the content bundle.`);
  }

  return lesson;
}

function collectMisconceptionObservations(
  lesson: LoadedLessonSpec,
  rulesById: Map<string, MisconceptionRule>,
  factsByActivityId: Map<string, ActivityDiagnosticFacts>,
) {
  const observations = new Map<string, MisconceptionObservation>();

  lesson.activities.forEach((activity, activityIndex) => {
    const facts =
      factsByActivityId.get(activity.id) ??
      buildActivityFacts(activity, []);

    activity.misconceptionRuleIds.forEach((ruleId, ruleIndex) => {
      const rule = rulesById.get(ruleId);

      if (!rule) {
        return;
      }

      const score = scoreMisconception(rule, facts);

      if (score <= 0) {
        return;
      }

      const current = observations.get(ruleId);

      if (!current) {
        observations.set(ruleId, {
          ruleId,
          score,
          diagnosisTextTemplate: rule.diagnosisTextTemplate,
          nextLessonSlug: rule.nextLessonSlug,
          activityIndex,
          ruleIndex,
        });
        return;
      }

      current.score += score;
      current.activityIndex = Math.min(current.activityIndex, activityIndex);
      current.ruleIndex =
        current.activityIndex === activityIndex
          ? Math.min(current.ruleIndex, ruleIndex)
          : current.ruleIndex;
    });
  });

  return [...observations.values()].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (left.activityIndex !== right.activityIndex) {
      return left.activityIndex - right.activityIndex;
    }

    return left.ruleIndex - right.ruleIndex;
  });
}

function pickRecommendation(
  bundle: ContentBundle,
  lesson: LoadedLessonSpec,
  strongObservations: MisconceptionObservation[],
) {
  const lessonsBySlug = new Map(
    bundle.lessons.map((entry) => [entry.slug, entry] as const),
  );
  const currentIndex = bundle.module.lessonOrder.findIndex(
    (slug) => slug === lesson.slug,
  );
  const strongestObservation = strongObservations[0] ?? null;

  if (strongestObservation?.nextLessonSlug) {
    const recommendedLesson = lessonsBySlug.get(strongestObservation.nextLessonSlug);

    if (recommendedLesson) {
      return {
        id: recommendedLesson.slug,
        title: recommendedLesson.title,
      };
    }
  }

  const nextLessonSlug =
    currentIndex >= 0 ? bundle.module.lessonOrder[currentIndex + 1] : undefined;

  if (nextLessonSlug) {
    const recommendedLesson = lessonsBySlug.get(nextLessonSlug);

    if (recommendedLesson) {
      return {
        id: recommendedLesson.slug,
        title: recommendedLesson.title,
      };
    }
  }

  return {
    id: lesson.slug,
    title: lesson.title,
  };
}

export function createSessionReportSummary({
  bundle,
  lessonSlug,
  events,
}: {
  bundle: ContentBundle;
  lessonSlug: string;
  events: TrackedSessionEventRecord[];
}): SessionReportSummary {
  const lesson = findLessonOrThrow(bundle, lessonSlug);
  const lessonActivityIds = new Set(lesson.activities.map((activity) => activity.id));
  const lessonEvents = events
    .filter((event) => lessonActivityIds.has(event.activityId))
    .sort(compareEvents);
  const rulesById = new Map(
    bundle.misconceptions.map((rule) => [rule.id, rule] as const),
  );
  const conceptsById = new Map(
    bundle.concepts.map((concept) => [concept.id, concept] as const),
  );
  const factsByActivityId = new Map(
    lesson.activities.map((activity) => [
      activity.id,
      buildActivityFacts(
        activity,
        lessonEvents.filter((event) => event.activityId === activity.id),
      ),
    ]),
  );
  const observations = collectMisconceptionObservations(
    lesson,
    rulesById,
    factsByActivityId,
  );
  const strongObservations = observations.filter(
    (observation) => observation.score >= MISCONCEPTION_THRESHOLD,
  );
  const explanationFacts = lesson.activities
    .filter((activity) => activity.stage === "explanation")
    .map((activity) => factsByActivityId.get(activity.id))
    .find(
      (facts): facts is ActivityDiagnosticFacts =>
        Boolean(facts?.latestExplanationText),
    );
  const recommendation = pickRecommendation(bundle, lesson, strongObservations);
  const understoodConcepts = lesson.conceptIds
    .map((conceptId) => conceptsById.get(conceptId)?.title)
    .filter((title): title is string => Boolean(title));

  return {
    understoodConcepts:
      understoodConcepts.length > 0 ? understoodConcepts : [lesson.title],
    watchMisconceptions:
      strongObservations.length > 0
        ? strongObservations.map(
            (observation) => observation.diagnosisTextTemplate,
          )
        : [NO_CLEAR_MISCONCEPTION_TEXT],
    explanationSummary:
      explanationFacts?.latestExplanationText ?? EXPLANATION_SUMMARY_FALLBACK,
    recommendedNextLessonId: recommendation.id,
    recommendedNextLessonTitle: recommendation.title,
  };
}

export type { ActivityDiagnosticFacts, MisconceptionObservation };
