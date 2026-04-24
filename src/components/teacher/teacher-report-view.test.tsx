import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TeacherReportSummary } from "@/types/teacher";
import { TeacherReportView } from "./teacher-report-view";

const report: TeacherReportSummary = {
  assignmentId: "assignment-1",
  code: "ABC123",
  activityTitle: "분수의 의미 인터랙티브 탐구",
  participantCount: 3,
  completedCount: 2,
  eventCount: 18,
  manipulationPatterns: [
    "분수 막대 HTML 자료: 선택/드래그/상호작용 9회, 제출/완료 3회가 기록되었습니다.",
  ],
  dwellPatterns: [
    "분수 막대 HTML 자료: 2개 세션에서 첫 제출까지 15초 이상 머물렀습니다.",
  ],
  misconceptionSignals: [
    "selected-parts-mismatch: 2회 관찰되었습니다.",
  ],
  nextTeachingMoves: [
    "분수 막대 HTML 자료 조작 장면을 다음 수업의 출발 질문으로 다시 보여주세요.",
  ],
};

describe("TeacherReportView", () => {
  it("renders the four teacher-facing process analysis blocks", () => {
    render(<TeacherReportView report={report} />);

    expect(
      screen.getByRole("heading", { name: "분수의 의미 인터랙티브 탐구" }),
    ).toBeInTheDocument();
    expect(screen.getByText("참여 코드 ABC123")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "학생이 어떤 조작을 했는가" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "어디서 오래 머물렀는가" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "어떤 오개념 신호가 보였는가" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "다음 수업에서 무엇을 보완할 것인가",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/선택\/드래그\/상호작용 9회/)).toBeInTheDocument();
    expect(screen.getByText(/15초 이상/)).toBeInTheDocument();
    expect(screen.getByText(/selected-parts-mismatch/)).toBeInTheDocument();
    expect(screen.getByText(/다음 수업의 출발 질문/)).toBeInTheDocument();
  });
});
