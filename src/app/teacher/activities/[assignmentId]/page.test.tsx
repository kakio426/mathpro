import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublishedAssignment } from "@/types/teacher";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const getAssignmentByIdMock = vi.fn();

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
      getAssignmentById: getAssignmentByIdMock,
    }),
  };
});

vi.mock("@/components/teacher/teacher-activity-preview", () => ({
  TeacherActivityPreview: ({
    assignment,
  }: {
    assignment: PublishedAssignment;
  }) => (
    <div data-testid="teacher-activity-preview">
      {assignment.id} / {assignment.document.title}
    </div>
  ),
}));

const assignment: PublishedAssignment = {
  id: "assignment-123",
  activityId: "activity-123",
  code: "ABC123",
  status: "active",
  publishedAt: "2026-04-25T10:00:00.000Z",
  shareUrl: "http://localhost:3000/play/ABC123",
  document: {
    id: "activity-123",
    title: "길이 단위 감각 자료",
    gradeBand: "3-4",
    concept: "mm, cm, m, km",
    goal: "주변 사물과 건물로 길이 단위의 양감을 비교한다.",
    difficulty: "standard",
    sourceLessonSlug: "whole-and-part",
    blocks: [
      {
        id: "html-artifact-1",
        type: "html-artifact",
        title: "길이 비교 실험",
        instruction: "주변 물건을 움직이며 길이를 비교합니다.",
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
    ],
    status: "published",
    createdAt: "2026-04-25T10:00:00.000Z",
    updatedAt: "2026-04-25T10:00:00.000Z",
  },
};

describe("TeacherActivityPreviewPage", () => {
  it("loads an assignment by id and renders the teacher preview", async () => {
    getAssignmentByIdMock.mockResolvedValueOnce(assignment);

    const Page = (await import("./page")).default;
    const ui = await Page({
      params: Promise.resolve({ assignmentId: "assignment-123" }),
    });

    render(ui);

    expect(getAssignmentByIdMock).toHaveBeenCalledWith("assignment-123");
    expect(screen.getByTestId("teacher-activity-preview")).toHaveTextContent(
      "길이 단위 감각 자료",
    );
  });

  it("calls notFound when the assignment id is missing", async () => {
    const { TeacherServiceError } = await import("@/features/teacher");
    getAssignmentByIdMock.mockRejectedValueOnce(
      new TeacherServiceError(404, "not_found", "Assignment not found."),
    );

    const Page = (await import("./page")).default;

    await expect(
      Page({
        params: Promise.resolve({ assignmentId: "missing" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
