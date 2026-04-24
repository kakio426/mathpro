import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublishedAssignmentListItem } from "@/types/teacher";
import { TeacherActivityList } from "./teacher-activity-list";

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

const assignment: PublishedAssignmentListItem = {
  id: "assignment-123",
  activityId: "activity-123",
  code: "ABC123",
  status: "active",
  publishedAt: "2026-04-25T10:00:00.000Z",
  shareUrl: "http://localhost:3000/play/ABC123",
  title: "분수 막대 조작 자료",
  concept: "분수의 의미",
  goal: "막대를 직접 조작하며 전체와 부분의 관계를 설명한다.",
  gradeBand: "3-4",
  difficulty: "standard",
  sourceLessonSlug: "whole-and-part",
  blockCount: 1,
  participantCount: 4,
  completedCount: 3,
};

describe("TeacherActivityList", () => {
  it("renders published assignments with student and report links", () => {
    render(<TeacherActivityList assignments={[assignment]} />);

    expect(
      screen.getByRole("heading", {
        name: "다시 꺼내 쓰는 수업자료 보관함",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("참여 코드 ABC123")).toBeInTheDocument();
    expect(screen.getByText("분수 막대 조작 자료")).toBeInTheDocument();
    expect(screen.getByText("참여 4")).toBeInTheDocument();
    expect(screen.getByText("완료 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /학생 화면/ })).toHaveAttribute(
      "href",
      "/play/ABC123",
    );
    expect(screen.getByRole("link", { name: /결과 보기/ })).toHaveAttribute(
      "href",
      "/teacher/assignments/assignment-123",
    );
  });

  it("shows a friendly empty state when there are no assignments", () => {
    render(<TeacherActivityList assignments={[]} />);

    expect(screen.getByText("아직 발행한 자료가 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /첫 자료 만들기/ })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("renders the distribution board copy for sharing workflows", () => {
    render(<TeacherActivityList assignments={[assignment]} mode="distribution" />);

    expect(
      screen.getByRole("heading", {
        name: "수업 직전에 바로 공유하는 배포 보드",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("공유 가능한 자료")).toBeInTheDocument();
    expect(screen.getByText("참여 코드 ABC123")).toBeInTheDocument();
  });

  it("renders the reports board copy for result workflows", () => {
    render(<TeacherActivityList assignments={[assignment]} mode="reports" />);

    expect(
      screen.getByRole("heading", {
        name: "학생 조작 흐름을 다시 읽는 결과 보드",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("리포트 자료")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /결과 보기/ })).toHaveAttribute(
      "href",
      "/teacher/assignments/assignment-123",
    );
  });

  it("shows a recoverable load error without hiding the page", () => {
    render(
      <TeacherActivityList
        assignments={[]}
        loadError="Supabase 연결을 확인해 주세요."
      />,
    );

    expect(screen.getByText("자료 목록을 불러오지 못했어요.")).toBeInTheDocument();
    expect(screen.getByText("Supabase 연결을 확인해 주세요.")).toBeInTheDocument();
  });
});
