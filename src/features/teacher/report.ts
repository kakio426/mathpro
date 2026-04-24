import type { JsonObject } from "@/types/session";
import type {
  ActivityBlock,
  PublishedAssignment,
  TeacherReportSummary,
} from "@/types/teacher";

export type TeacherAssignmentSessionRecord = {
  id: string;
  status: "started" | "completed" | "abandoned";
};

export type TeacherAssignmentEventRecord = {
  sessionId: string;
  activityId: string;
  eventType: string;
  payload: JsonObject;
  clientTs: string;
};

const SLOW_FIRST_SUBMIT_MS = 15_000;
const manipulationEventTypes = new Set([
  "interaction",
  "select",
  "drag-end",
  "drop",
]);
const submitEventTypes = new Set(["submit", "free-text-submit", "complete"]);

function compareEvents(
  left: TeacherAssignmentEventRecord,
  right: TeacherAssignmentEventRecord,
) {
  return new Date(left.clientTs).getTime() - new Date(right.clientTs).getTime();
}

function labelForBlock(blocks: ActivityBlock[], activityId: string) {
  const block = blocks.find(
    (entry) => entry.id === activityId || entry.sourceActivityId === activityId,
  );

  return block?.title ?? activityId;
}

function countBy<T>(items: T[], keyForItem: (item: T) => string | null) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const key = keyForItem(item);

    if (!key) {
      return;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  });
}

function readStringPayload(payload: JsonObject, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readBooleanPayload(payload: JsonObject, key: string) {
  const value = payload[key];
  return typeof value === "boolean" ? value : null;
}

function formatPayloadValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).join(", ");
  }

  return null;
}

function readResponseSummary(payload: JsonObject) {
  return (
    formatPayloadValue(payload.response) ??
    formatPayloadValue(payload.selectedParts) ??
    formatPayloadValue(payload.selectedStep) ??
    formatPayloadValue(payload.text)
  );
}

function uniqueCount(values: string[]) {
  return new Set(values).size;
}

function summarizeManipulationPatterns({
  blocks,
  events,
}: {
  blocks: ActivityBlock[];
  events: TeacherAssignmentEventRecord[];
}) {
  const interactiveEvents = events.filter((event) =>
    manipulationEventTypes.has(event.eventType),
  );

  if (interactiveEvents.length === 0) {
    return ["아직 학생 조작 이벤트가 충분히 쌓이지 않았습니다."];
  }

  return countBy(interactiveEvents, (event) => event.activityId)
    .slice(0, 3)
    .map(([activityId, count]) => {
      const activityEvents = events.filter((event) => event.activityId === activityId);
      const submitEvents = activityEvents.filter((event) =>
        submitEventTypes.has(event.eventType),
      );
      const completeCount = activityEvents.filter(
        (event) => event.eventType === "complete",
      ).length;
      const incorrectCount = submitEvents.filter(
        (event) =>
          readBooleanPayload(event.payload, "isCorrect") === false ||
          readBooleanPayload(event.payload, "isLengthValid") === false,
      ).length;
      const sessionCount = uniqueCount(
        activityEvents.map((event) => event.sessionId),
      );
      const lastResponse = [...submitEvents]
        .reverse()
        .map((event) => readResponseSummary(event.payload))
        .find((response): response is string => Boolean(response));
      const responseCopy = lastResponse ? ` 마지막 응답 예: ${lastResponse}.` : "";

      return `${labelForBlock(blocks, activityId)}: ${sessionCount}개 세션에서 선택/드래그/상호작용 ${count}회, 제출 ${submitEvents.length}회, 완료 ${completeCount}회가 기록되었습니다. 오답 제출은 ${incorrectCount}회입니다.${responseCopy}`;
    });
}

function summarizeDwellPatterns({
  blocks,
  sessions,
  events,
}: {
  blocks: ActivityBlock[];
  sessions: TeacherAssignmentSessionRecord[];
  events: TeacherAssignmentEventRecord[];
}) {
  const eventsBySessionAndActivity = new Map<
    string,
    TeacherAssignmentEventRecord[]
  >();

  events.forEach((event) => {
    const key = `${event.sessionId}:${event.activityId}`;
    const current = eventsBySessionAndActivity.get(key) ?? [];
    current.push(event);
    eventsBySessionAndActivity.set(key, current);
  });

  const slowActivityIds: string[] = [];

  eventsBySessionAndActivity.forEach((group) => {
    const ordered = [...group].sort(compareEvents);
    const firstEvent = ordered[0];
    const firstSubmit = ordered.find((event) =>
      submitEventTypes.has(event.eventType),
    );

    if (!firstEvent || !firstSubmit) {
      return;
    }

    const dwellMs =
      new Date(firstSubmit.clientTs).getTime() -
      new Date(firstEvent.clientTs).getTime();

    if (dwellMs >= SLOW_FIRST_SUBMIT_MS) {
      slowActivityIds.push(firstEvent.activityId);
    }
  });

  const slowSummaries = countBy(slowActivityIds, (activityId) => activityId).map(
    ([activityId, count]) =>
      `${labelForBlock(blocks, activityId)}: ${count}개 세션에서 첫 제출까지 15초 이상 머물렀습니다.`,
  );

  if (slowSummaries.length > 0) {
    return slowSummaries.slice(0, 3);
  }

  const incompleteCount = sessions.filter(
    (session) => session.status !== "completed",
  ).length;

  if (events.length > 0) {
    return [
      incompleteCount > 0
        ? `아직 오래 머문 블록은 뚜렷하지 않습니다. 다만 미완료 세션 ${incompleteCount}개는 이어서 확인하세요.`
        : "현재까지는 특정 블록에 오래 머문 신호가 뚜렷하지 않습니다.",
    ];
  }

  return ["아직 머문 시간 분석에 필요한 이벤트가 없습니다."];
}

function summarizeMisconceptionSignals({
  blocks,
  events,
}: {
  blocks: ActivityBlock[];
  events: TeacherAssignmentEventRecord[];
}) {
  const explicitSignals = countBy(events, (event) => {
    const signal = readStringPayload(event.payload, "misconceptionSignal");

    return signal ? `${event.activityId}::${signal}` : null;
  }).map(([key, count]) => {
    const [activityId, signal] = key.split("::");

    return `${labelForBlock(blocks, activityId ?? "")}: '${signal}' 신호가 ${count}회 관찰되었습니다.`;
  });

  if (explicitSignals.length > 0) {
    return explicitSignals.slice(0, 3);
  }

  const incorrectSubmitByActivity = countBy(events, (event) => {
    if (!submitEventTypes.has(event.eventType)) {
      return null;
    }

    const isIncorrect =
      readBooleanPayload(event.payload, "isCorrect") === false ||
      readBooleanPayload(event.payload, "isLengthValid") === false;

    return isIncorrect ? event.activityId : null;
  });
  const hintByActivity = countBy(events, (event) =>
    event.eventType === "hint-open" ? event.activityId : null,
  );
  const retryByActivity = countBy(events, (event) =>
    event.eventType === "retry" ? event.activityId : null,
  );
  const fallbackSignals: string[] = [];

  incorrectSubmitByActivity.slice(0, 2).forEach(([activityId, count]) => {
    fallbackSignals.push(
      `${labelForBlock(blocks, activityId)}: 제출에서 오답 신호 ${count}회가 관찰되었습니다.`,
    );
  });

  if (hintByActivity.length > 0) {
    const [activityId, count] = hintByActivity[0] ?? ["", 0];
    fallbackSignals.push(
      `${labelForBlock(blocks, activityId)}: 힌트 열람 ${count}회가 있어 개념 연결에서 멈춘 지점이 있을 수 있습니다.`,
    );
  }

  if (retryByActivity.length > 0) {
    const [activityId, count] = retryByActivity[0] ?? ["", 0];
    fallbackSignals.push(
      `${labelForBlock(blocks, activityId)}: 재시도 ${count}회가 있어 피드백 이후 자기 수정 과정을 확인할 수 있습니다.`,
    );
  }

  return fallbackSignals.length > 0
    ? fallbackSignals.slice(0, 3)
    : ["현재 뚜렷한 오개념 신호 없음"];
}

function summarizeNextTeachingMoves({
  manipulationPatterns,
  dwellPatterns,
  misconceptionSignals,
  eventCount,
}: {
  manipulationPatterns: string[];
  dwellPatterns: string[];
  misconceptionSignals: string[];
  eventCount: number;
}) {
  if (eventCount === 0) {
    return [
      "먼저 소수의 학생에게 배포해 조작 이벤트가 정상적으로 쌓이는지 확인하세요.",
    ];
  }

  const moves = [
    `${manipulationPatterns[0]} 이 장면을 다음 수업의 출발 질문으로 다시 보여주세요.`,
  ];

  if (!misconceptionSignals[0].includes("뚜렷한 오개념")) {
    moves.push(
      `${misconceptionSignals[0]} 이 신호를 중심으로 학생에게 왜 그렇게 조작했는지 말하게 해 보세요.`,
    );
  }

  if (!dwellPatterns[0].includes("뚜렷하지") && !dwellPatterns[0].includes("없습니다")) {
    moves.push(`${dwellPatterns[0]} 해당 블록은 교사가 시범 조작을 한 번 더 제공하는 것이 좋습니다.`);
  }

  return moves.slice(0, 3);
}

export function createTeacherReportSummary({
  assignment,
  sessions,
  events,
}: {
  assignment: PublishedAssignment;
  sessions: TeacherAssignmentSessionRecord[];
  events: TeacherAssignmentEventRecord[];
}): TeacherReportSummary {
  const orderedEvents = [...events].sort(compareEvents);
  const manipulationPatterns = summarizeManipulationPatterns({
    blocks: assignment.document.blocks,
    events: orderedEvents,
  });
  const dwellPatterns = summarizeDwellPatterns({
    blocks: assignment.document.blocks,
    sessions,
    events: orderedEvents,
  });
  const misconceptionSignals = summarizeMisconceptionSignals({
    blocks: assignment.document.blocks,
    events: orderedEvents,
  });

  return {
    assignmentId: assignment.id,
    code: assignment.code,
    activityTitle: assignment.document.title,
    participantCount: sessions.length,
    completedCount: sessions.filter((session) => session.status === "completed")
      .length,
    eventCount: orderedEvents.length,
    manipulationPatterns,
    dwellPatterns,
    misconceptionSignals,
    nextTeachingMoves: summarizeNextTeachingMoves({
      manipulationPatterns,
      dwellPatterns,
      misconceptionSignals,
      eventCount: orderedEvents.length,
    }),
  };
}
