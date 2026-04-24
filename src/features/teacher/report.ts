import type { JsonObject } from "@/types/session";
import type {
  ActivityBlock,
  PublishedAssignment,
  TeacherReportSummary,
} from "@/types/teacher";

export type TeacherAssignmentSessionRecord = {
  id: string;
  status: "started" | "completed" | "abandoned";
  startedAt?: string | null;
  completedAt?: string | null;
  latestEventAt?: string | null;
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

function teacherFacingBlockTitle(blocks: ActivityBlock[], activityId: string) {
  return labelForBlock(blocks, activityId).replace(/\s*HTML\s*자료$/i, " 자료");
}

function describeMisconceptionSignal(signal: string | undefined) {
  switch (signal) {
    case "selected-parts-mismatch":
      return "선택한 조각 수와 목표 분수가 맞지 않음";
    case "number-line-spacing":
      return "수직선의 같은 간격을 세는 기준이 흔들림";
    case "different-whole-direct-compare":
      return "전체가 다른 상황에서 분수만 보고 바로 비교함";
    case "symbol-meaning-mismatch":
      return "분모와 분자의 의미를 서로 바꾸어 생각함";
    default:
      return signal ? `추가 확인이 필요한 신호(${signal})` : "추가 확인이 필요한 신호";
  }
}

function sentenceWithLastResponse(response: string | undefined) {
  return response ? ` 마지막 응답은 "${response}"입니다.` : "";
}

function blockMatchesActivity(block: ActivityBlock, activityId: string) {
  return block.id === activityId || block.sourceActivityId === activityId;
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

function groupBySession(events: TeacherAssignmentEventRecord[]) {
  const groups = new Map<string, TeacherAssignmentEventRecord[]>();

  events.forEach((event) => {
    const current = groups.get(event.sessionId) ?? [];
    current.push(event);
    groups.set(event.sessionId, current);
  });

  return groups;
}

function countEventType(
  events: TeacherAssignmentEventRecord[],
  predicate: (event: TeacherAssignmentEventRecord) => boolean,
) {
  return events.filter(predicate).length;
}

function countIncorrectSubmits(events: TeacherAssignmentEventRecord[]) {
  return countEventType(events, (event) => {
    if (!submitEventTypes.has(event.eventType)) {
      return false;
    }

    return (
      readBooleanPayload(event.payload, "isCorrect") === false ||
      readBooleanPayload(event.payload, "isLengthValid") === false
    );
  });
}

function findLastResponse(events: TeacherAssignmentEventRecord[]) {
  return [...events]
    .reverse()
    .map((event) => readResponseSummary(event.payload))
    .find((response): response is string => Boolean(response)) ?? null;
}

function mostActiveActivityTitle({
  blocks,
  events,
}: {
  blocks: ActivityBlock[];
  events: TeacherAssignmentEventRecord[];
}) {
  if (events.length === 0) {
    return "아직 활동 전";
  }

  const [activityId] = countBy(events, (event) => event.activityId)[0] ?? [];

  return activityId ? labelForBlock(blocks, activityId) : "아직 활동 전";
}

function buildSessionObservation({
  session,
  events,
  incorrectSubmitCount,
  hintCount,
  retryCount,
}: {
  session: TeacherAssignmentSessionRecord;
  events: TeacherAssignmentEventRecord[];
  incorrectSubmitCount: number;
  hintCount: number;
  retryCount: number;
}) {
  if (events.length === 0) {
    return session.status === "completed"
      ? "완료 세션이지만 아직 조작 기록이 없습니다. 실행 자료의 기록 연결을 확인해 보세요."
      : "아직 조작 기록이 없습니다. 학생이 활동에 들어왔지만 본격적으로 만지기 전일 수 있습니다.";
  }

  if (incorrectSubmitCount > 0) {
    return `맞지 않은 제출이 ${incorrectSubmitCount}번 있었습니다. 정답을 바로 알려주기보다 "왜 그 위치나 조각을 골랐니?"라고 물어보면 선택 기준을 확인할 수 있습니다.`;
  }

  if (hintCount > 0 || retryCount > 0) {
    return `힌트 ${hintCount}번, 다시 시도 ${retryCount}번이 남아 있습니다. 피드백을 보고 스스로 고쳐 가는 장면으로 읽을 수 있습니다.`;
  }

  if (session.status === "completed") {
    return "큰 막힘 없이 끝까지 활동했습니다. 다음에는 같은 개념을 다른 예시로 바꾸어 설명하게 해 보세요.";
  }

  return "진행 중인 세션입니다. 마지막 조작 이후 활동을 이어갈 수 있는지 확인하세요.";
}

function createSessionDetails({
  blocks,
  sessions,
  events,
}: {
  blocks: ActivityBlock[];
  sessions: TeacherAssignmentSessionRecord[];
  events: TeacherAssignmentEventRecord[];
}) {
  const eventsBySession = groupBySession(events);

  return sessions.map((session, index) => {
    const sessionEvents = [...(eventsBySession.get(session.id) ?? [])].sort(
      compareEvents,
    );
    const submitCount = countEventType(sessionEvents, (event) =>
      submitEventTypes.has(event.eventType),
    );
    const incorrectSubmitCount = countIncorrectSubmits(sessionEvents);
    const hintCount = countEventType(
      sessionEvents,
      (event) => event.eventType === "hint-open",
    );
    const retryCount = countEventType(
      sessionEvents,
      (event) => event.eventType === "retry",
    );

    return {
      sessionId: session.id,
      label: `참여자 ${index + 1}`,
      status: session.status,
      startedAt: session.startedAt ?? null,
      completedAt: session.completedAt ?? null,
      latestEventAt: session.latestEventAt ?? null,
      eventCount: sessionEvents.length,
      submitCount,
      incorrectSubmitCount,
      hintCount,
      retryCount,
      firstEventAt: sessionEvents[0]?.clientTs ?? null,
      lastEventAt: sessionEvents.at(-1)?.clientTs ?? null,
      topActivityTitle: mostActiveActivityTitle({
        blocks,
        events: sessionEvents,
      }),
      lastResponse: findLastResponse(sessionEvents),
      observation: buildSessionObservation({
        session,
        events: sessionEvents,
        incorrectSubmitCount,
        hintCount,
        retryCount,
      }),
    };
  });
}

function createActivitySummaries({
  blocks,
  events,
}: {
  blocks: ActivityBlock[];
  events: TeacherAssignmentEventRecord[];
}) {
  return blocks.map((block) => {
    const blockEvents = events
      .filter((event) => blockMatchesActivity(block, event.activityId))
      .sort(compareEvents);
    const sessionCount = uniqueCount(
      blockEvents.map((event) => event.sessionId),
    );
    const submitCount = countEventType(blockEvents, (event) =>
      submitEventTypes.has(event.eventType),
    );
    const incorrectSubmitCount = countIncorrectSubmits(blockEvents);
    const hintCount = countEventType(
      blockEvents,
      (event) => event.eventType === "hint-open",
    );
    const retryCount = countEventType(
      blockEvents,
      (event) => event.eventType === "retry",
    );
    const completeCount = countEventType(
      blockEvents,
      (event) => event.eventType === "complete",
    );

    let summary = "아직 이 블록에서 기록된 조작이 없습니다.";
    let nextAction = "학생에게 이 블록에서 무엇을 눌러 보고 관찰해야 하는지 한 문장으로 안내해 주세요.";

    if (blockEvents.length > 0) {
      summary = `학생 ${sessionCount}명이 이 장면을 지나갔고, 조작 기록 ${blockEvents.length}번, 제출 ${submitCount}번, 완료 ${completeCount}번이 남았습니다.`;

      if (incorrectSubmitCount > 0) {
        nextAction = "맞지 않은 제출이 나온 장면을 다시 보여주고, 학생에게 \"무엇을 기준으로 골랐니?\"를 짧게 말하게 해 보세요.";
      } else if (hintCount > 0 || retryCount > 0) {
        nextAction = "힌트나 다시 시도가 나온 지점은 교사가 30초 정도 시범 조작을 보여준 뒤 같은 활동을 다시 맡기면 좋습니다.";
      } else if (completeCount === 0) {
        nextAction = "조작은 있었지만 완료가 적습니다. 활동을 마치는 버튼이나 마지막 질문 위치를 수업 전에 한 번 더 알려 주세요.";
      } else {
        nextAction = "현재 흐름은 안정적입니다. 다음 수업에서는 숫자나 그림만 바꾸어 같은 개념을 한 번 더 적용해 보세요.";
      }
    }

    return {
      activityId: block.id,
      title: block.title,
      blockType: block.type,
      eventCount: blockEvents.length,
      sessionCount,
      submitCount,
      incorrectSubmitCount,
      hintCount,
      retryCount,
      completeCount,
      firstEventAt: blockEvents[0]?.clientTs ?? null,
      lastEventAt: blockEvents.at(-1)?.clientTs ?? null,
      summary,
      nextAction,
    };
  });
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
      const responseCopy = sentenceWithLastResponse(lastResponse);
      const incorrectCopy =
        incorrectCount > 0
          ? ` 맞지 않은 제출이 ${incorrectCount}번 있어 선택 기준을 다시 확인할 만합니다.`
          : " 맞지 않은 제출은 아직 뚜렷하지 않습니다.";

      return `${teacherFacingBlockTitle(blocks, activityId)}에서 학생 ${sessionCount}명이 ${count}번 직접 만졌고, 제출 ${submitEvents.length}번과 완료 ${completeCount}번이 남았습니다.${incorrectCopy}${responseCopy}`;
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
      `${teacherFacingBlockTitle(blocks, activityId)}에서 첫 제출까지 15초 이상 머문 학생이 ${count}명 있습니다. 이 장면은 기준을 정하는 데 시간이 걸렸을 수 있습니다.`,
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
        : "현재까지는 특정 장면에서 오래 멈춘 신호가 뚜렷하지 않습니다.",
    ];
  }

  return ["아직 머문 시간을 읽을 만큼 학생 조작 기록이 쌓이지 않았습니다."];
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

    return `${teacherFacingBlockTitle(blocks, activityId ?? "")}에서 "${describeMisconceptionSignal(signal)}" 신호가 ${count}번 보였습니다. 확정 진단은 아니므로 학생 설명을 한 번 더 들어보세요.`;
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
      `${teacherFacingBlockTitle(blocks, activityId)}에서 맞지 않은 제출이 ${count}번 있었습니다. 학생이 어떤 기준으로 골랐는지 확인해 볼 만합니다.`,
    );
  });

  if (hintByActivity.length > 0) {
    const [activityId, count] = hintByActivity[0] ?? ["", 0];
    fallbackSignals.push(
      `${teacherFacingBlockTitle(blocks, activityId)}에서 힌트를 연 기록이 ${count}번 있습니다. 개념 연결이 잠시 멈춘 장면일 수 있습니다.`,
    );
  }

  if (retryByActivity.length > 0) {
    const [activityId, count] = retryByActivity[0] ?? ["", 0];
    fallbackSignals.push(
      `${teacherFacingBlockTitle(blocks, activityId)}에서 다시 시도한 기록이 ${count}번 있습니다. 피드백 이후 자기 수정이 일어났는지 살펴보세요.`,
    );
  }

  return fallbackSignals.length > 0
    ? fallbackSignals.slice(0, 3)
    : ["현재 뚜렷한 오개념 신호는 없습니다. 다음에는 학생 설명을 짧게 받아 이해를 더 확인해 보세요."];
}

function summarizeNextTeachingMoves({
  dwellPatterns,
  misconceptionSignals,
  eventCount,
}: {
  dwellPatterns: string[];
  misconceptionSignals: string[];
  eventCount: number;
}) {
  if (eventCount === 0) {
    return [
      "먼저 1-2명의 학생에게 실행해 보고, 리포트에 조작 기록이 쌓이는지 확인하세요.",
    ];
  }

  const moves = ["가장 많이 만진 장면을 다시 보여주고, 학생에게 \"처음에는 무엇을 기준으로 골랐니?\"라고 물어보세요."];

  if (!misconceptionSignals[0].includes("뚜렷한 오개념")) {
    moves.push(
      `${misconceptionSignals[0]} 이 장면은 정답 확인보다 학생 설명을 먼저 듣는 방식으로 다루면 좋습니다.`,
    );
  }

  if (!dwellPatterns[0].includes("뚜렷하지") && !dwellPatterns[0].includes("없습니다")) {
    moves.push(`${dwellPatterns[0]} 해당 장면은 교사가 먼저 한 번 시범을 보인 뒤 다시 맡겨 보세요.`);
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
  const blocks = assignment.document.blocks;

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
      dwellPatterns,
      misconceptionSignals,
      eventCount: orderedEvents.length,
    }),
    sessionDetails: createSessionDetails({
      blocks,
      sessions,
      events: orderedEvents,
    }),
    activitySummaries: createActivitySummaries({
      blocks,
      events: orderedEvents,
    }),
  };
}
