import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionReportStatus } from "./session-report-status";

function jsonResponse({
  ok = true,
  status = ok ? 200 : 500,
  body,
}: {
  ok?: boolean;
  status?: number;
  body?: unknown;
}) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  } as Response);
}

describe("SessionReportStatus", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and renders the pending report state from the report API", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        body: {
          sessionId: "session-123",
          status: "pending",
          summaryJson: null,
          generatedAt: null,
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<SessionReportStatus sessionId="session-123" />);

    expect(
      await screen.findByText("학습 기록은 저장되었고, 진단 리포트를 준비하는 중입니다."),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/reports/session-123");
  });

  it("renders an error state when the report API rejects the request", async () => {
    vi.stubGlobal("fetch", async () =>
      jsonResponse({
        ok: false,
        status: 404,
        body: {
          error: {
            message: "Session not found.",
          },
        },
      }),
    );

    render(<SessionReportStatus sessionId="missing-session" />);

    expect(
      await screen.findByRole("heading", { name: "리포트를 불러오지 못했어요" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Session not found.")).toBeInTheDocument();
    });
  });

  it("renders the ready state with a stable fallback when summary data is missing", async () => {
    vi.stubGlobal("fetch", async () =>
      jsonResponse({
        body: {
          sessionId: "session-ready",
          status: "ready",
          summaryJson: null,
          generatedAt: "2026-04-23T12:00:00.000Z",
        },
      }),
    );

    render(<SessionReportStatus sessionId="session-ready" />);

    expect(
      await screen.findByText("리포트가 준비되었습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("준비 완료")).toBeInTheDocument();
    expect(
      screen.getAllByText("진단 결과가 아직 준비되지 않았습니다.").length,
    ).toBeGreaterThan(0);
  });

  it("renders the ready report summary and prefers the recommended lesson title", async () => {
    vi.stubGlobal("fetch", async () =>
      jsonResponse({
        body: {
          sessionId: "session-ready-filled",
          status: "ready",
          summaryJson: {
            understoodConcepts: ["분모와 분자의 역할"],
            watchMisconceptions: [
              "분모를 전체를 나눈 수가 아니라 고른 조각 수처럼 해석하고 있습니다.",
            ],
            explanationSummary: "분모는 전체를 몇 조각으로 나눴는지 뜻해요.",
            recommendedNextLessonId: "denominator-and-numerator",
            recommendedNextLessonTitle: "분모와 분자",
          },
          generatedAt: "2026-04-23T12:00:00.000Z",
        },
      }),
    );

    render(<SessionReportStatus sessionId="session-ready-filled" />);

    expect(await screen.findByText("분모와 분자의 역할")).toBeInTheDocument();
    expect(
      screen.getByText(
        "분모를 전체를 나눈 수가 아니라 고른 조각 수처럼 해석하고 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("분모는 전체를 몇 조각으로 나눴는지 뜻해요."),
    ).toBeInTheDocument();
    expect(screen.getByText("분모와 분자")).toBeInTheDocument();
  });

  it("renders the failed state copy from the report API", async () => {
    vi.stubGlobal("fetch", async () =>
      jsonResponse({
        body: {
          sessionId: "session-failed",
          status: "failed",
          summaryJson: null,
          generatedAt: null,
        },
      }),
    );

    render(<SessionReportStatus sessionId="session-failed" />);

    expect(
      await screen.findByText("리포트 생성 중 오류가 발생했습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("생성 실패")).toBeInTheDocument();
  });
});
