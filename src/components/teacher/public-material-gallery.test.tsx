import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublishedAssignmentListItem } from "@/types/teacher";
import {
  filterPublicAssignments,
  PublicMaterialGallery,
} from "./public-material-gallery";

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

const baseAssignment: PublishedAssignmentListItem = {
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
  teacherGuide:
    "교실 물건과 학교 건물을 움직이며 길이 단위를 비교하게 합니다.",
  learningQuestions: [
    "mm와 cm는 어떤 물건으로 비교할 수 있나요?",
    "m와 km를 같은 그림에서 비교하면 무엇이 달라 보이나요?",
  ],
  hasHtmlArtifact: true,
  previewBlockTitle: "길이 비교 실험",
  blockCount: 1,
  participantCount: 8,
  completedCount: 6,
};

describe("PublicMaterialGallery", () => {
  it("renders a public library card with preview, reuse, play, and report actions", () => {
    render(<PublicMaterialGallery assignments={[baseAssignment]} />);

    expect(
      screen.getByRole("heading", {
        name: "선생님들이 만든 움직이는 수업자료를 바로 열어보세요",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("길이 단위 감각 자료")).toBeInTheDocument();
    expect(screen.getByText(/만든 선생님 김수학 선생님/)).toBeInTheDocument();
    expect(screen.getAllByText("미리보기 가능").length).toBeGreaterThan(0);
    expect(screen.getByText(/교실 물건과 학교 건물/)).toBeInTheDocument();
    expect(
      screen.getByText(/mm와 cm는 어떤 물건으로 비교할 수 있나요/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /자료 미리보기/ })).toHaveAttribute(
      "href",
      "/teacher/activities/assignment-123",
    );
    expect(
      screen.getByRole("link", { name: /복제해서 내 자료로 만들기/ }),
    ).toHaveAttribute("href", "/?reuseAssignmentId=assignment-123");
    expect(
      screen.getByRole("link", { name: /학생 참여 화면/ }),
    ).toHaveAttribute("href", "/play/ABC123");
    expect(screen.getByRole("link", { name: /결과 보기/ })).toHaveAttribute(
      "href",
      "/teacher/assignments/assignment-123",
    );
  });

  it("falls back to MathPro teacher when creator name is missing", () => {
    render(
      <PublicMaterialGallery
        assignments={[
          {
            ...baseAssignment,
            creatorName: undefined,
          },
        ]}
      />,
    );

    expect(
      screen.getByText(/만든 선생님 수학프로 선생님/),
    ).toBeInTheDocument();
  });

  it("filters public assignments by preview availability", () => {
    const withoutPreview: PublishedAssignmentListItem = {
      ...baseAssignment,
      id: "assignment-456",
      code: "DEF456",
      hasHtmlArtifact: false,
      previewBlockTitle: undefined,
    };

    expect(
      filterPublicAssignments([baseAssignment, withoutPreview], "preview"),
    ).toEqual([baseAssignment]);
  });

  it("keeps more than fifty public materials visible", () => {
    const assignments = Array.from({ length: 51 }, (_, index) => ({
      ...baseAssignment,
      id: `assignment-${index + 1}`,
      activityId: `activity-${index + 1}`,
      code: `A${String(index + 1).padStart(5, "0")}`,
      title: `공개 자료 ${index + 1}`,
    }));

    render(<PublicMaterialGallery assignments={assignments} />);

    expect(screen.getByText("공개 자료 1")).toBeInTheDocument();
    expect(screen.getByText("공개 자료 51")).toBeInTheDocument();
    expect(screen.getAllByText("51").length).toBeGreaterThan(0);
  });

  it("does not link closed materials to the student play route", () => {
    render(
      <PublicMaterialGallery
        assignments={[
          {
            ...baseAssignment,
            status: "closed",
          },
        ]}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /학생 참여 화면/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("참여 종료됨")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /자료 미리보기/ })).toHaveAttribute(
      "href",
      "/teacher/activities/assignment-123",
    );
  });
});
