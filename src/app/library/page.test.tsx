import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublishedAssignmentListItem } from "@/types/teacher";

const loadPublishedAssignmentListMock = vi.fn();

vi.mock("@/app/teacher/assignment-list-loader", () => ({
  loadPublishedAssignmentList: loadPublishedAssignmentListMock,
}));

vi.mock("@/components/teacher/public-material-gallery", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/teacher/public-material-gallery")
  >("@/components/teacher/public-material-gallery");

  return {
    ...actual,
    PublicMaterialGallery: ({
      assignments,
      activeFilter,
    }: {
      assignments: PublishedAssignmentListItem[];
      activeFilter: string;
    }) => (
      <div data-testid="public-material-gallery">
        {activeFilter} / {assignments.map((assignment) => assignment.title).join(", ")}
      </div>
    ),
  };
});

const assignment: PublishedAssignmentListItem = {
  id: "assignment-123",
  activityId: "activity-123",
  code: "ABC123",
  status: "active",
  publishedAt: "2026-04-25T10:00:00.000Z",
  shareUrl: "http://localhost:3000/play/ABC123",
  title: "길이 단위 감각 자료",
  concept: "mm, cm, m, km",
  goal: "주변 물건과 건물로 길이 단위의 양감을 비교한다.",
  gradeBand: "3-4",
  difficulty: "standard",
  sourceLessonSlug: "whole-and-part",
  creatorName: "김수학 선생님",
  hasHtmlArtifact: true,
  previewBlockTitle: "길이 비교 실험",
  blockCount: 1,
  participantCount: 0,
  completedCount: 0,
};

describe("LibraryPage", () => {
  it("renders the shared material gallery with public assignments", async () => {
    loadPublishedAssignmentListMock.mockResolvedValueOnce({
      assignments: [assignment],
      loadError: null,
    });

    const Page = (await import("./page")).default;
    const ui = await Page({
      searchParams: Promise.resolve({ filter: "preview" }),
    });

    render(ui);

    expect(screen.getByTestId("public-material-gallery")).toHaveTextContent(
      "preview / 길이 단위 감각 자료",
    );
  });
});
