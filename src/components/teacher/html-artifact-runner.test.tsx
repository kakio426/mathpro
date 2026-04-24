import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivityBlock, PublishedAssignment } from "@/types/teacher";
import { __resetPendingSessionStartsForTests } from "@/components/lesson-runner/use-lesson-session";
import { HtmlArtifactRunner } from "./html-artifact-runner";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const now = "2026-04-24T00:00:00.000Z";

const htmlBlock: ActivityBlock = {
  id: "html-artifact-1",
  type: "html-artifact",
  title: "분수 막대 HTML 자료",
  instruction: "막대를 직접 눌러 보고 분수의 의미를 설명합니다.",
  interactionKind: "html-artifact",
  html: "<!doctype html><html><body><button>artifact</button></body></html>",
  allowedEvents: ["ready", "select", "submit", "complete"],
  safetyStatus: "unchecked",
  analysisHooks: [
    {
      id: "html-artifact-1:manipulation-pattern",
      signal: "manipulation-pattern",
      label: "조작 패턴",
    },
  ],
};

const assignment: PublishedAssignment = {
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
    blocks: [htmlBlock],
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
};

function jsonResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => body,
  } as Response);
}

function setupFetchMock() {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url, body });

    if (url.endsWith("/api/assignments/ABC123/sessions")) {
      return jsonResponse({
        sessionId: "session-artifact",
        guestId: "guest-123",
        lessonSlug: "whole-and-part",
        assignmentId: "assignment-123",
        assignmentCode: "ABC123",
        status: "started",
        reportStatus: "pending",
      });
    }

    if (url.endsWith("/api/sessions/session-artifact/events")) {
      return jsonResponse({
        ok: true,
        duplicated: false,
      });
    }

    if (url.endsWith("/api/sessions/session-artifact/complete")) {
      return jsonResponse({
        sessionId: "session-artifact",
        status: "completed",
        reportStatus: "ready",
      });
    }

    throw new Error(`Unhandled fetch URL: ${url}`);
  });

  vi.stubGlobal("fetch", fetchMock);

  return {
    calls,
  };
}

function dispatchArtifactMessage(
  iframe: HTMLIFrameElement,
  data: Record<string, unknown>,
) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data,
      source: iframe.contentWindow,
    }),
  );
}

describe("HtmlArtifactRunner", () => {
  beforeEach(() => {
    pushMock.mockReset();
    __resetPendingSessionStartsForTests();
  });

  it("stores iframe postMessage events through the session event API", async () => {
    const { calls } = setupFetchMock();

    render(<HtmlArtifactRunner assignment={assignment} block={htmlBlock} />);

    const iframe = await screen.findByTitle("분수 막대 HTML 자료 실행 화면");
    dispatchArtifactMessage(iframe as HTMLIFrameElement, {
      eventType: "select",
      payload: {
        selectedParts: [1, 2],
      },
    });

    await waitFor(() => {
      const eventCall = calls.find((call) =>
        call.url.endsWith("/api/sessions/session-artifact/events"),
      );

      expect(eventCall?.body).toMatchObject({
        activityId: "html-artifact-1",
        eventType: "select",
        payload: {
          selectedParts: [1, 2],
          artifactEventType: "select",
          blockId: "html-artifact-1",
          assignmentCode: "ABC123",
        },
      });
    });
  });

  it("ignores artifact events that are not allowed by the block contract", async () => {
    const { calls } = setupFetchMock();

    render(<HtmlArtifactRunner assignment={assignment} block={htmlBlock} />);

    const iframe = await screen.findByTitle("분수 막대 HTML 자료 실행 화면");
    dispatchArtifactMessage(iframe as HTMLIFrameElement, {
      eventType: "retry",
      payload: {
        reason: "not allowed in this block",
      },
    });
    dispatchArtifactMessage(iframe as HTMLIFrameElement, {
      eventType: "select",
      payload: {
        selectedParts: [1],
      },
    });

    await waitFor(() => {
      const eventCalls = calls.filter((call) =>
        call.url.endsWith("/api/sessions/session-artifact/events"),
      );

      expect(eventCalls).toHaveLength(1);
      expect(eventCalls[0]?.body).toMatchObject({
        eventType: "select",
      });
    });
  });

  it("ignores messages that do not come from the artifact iframe", async () => {
    const { calls } = setupFetchMock();

    render(<HtmlArtifactRunner assignment={assignment} block={htmlBlock} />);

    const iframe = await screen.findByTitle("분수 막대 HTML 자료 실행 화면");
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          eventType: "select",
          payload: {
            selectedParts: [99],
          },
        },
        source: window,
      }),
    );
    dispatchArtifactMessage(iframe as HTMLIFrameElement, {
      eventType: "select",
      payload: {
        selectedParts: [1],
      },
    });

    await waitFor(() => {
      const eventCalls = calls.filter((call) =>
        call.url.endsWith("/api/sessions/session-artifact/events"),
      );

      expect(eventCalls).toHaveLength(1);
      expect(eventCalls[0]?.body).toMatchObject({
        payload: {
          selectedParts: [1],
        },
      });
    });
  });

  it("completes the session and redirects when the iframe emits complete", async () => {
    setupFetchMock();

    render(<HtmlArtifactRunner assignment={assignment} block={htmlBlock} />);

    const iframe = await screen.findByTitle("분수 막대 HTML 자료 실행 화면");
    dispatchArtifactMessage(iframe as HTMLIFrameElement, {
      eventType: "complete",
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/report/session-artifact");
    });
  });
});
