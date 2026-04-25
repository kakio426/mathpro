import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublishedAssignment } from "@/types/teacher";
import { TeacherActivityPreview } from "./teacher-activity-preview";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const now = "2026-04-25T10:00:00.000Z";

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
      title: "길이 단위 감각 자료",
      gradeBand: "3-4",
      concept: "mm, cm, m, km",
      goal: "주변 사물과 건물로 길이 단위의 양감을 비교한다.",
      difficulty: "standard",
      sourceLessonSlug: "whole-and-part",
      teacherGuide:
        "교실 물건과 학교 건물을 움직이며 길이 단위를 비교하게 합니다.",
      learningQuestions: [
        "mm와 cm는 어떤 물건으로 비교할 수 있나요?",
        "m와 km를 같은 그림에서 비교하면 무엇이 달라 보이나요?",
        "단위가 커질수록 숫자는 어떻게 바뀌나요?",
      ],
      blocks,
      status: "published",
      createdAt: now,
      updatedAt: now,
    },
  };
}

describe("TeacherActivityPreview", () => {
  it("renders a saved html artifact without starting a student session", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TeacherActivityPreview
        assignment={makeAssignment([
          {
            id: "html-artifact-1",
            type: "html-artifact",
            title: "길이 비교 실험",
            instruction: "주변 물건을 움직이며 길이를 비교합니다.",
            interactionKind: "html-artifact",
            html: "<!doctype html><html><body><h1>길이 비교</h1></body></html>",
            analysisHooks: [
              {
                id: "html-artifact-1:manipulation-pattern",
                signal: "manipulation-pattern",
                label: "조작 패턴",
              },
            ],
          },
        ])}
      />,
    );

    expect(screen.getByRole("heading", { name: "길이 단위 감각 자료" })).toBeInTheDocument();
    expect(screen.getByText("교사용 미리보기")).toBeInTheDocument();
    expect(screen.getByText("태블릿/컴퓨터 기준")).toBeInTheDocument();
    expect(screen.getByTitle("길이 비교 실험 교사용 미리보기")).toBeInTheDocument();
    expect(
      screen.getByText("교실 물건과 학교 건물을 움직이며 길이 단위를 비교하게 합니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("mm와 cm는 어떤 물건으로 비교할 수 있나요?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /학생 참여 화면 열기/ })).toHaveAttribute(
      "href",
      "/play/ABC123",
    );
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("shows a friendly fallback when there is no html artifact to preview", () => {
    render(
      <TeacherActivityPreview
        assignment={makeAssignment([
          {
            id: "intro-1",
            type: "intro",
            title: "출발 질문",
            instruction: "단위를 비교해 봅니다.",
            analysisHooks: [
              {
                id: "intro-1:incorrect-final",
                signal: "incorrect-final",
                label: "마지막 제출에서 개념 연결이 흔들림",
              },
            ],
          },
        ])}
      />,
    );

    expect(
      screen.getAllByText("미리보기 가능한 학생 화면이 없습니다")[0],
    ).toBeInTheDocument();
    expect(screen.queryByTitle(/교사용 미리보기/)).not.toBeInTheDocument();
  });
});
