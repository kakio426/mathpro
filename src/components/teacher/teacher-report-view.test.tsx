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
    "분수 막대 자료에서 학생 3명이 9번 직접 만졌고, 제출 3번과 완료 2번이 남았습니다.",
  ],
  dwellPatterns: [
    "분수 막대 자료에서 첫 제출까지 15초 이상 머문 학생이 2명 있습니다.",
  ],
  misconceptionSignals: [
    "분수 막대 자료에서 \"선택한 조각 수와 목표 분수가 맞지 않음\" 신호가 2번 보였습니다.",
  ],
  nextTeachingMoves: [
    "가장 많이 만진 장면을 다시 보여주고, 학생에게 \"처음에는 무엇을 기준으로 골랐니?\"라고 물어보세요.",
  ],
  sessionDetails: [
    {
      sessionId: "session-1",
      label: "참여자 1",
      status: "completed",
      startedAt: "2026-04-25T10:00:00.000Z",
      completedAt: "2026-04-25T10:04:00.000Z",
      latestEventAt: "2026-04-25T10:04:00.000Z",
      eventCount: 12,
      submitCount: 3,
      incorrectSubmitCount: 1,
      hintCount: 1,
      retryCount: 1,
      firstEventAt: "2026-04-25T10:00:10.000Z",
      lastEventAt: "2026-04-25T10:04:00.000Z",
      topActivityTitle: "분수 막대 HTML 자료",
      lastResponse: "2/4",
      observation:
        "맞지 않은 제출이 1번 있었습니다. 정답을 바로 알려주기보다 선택 기준을 확인해 보세요.",
    },
  ],
  activitySummaries: [
    {
      activityId: "html-artifact-1",
      title: "분수 막대 HTML 자료",
      blockType: "html-artifact",
      eventCount: 12,
      sessionCount: 1,
      submitCount: 3,
      incorrectSubmitCount: 1,
      hintCount: 1,
      retryCount: 1,
      completeCount: 1,
      firstEventAt: "2026-04-25T10:00:10.000Z",
      lastEventAt: "2026-04-25T10:04:00.000Z",
      summary:
        "학생 1명이 이 장면을 지나갔고, 조작 기록 12번, 제출 3번, 완료 1번이 남았습니다.",
      nextAction:
        "맞지 않은 제출이 나온 장면을 다시 보여주고, 학생에게 \"무엇을 기준으로 골랐니?\"를 짧게 말하게 해 보세요.",
    },
  ],
};

describe("TeacherReportView", () => {
  it("renders the four teacher-facing process analysis blocks", () => {
    render(<TeacherReportView report={report} />);

    expect(
      screen.getByRole("heading", { name: "분수의 의미 인터랙티브 탐구" }),
    ).toBeInTheDocument();
    expect(screen.getByText("참여 코드 ABC123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /다시 수정해서 쓰기/ })).toHaveAttribute(
      "href",
      "/?reuseAssignmentId=assignment-1",
    );
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

    expect(screen.getByText(/9번 직접 만졌고/)).toBeInTheDocument();
    expect(screen.getByText(/15초 이상/)).toBeInTheDocument();
    expect(
      screen.getByText(/선택한 조각 수와 목표 분수가 맞지 않음/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/selected-parts-mismatch/)).not.toBeInTheDocument();
    expect(screen.getByText(/처음에는 무엇을 기준으로 골랐니/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "누가 어떻게 활동했는가" })).toBeInTheDocument();
    expect(screen.getByText("참여자 1")).toBeInTheDocument();
    expect(screen.getByText(/맞지 않은 제출이 1번/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "어느 블록에서 무엇이 쌓였는가" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/조작 기록 12번/)).toBeInTheDocument();
  });
});
