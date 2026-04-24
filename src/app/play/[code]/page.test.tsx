import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublishedAssignment } from "@/types/teacher";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const getAssignmentByCodeMock = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/features/teacher", () => {
  class TeacherServiceError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  return {
    TeacherServiceError,
    createAppTeacherService: () => ({
      getAssignmentByCode: getAssignmentByCodeMock,
    }),
  };
});

vi.mock("@/components/lesson-runner/lesson-runner", () => ({
  LessonRunner: ({
    moduleTitle,
    sessionStart,
  }: {
    moduleTitle: string;
    sessionStart: { endpoint: string };
  }) => (
    <div data-testid="lesson-runner">
      {moduleTitle} / {sessionStart.endpoint}
    </div>
  ),
}));

vi.mock("@/components/teacher/html-artifact-runner", () => ({
  HtmlArtifactRunner: ({
    assignment,
    block,
  }: {
    assignment: PublishedAssignment;
    block: { title: string };
  }) => (
    <div data-testid="html-artifact-runner">
      {assignment.code} / {block.title}
    </div>
  ),
}));

const now = "2026-04-24T00:00:00.000Z";

function makeAssignment(
  blocks: PublishedAssignment["document"]["blocks"],
): PublishedAssignment {
  return {
    id: "assignment-123",
    activityId: "activity-123",
    code: "ABC123",
    status: "active",
    publishedAt: now,
    shareUrl: "http://localhost:3000/play/ABC123",
    document: {
      id: "activity-123",
      title: "분수의 의미 인터랙티브 탐구",
      gradeBand: "3-4",
      concept: "분수의 의미",
      goal: "전체를 같은 크기로 나눈 것 중 일부라는 뜻을 조작으로 이해한다.",
      difficulty: "standard",
      sourceLessonSlug: "whole-and-part",
      blocks,
      status: "published",
      createdAt: now,
      updatedAt: now,
    },
  };
}

describe("PlayAssignmentPage", () => {
  afterEach(() => {
    delete process.env.MATHPRO_E2E_FIXTURES;
    vi.unstubAllEnvs();
  });

  it("renders the sandbox html artifact runner when an assignment contains html", async () => {
    getAssignmentByCodeMock.mockResolvedValueOnce(
      makeAssignment([
        {
          id: "html-artifact-1",
          type: "html-artifact",
          title: "분수 막대 HTML 자료",
          instruction: "막대를 직접 눌러 봅니다.",
          interactionKind: "html-artifact",
          html: "<!doctype html><html></html>",
          analysisHooks: [
            {
              id: "html-artifact-1:manipulation-pattern",
              signal: "manipulation-pattern",
              label: "조작 패턴",
            },
          ],
        },
      ]),
    );

    const Page = (await import("./page")).default;
    const ui = await Page({
      params: Promise.resolve({ code: "ABC123" }),
    });

    render(ui);

    expect(screen.getByText("참여 코드 ABC123")).toBeInTheDocument();
    expect(screen.getByTestId("html-artifact-runner")).toHaveTextContent(
      "분수 막대 HTML 자료",
    );
    expect(screen.queryByTestId("lesson-runner")).not.toBeInTheDocument();
  });

  it("falls back to the lesson runner for non-html activity documents", async () => {
    getAssignmentByCodeMock.mockResolvedValueOnce(
      makeAssignment([
        {
          id: "intro-1",
          type: "intro",
          title: "출발 질문",
          instruction: "분수가 되려면 무엇이 필요할까요?",
          analysisHooks: [
            {
              id: "intro-1:incorrect-final",
              signal: "incorrect-final",
              label: "마지막 제출에서 개념 연결이 흔들림",
            },
          ],
        },
      ]),
    );

    const Page = (await import("./page")).default;
    const ui = await Page({
      params: Promise.resolve({ code: "ABC123" }),
    });

    render(ui);

    expect(screen.getByTestId("lesson-runner")).toHaveTextContent(
      "/api/assignments/ABC123/sessions",
    );
    expect(screen.queryByTestId("html-artifact-runner")).not.toBeInTheDocument();
  });

  it("calls notFound when the assignment code is missing", async () => {
    const { TeacherServiceError } = await import("@/features/teacher");
    getAssignmentByCodeMock.mockRejectedValueOnce(
      new TeacherServiceError(404, "not_found", "Assignment not found."),
    );

    const Page = (await import("./page")).default;

    await expect(
      Page({
        params: Promise.resolve({ code: "MISSING" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("keeps the HTML E2E fixture behind an explicit non-production flag", async () => {
    const { isHtmlE2eFixtureEnabled } = await import("./page");

    expect(isHtmlE2eFixtureEnabled()).toBe(false);

    vi.stubEnv("MATHPRO_E2E_FIXTURES", "1");
    expect(isHtmlE2eFixtureEnabled()).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    expect(isHtmlE2eFixtureEnabled()).toBe(false);
  });

  it("does not use the HTML E2E fixture for normal assignment codes", async () => {
    process.env.MATHPRO_E2E_FIXTURES = "1";
    getAssignmentByCodeMock.mockResolvedValueOnce(
      makeAssignment([
        {
          id: "intro-1",
          type: "intro",
          title: "실제 저장소 자료",
          instruction: "테스트 fixture 대신 저장소 자료를 사용합니다.",
          analysisHooks: [
            {
              id: "intro-1:incorrect-final",
              signal: "incorrect-final",
              label: "마지막 제출에서 개념 연결이 흔들림",
            },
          ],
        },
      ]),
    );

    const Page = (await import("./page")).default;
    const ui = await Page({
      params: Promise.resolve({ code: "REAL01" }),
    });

    render(ui);

    expect(getAssignmentByCodeMock).toHaveBeenCalledWith("REAL01");
    expect(screen.getByText("참여 코드 ABC123")).toBeInTheDocument();
    expect(screen.queryByText("분수 막대 조작 자료")).not.toBeInTheDocument();
  });
});
