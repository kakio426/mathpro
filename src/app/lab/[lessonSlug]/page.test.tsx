import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/components/lesson-runner/lesson-runner", () => ({
  LessonRunner: ({
    lesson,
    moduleTitle,
  }: {
    lesson: { title: string };
    moduleTitle: string;
  }) => (
    <div data-testid="lesson-runner">
      {moduleTitle} / {lesson.title}
    </div>
  ),
}));

describe("LabLessonPage", () => {
  it.each([
    {
      lessonSlug: "whole-and-part",
      title: "전체와 부분",
    },
    {
      lessonSlug: "denominator-and-numerator",
      title: "분모와 분자",
    },
    {
      lessonSlug: "compare-fractions-same-whole",
      title: "같은 전체에서 크기 비교",
    },
    {
      lessonSlug: "fractions-on-a-number-line",
      title: "수직선 위 분수",
    },
  ])("renders the %s lesson page from the content loader", async ({
    lessonSlug,
    title,
  }) => {
    const Page = (await import("./page")).default;
    const ui = await Page({
      params: Promise.resolve({ lessonSlug }),
    });

    render(ui);

    expect(
      screen.getByRole("heading", { name: `${title} | 수학프로 학습` }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("lesson-runner")).toHaveTextContent("분수 탐험실");
    expect(screen.getByTestId("lesson-runner")).toHaveTextContent(title);
  });

  it("calls notFound for an invalid lesson slug", async () => {
    const Page = (await import("./page")).default;

    await expect(
      Page({
        params: Promise.resolve({ lessonSlug: "missing-lesson" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
