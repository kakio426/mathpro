import { describe, expect, it } from "vitest";
import type { PublishedAssignment } from "@/types/teacher";
import { createTeacherReportSummary } from "./report";

const now = "2026-04-24T00:00:00.000Z";

const assignment: PublishedAssignment = {
  id: "assignment-1",
  activityId: "activity-1",
  code: "ABC123",
  status: "active",
  publishedAt: now,
  shareUrl: "http://localhost:3000/play/ABC123",
  document: {
    id: "activity-1",
    title: "분수의 의미 인터랙티브 탐구",
    gradeBand: "3-4",
    concept: "분수의 의미",
    goal: "전체를 같은 크기로 나눈 것 중 일부라는 뜻을 조작으로 이해한다.",
    difficulty: "standard",
    sourceLessonSlug: "whole-and-part",
    status: "published",
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: "html-artifact-1",
        type: "html-artifact",
        title: "분수 막대 HTML 자료",
        instruction: "분수 막대를 직접 조작합니다.",
        interactionKind: "html-artifact",
        html: "<html></html>",
        analysisHooks: [
          {
            id: "html-artifact-1:manipulation-pattern",
            signal: "manipulation-pattern",
            label: "조작 패턴",
          },
        ],
      },
    ],
  },
};

describe("createTeacherReportSummary", () => {
  it("summarizes html artifact manipulation, dwell, misconception, and next teaching moves", () => {
    const summary = createTeacherReportSummary({
      assignment,
      sessions: [
        {
          id: "session-1",
          status: "completed",
          startedAt: "2026-04-24T00:00:00.000Z",
          completedAt: "2026-04-24T00:00:25.000Z",
          latestEventAt: "2026-04-24T00:00:25.000Z",
        },
      ],
      events: [
        {
          sessionId: "session-1",
          activityId: "html-artifact-1",
          eventType: "select",
          payload: {
            selectedParts: [0],
          },
          clientTs: "2026-04-24T00:00:00.000Z",
        },
        {
          sessionId: "session-1",
          activityId: "html-artifact-1",
          eventType: "submit",
          payload: {
            isCorrect: false,
            response: [0],
            misconceptionSignal: "selected-parts-mismatch",
          },
          clientTs: "2026-04-24T00:00:20.000Z",
        },
      ],
    });

    expect(summary.participantCount).toBe(1);
    expect(summary.completedCount).toBe(1);
    expect(summary.eventCount).toBe(2);
    expect(summary.manipulationPatterns[0]).toContain("분수 막대 자료");
    expect(summary.manipulationPatterns[0]).toContain("학생 1명");
    expect(summary.manipulationPatterns[0]).toContain("맞지 않은 제출이 1번");
    expect(summary.manipulationPatterns[0]).toContain('마지막 응답은 "0"');
    expect(summary.dwellPatterns[0]).toContain("15초 이상 머문 학생이 1명");
    expect(summary.misconceptionSignals[0]).toContain("분수 막대 자료");
    expect(summary.misconceptionSignals[0]).toContain(
      "선택한 조각 수와 목표 분수가 맞지 않음",
    );
    expect(summary.misconceptionSignals[0]).not.toContain(
      "selected-parts-mismatch",
    );
    expect(summary.nextTeachingMoves[0]).toContain("가장 많이 만진 장면");
    expect(summary.sessionDetails[0]).toMatchObject({
      label: "참여자 1",
      status: "completed",
      eventCount: 2,
      submitCount: 1,
      incorrectSubmitCount: 1,
      topActivityTitle: "분수 막대 HTML 자료",
      lastResponse: "0",
    });
    expect(summary.sessionDetails[0]?.observation).toContain(
      "맞지 않은 제출이 1번",
    );
    expect(summary.activitySummaries[0]).toMatchObject({
      title: "분수 막대 HTML 자료",
      eventCount: 2,
      sessionCount: 1,
      submitCount: 1,
      incorrectSubmitCount: 1,
    });
    expect(summary.activitySummaries[0]?.nextAction).toContain(
      "무엇을 기준으로 골랐니?",
    );
  });

  it("groups fallback misconception signals by activity block", () => {
    const summary = createTeacherReportSummary({
      assignment,
      sessions: [
        {
          id: "session-1",
          status: "completed",
        },
        {
          id: "session-2",
          status: "started",
        },
      ],
      events: [
        {
          sessionId: "session-1",
          activityId: "html-artifact-1",
          eventType: "submit",
          payload: {
            isCorrect: false,
          },
          clientTs: "2026-04-24T00:00:02.000Z",
        },
        {
          sessionId: "session-2",
          activityId: "html-artifact-1",
          eventType: "hint-open",
          payload: {},
          clientTs: "2026-04-24T00:00:03.000Z",
        },
        {
          sessionId: "session-2",
          activityId: "html-artifact-1",
          eventType: "retry",
          payload: {},
          clientTs: "2026-04-24T00:00:04.000Z",
        },
      ],
    });

    expect(summary.participantCount).toBe(2);
    expect(summary.completedCount).toBe(1);
    expect(summary.misconceptionSignals).toEqual(
      expect.arrayContaining([
        expect.stringContaining("분수 막대 자료에서 맞지 않은 제출이 1번"),
        expect.stringContaining("분수 막대 자료에서 힌트를 연 기록이 1번"),
        expect.stringContaining("분수 막대 자료에서 다시 시도한 기록이 1번"),
      ]),
    );
    expect(summary.sessionDetails).toHaveLength(2);
    expect(summary.sessionDetails[1]).toMatchObject({
      label: "참여자 2",
      hintCount: 1,
      retryCount: 1,
    });
  });

  it("returns helpful empty-state report copy before student events arrive", () => {
    const summary = createTeacherReportSummary({
      assignment,
      sessions: [],
      events: [],
    });

    expect(summary.manipulationPatterns[0]).toContain("아직 학생 조작 이벤트");
    expect(summary.dwellPatterns[0]).toContain("학생 조작 기록");
    expect(summary.misconceptionSignals[0]).toContain("뚜렷한 오개념");
    expect(summary.nextTeachingMoves[0]).toContain("먼저");
    expect(summary.sessionDetails).toEqual([]);
    expect(summary.activitySummaries[0]).toMatchObject({
      title: "분수 막대 HTML 자료",
      eventCount: 0,
      sessionCount: 0,
    });
    expect(summary.activitySummaries[0]?.summary).toContain("아직");
  });
});
