import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadLessonSpec } from "@/features/content";
import { LessonRunner } from "./lesson-runner";
import { __resetPendingSessionStartsForTests } from "./use-lesson-session";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

type MockResponseOptions = {
  ok?: boolean;
  status?: number;
  body?: unknown;
};

function jsonResponse({
  ok = true,
  status = ok ? 200 : 500,
  body,
}: MockResponseOptions = {}) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  } as Response);
}

function setupFetchMock(options?: {
  startFails?: boolean;
  eventsFailOnce?: boolean;
}) {
  const calls: Array<{ url: string; body: unknown }> = [];
  let eventFailureConsumed = false;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url, body });

    if (url.endsWith("/api/sessions")) {
      if (options?.startFails) {
        return jsonResponse({
          ok: false,
          status: 500,
          body: {
            error: {
              message: "start failed",
            },
          },
        });
      }

      return jsonResponse({
        status: 201,
        body: {
          sessionId: "session-123",
          guestId: "guest-123",
          lessonSlug: "whole-and-part",
          status: "started",
          reportStatus: "pending",
        },
      });
    }

    if (url.includes("/events")) {
      if (options?.eventsFailOnce && !eventFailureConsumed) {
        eventFailureConsumed = true;

        return jsonResponse({
          ok: false,
          status: 500,
          body: {
            error: {
              message: "event failed",
            },
          },
        });
      }

      return jsonResponse({
        body: {
          ok: true,
          duplicated: false,
        },
      });
    }

    if (url.includes("/complete")) {
      return jsonResponse({
        body: {
          sessionId: "session-123",
          status: "completed",
          reportStatus: "pending",
        },
      });
    }

    throw new Error(`Unhandled fetch URL: ${url}`);
  });

  vi.stubGlobal("fetch", fetchMock);

  return {
    calls,
    fetchMock,
  };
}

describe("LessonRunner", () => {
  beforeEach(() => {
    pushMock.mockReset();
    __resetPendingSessionStartsForTests();
  });

  it("shows a fatal error card when session start fails", async () => {
    setupFetchMock({ startFails: true });

    render(
      <LessonRunner
        lesson={loadLessonSpec("whole-and-part")}
        moduleTitle="분수 탐험실"
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "학습 세션을 시작하지 못했어요" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시작" })).toBeInTheDocument();
  });

  it("starts only one session in React Strict Mode", async () => {
    const { calls } = setupFetchMock();

    render(
      <StrictMode>
        <LessonRunner
          lesson={loadLessonSpec("whole-and-part")}
          moduleTitle="분수 탐험실"
        />
      </StrictMode>,
    );

    await screen.findByText("분수가 되려면 어떤 설명이 먼저 맞아야 할까요?");

    expect(calls.filter((call) => call.url.endsWith("/api/sessions"))).toHaveLength(1);
  });

  it("renders the first activity and shows success state after a correct multiple-choice submit", async () => {
    setupFetchMock();
    const user = userEvent.setup();

    render(
      <LessonRunner
        lesson={loadLessonSpec("whole-and-part")}
        moduleTitle="분수 탐험실"
      />,
    );

    await screen.findByText("분수가 되려면 어떤 설명이 먼저 맞아야 할까요?");
    await user.click(
      screen.getByRole("button", {
        name: /전체를 같은 크기로 나누고 일부를 고른다\./,
      }),
    );
    await user.click(screen.getByRole("button", { name: "제출하기" }));

    expect(
      await screen.findByText("잘했어요. 다음 단계로 넘어가 볼까요?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("renders and clears the first checkpoint for denominator-and-numerator", async () => {
    setupFetchMock();
    const user = userEvent.setup();

    render(
      <LessonRunner
        lesson={loadLessonSpec("denominator-and-numerator")}
        moduleTitle="분수 탐험실"
      />,
    );

    await screen.findByText("3/5에서 5는 무엇을 뜻할까요?");
    await user.click(
      screen.getByRole("button", {
        name: /전체를 같은 크기로 나눈 수/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "제출하기" }));

    expect(
      await screen.findByText("잘했어요. 다음 단계로 넘어가 볼까요?"),
    ).toBeInTheDocument();
  });

  it("renders and clears the first checkpoint for compare-fractions-same-whole", async () => {
    setupFetchMock();
    const user = userEvent.setup();

    render(
      <LessonRunner
        lesson={loadLessonSpec("compare-fractions-same-whole")}
        moduleTitle="분수 탐험실"
      />,
    );

    await screen.findByText(
      "같은 케이크를 1/2와 1/4로 나눌 때 더 큰 조각은 어느 쪽일까요?",
    );
    await user.click(
      screen.getByRole("button", {
        name: /1\/2/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "제출하기" }));

    expect(
      await screen.findByText("잘했어요. 다음 단계로 넘어가 볼까요?"),
    ).toBeInTheDocument();
  });

  it("shows hint and retry actions after an incorrect answer", async () => {
    const { calls } = setupFetchMock();
    const user = userEvent.setup();

    render(
      <LessonRunner
        lesson={loadLessonSpec("whole-and-part")}
        moduleTitle="분수 탐험실"
      />,
    );

    await screen.findByText("분수가 되려면 어떤 설명이 먼저 맞아야 할까요?");
    await user.click(
      screen.getByRole("button", {
        name: /조각 수가 많아 보이면 더 큰 분수다\./,
      }),
    );
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await screen.findByText("조각의 의미를 다시 보고 한 번 더 생각해 볼까요?");

    await user.click(screen.getByRole("button", { name: "힌트 보기" }));
    expect(
      await screen.findByText(/먼저 전체가 무엇인지 찾고, 같은 크기로 나누었는지 확인해 보세요/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      const hintEvent = calls.find(
        (call) =>
          call.url.includes("/events") &&
          typeof call.body === "object" &&
          call.body !== null &&
          (call.body as { eventType?: string }).eventType === "hint-open",
      );
      const retryEvent = calls.find(
        (call) =>
          call.url.includes("/events") &&
          typeof call.body === "object" &&
          call.body !== null &&
          (call.body as { eventType?: string }).eventType === "retry",
      );

      expect(hintEvent).toBeTruthy();
      expect(retryEvent).toBeTruthy();
    });
  });

  it("accepts the correct fraction-bars answer and advances to the next stage", async () => {
    setupFetchMock();
    const user = userEvent.setup();

    render(
      <LessonRunner
        lesson={loadLessonSpec("whole-and-part")}
        moduleTitle="분수 탐험실"
      />,
    );

    await screen.findByText("분수가 되려면 어떤 설명이 먼저 맞아야 할까요?");
    await user.click(
      screen.getByRole("button", {
        name: /전체를 같은 크기로 나누고 일부를 고른다\./,
      }),
    );
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await user.click(await screen.findByRole("button", { name: "다음" }));

    await screen.findByText("막대를 4등분한 뒤 2칸을 선택해 2/4를 만들어 보세요.");
    await user.click(screen.getByRole("button", { name: "1번째 조각 선택" }));
    await user.click(screen.getByRole("button", { name: "2번째 조각 선택" }));
    await user.click(screen.getByRole("button", { name: "제출하기" }));

    expect(
      await screen.findByText("좋아요. 선택한 조각과 분수 기호가 잘 연결됐어요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("supports the number-line interaction and validates the snapped position", async () => {
    setupFetchMock();
    const user = userEvent.setup();

    render(
      <LessonRunner
        lesson={loadLessonSpec("fractions-on-a-number-line")}
        moduleTitle="분수 탐험실"
      />,
    );

    await screen.findByText("0과 1 사이를 4등분하면 2/4는 어디에 놓일까요?");
    await user.click(screen.getByRole("button", { name: /가운데 지점/ }));
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await user.click(await screen.findByRole("button", { name: "다음" }));

    const slider = await screen.findByRole("slider", {
      name: "3/4 위치 슬라이더",
    });
    fireEvent.change(slider, { target: { value: "3" } });
    fireEvent.mouseUp(slider, { target: { value: "3" } });
    await user.click(screen.getByRole("button", { name: "제출하기" }));

    expect(
      await screen.findByText("좋아요. 같은 간격을 기준으로 분수 위치를 찾았어요."),
    ).toBeInTheDocument();
  });

  it("requires the minimum explanation length before passing free-text", async () => {
    setupFetchMock();
    const user = userEvent.setup();

    render(
      <LessonRunner
        lesson={loadLessonSpec("whole-and-part")}
        moduleTitle="분수 탐험실"
      />,
    );

    await screen.findByText("분수가 되려면 어떤 설명이 먼저 맞아야 할까요?");
    await user.click(
      screen.getByRole("button", {
        name: /전체를 같은 크기로 나누고 일부를 고른다\./,
      }),
    );
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await user.click(await screen.findByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "1번째 조각 선택" }));
    await user.click(screen.getByRole("button", { name: "2번째 조각 선택" }));
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await user.click(await screen.findByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: /2\/4/ }));
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await user.click(await screen.findByRole("button", { name: "다음" }));

    await user.type(screen.getByRole("textbox", { name: "설명 입력" }), "짧다");
    await user.click(screen.getByRole("button", { name: "제출하기" }));

    expect(
      await screen.findByText("설명을 조금만 더 써 볼까요? 최소 8자 이상이면 됩니다."),
    ).toBeInTheDocument();
  });

  it("completes the final activity and redirects to the report page", async () => {
    setupFetchMock();
    const user = userEvent.setup();

    render(
      <LessonRunner
        lesson={loadLessonSpec("whole-and-part")}
        moduleTitle="분수 탐험실"
      />,
    );

    await screen.findByText("분수가 되려면 어떤 설명이 먼저 맞아야 할까요?");
    await user.click(
      screen.getByRole("button", {
        name: /전체를 같은 크기로 나누고 일부를 고른다\./,
      }),
    );
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await user.click(await screen.findByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: "1번째 조각 선택" }));
    await user.click(screen.getByRole("button", { name: "2번째 조각 선택" }));
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await user.click(await screen.findByRole("button", { name: "다음" }));
    await user.click(screen.getByRole("button", { name: /2\/4/ }));
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await user.click(await screen.findByRole("button", { name: "다음" }));
    await user.type(
      screen.getByRole("textbox", { name: "설명 입력" }),
      "전체를 4조각으로 똑같이 나누고 2조각을 골랐기 때문이에요.",
    );
    await user.click(screen.getByRole("button", { name: "제출하기" }));
    await user.click(await screen.findByRole("button", { name: "다음" }));
    await user.click(
      screen.getByRole("button", {
        name: /같은 크기로 나눈 전체 중 일부를 고른 상황/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "제출하기" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/report/session-123");
    });
  });
});
