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
    expect(summary.manipulationPatterns[0]).toContain("분수 막대 HTML 자료");
    expect(summary.manipulationPatterns[0]).toContain("1개 세션");
    expect(summary.manipulationPatterns[0]).toContain("오답 제출은 1회");
    expect(summary.manipulationPatterns[0]).toContain("마지막 응답 예: 0");
    expect(summary.dwellPatterns[0]).toContain("15초 이상");
    expect(summary.misconceptionSignals[0]).toContain("분수 막대 HTML 자료");
    expect(summary.misconceptionSignals[0]).toContain("selected-parts-mismatch");
    expect(summary.nextTeachingMoves[0]).toContain("다음 수업");
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
        expect.stringContaining("분수 막대 HTML 자료: 제출에서 오답 신호 1회"),
        expect.stringContaining("분수 막대 HTML 자료: 힌트 열람 1회"),
        expect.stringContaining("분수 막대 HTML 자료: 재시도 1회"),
      ]),
    );
  });

  it("returns helpful empty-state report copy before student events arrive", () => {
    const summary = createTeacherReportSummary({
      assignment,
      sessions: [],
      events: [],
    });

    expect(summary.manipulationPatterns[0]).toContain("아직 학생 조작 이벤트");
    expect(summary.dwellPatterns[0]).toContain("이벤트가 없습니다");
    expect(summary.misconceptionSignals[0]).toContain("뚜렷한 오개념");
    expect(summary.nextTeachingMoves[0]).toContain("먼저");
  });
});
