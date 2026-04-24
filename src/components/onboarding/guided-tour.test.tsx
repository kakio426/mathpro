import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { GuidedTour, type GuidedTourStep } from "./guided-tour";

const steps: GuidedTourStep[] = [
  {
    eyebrow: "첫 안내",
    title: "화면을 천천히 살펴봅니다",
    body: "처음 방문한 사용자를 위한 안내입니다.",
  },
  {
    eyebrow: "다음 안내",
    title: "필요하면 다시 열 수 있습니다",
    body: "도움말 버튼은 계속 남아 있습니다.",
  },
];

describe("GuidedTour", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("auto-opens the first time a screen is visited", async () => {
    render(
      <GuidedTour autoOpen startLabel="안내 보기" steps={steps} storageKey="tour:auto" />,
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("화면을 천천히 살펴봅니다")).toBeInTheDocument();
    expect(
      screen.getByLabelText("이 화면 안내 다시 자동으로 보지 않기"),
    ).toBeInTheDocument();
  });

  it("remembers that the automatic guide was seen after closing", async () => {
    const user = userEvent.setup();

    render(
      <GuidedTour autoOpen startLabel="안내 보기" steps={steps} storageKey="tour:seen" />,
    );

    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "안내 닫기" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(window.localStorage.getItem("tour:seen")).toBe("seen");
  });

  it("stores the dismissed state when users choose not to see it again", async () => {
    const user = userEvent.setup();

    render(
      <GuidedTour
        autoOpen
        startLabel="안내 보기"
        steps={steps}
        storageKey="tour:dismissed"
      />,
    );

    await screen.findByRole("dialog");
    await user.click(
      screen.getByLabelText("이 화면 안내 다시 자동으로 보지 않기"),
    );
    await user.click(screen.getByRole("button", { name: "안내 닫기" }));

    expect(window.localStorage.getItem("tour:dismissed")).toBe("dismissed");
  });

  it("does not auto-open after the tour was already seen", () => {
    window.localStorage.setItem("tour:manual", "seen");

    render(
      <GuidedTour autoOpen startLabel="안내 보기" steps={steps} storageKey="tour:manual" />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "안내 보기" })).toBeInTheDocument();
  });
});

