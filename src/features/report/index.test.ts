import { describe, expect, it } from "vitest";
import { loadContentBundle } from "@/features/content";
import type { TrackedSessionEventRecord } from "@/types/session";
import {
  createSessionReportSummary,
  EXPLANATION_SUMMARY_FALLBACK,
  NO_CLEAR_MISCONCEPTION_TEXT,
} from "./index";

function makeEvent(
  overrides: Partial<TrackedSessionEventRecord>,
): TrackedSessionEventRecord {
  return {
    id: overrides.id ?? `event-${Math.random().toString(16).slice(2)}`,
    sessionId: overrides.sessionId ?? "session-1",
    clientEventId:
      overrides.clientEventId ?? `client-${Math.random().toString(16).slice(2)}`,
    activityId: overrides.activityId ?? "L1-A1",
    eventType: overrides.eventType ?? "submit",
    payload: overrides.payload ?? {},
    clientTs: overrides.clientTs ?? "2026-04-23T09:00:00.000Z",
    receivedAt: overrides.receivedAt ?? "2026-04-23T09:00:00.000Z",
  };
}

describe("createSessionReportSummary", () => {
  it("uses the fallback misconception text and manifest next lesson when no strong signal is present", () => {
    const bundle = loadContentBundle();

    const summary = createSessionReportSummary({
      bundle,
      lessonSlug: "whole-and-part",
      events: [],
    });

    expect(summary.understoodConcepts).toEqual(["전체와 같은 크기 부분"]);
    expect(summary.watchMisconceptions).toEqual([NO_CLEAR_MISCONCEPTION_TEXT]);
    expect(summary.explanationSummary).toBe(EXPLANATION_SUMMARY_FALLBACK);
    expect(summary.recommendedNextLessonId).toBe("denominator-and-numerator");
    expect(summary.recommendedNextLessonTitle).toBe("분모와 분자");
  });

  it("promotes a strong misconception and recommends its next lesson", () => {
    const bundle = loadContentBundle();

    const summary = createSessionReportSummary({
      bundle,
      lessonSlug: "denominator-and-numerator",
      events: [
        makeEvent({
          activityId: "L2-A1",
          eventType: "submit",
          payload: {
            kind: "multiple-choice",
            response: {
              selectedOptionId: "B",
            },
            isCorrect: false,
          },
        }),
      ],
    });

    expect(summary.watchMisconceptions[0]).toBe(
      "분모를 전체를 나눈 수가 아니라 고른 조각 수처럼 해석하고 있습니다.",
    );
    expect(summary.recommendedNextLessonId).toBe("denominator-and-numerator");
    expect(summary.recommendedNextLessonTitle).toBe("분모와 분자");
  });

  it("uses the latest valid explanation text when it exists", () => {
    const bundle = loadContentBundle();

    const summary = createSessionReportSummary({
      bundle,
      lessonSlug: "whole-and-part",
      events: [
        makeEvent({
          activityId: "L1-A4",
          eventType: "free-text-submit",
          payload: {
            kind: "free-text",
            text: "짧다",
            textLength: 2,
            isLengthValid: false,
          },
          clientTs: "2026-04-23T09:00:00.000Z",
          receivedAt: "2026-04-23T09:00:00.000Z",
        }),
        makeEvent({
          activityId: "L1-A4",
          eventType: "free-text-submit",
          payload: {
            kind: "free-text",
            text: "전체를 같은 크기로 4조각으로 나누고 2조각을 골랐어요.",
            textLength: 31,
            isLengthValid: true,
          },
          clientTs: "2026-04-23T09:00:10.000Z",
          receivedAt: "2026-04-23T09:00:10.000Z",
        }),
      ],
    });

    expect(summary.explanationSummary).toBe(
      "전체를 같은 크기로 4조각으로 나누고 2조각을 골랐어요.",
    );
  });

  it("falls back to the current lesson when the current lesson is last in the manifest", () => {
    const bundle = loadContentBundle();

    const summary = createSessionReportSummary({
      bundle,
      lessonSlug: "fractions-on-a-number-line",
      events: [],
    });

    expect(summary.recommendedNextLessonId).toBe("fractions-on-a-number-line");
    expect(summary.recommendedNextLessonTitle).toBe("수직선 위 분수");
  });
});
