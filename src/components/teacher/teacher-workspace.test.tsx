import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { TeacherWorkspaceReuseSource } from "./teacher-workspace";
import { TeacherWorkspace } from "./teacher-workspace";

const now = "2026-04-25T10:00:00.000Z";

const reuseSource: TeacherWorkspaceReuseSource = {
  assignmentId: "assignment-123",
  code: "ABC123",
  title: "분수 막대 조작 자료",
  document: {
    id: "activity-123",
    title: "분수 막대 조작 자료",
    gradeBand: "3-4",
    concept: "분수의 의미",
    goal: "전체와 부분의 관계를 HTML 조작으로 설명한다.",
    difficulty: "standard",
    sourceLessonSlug: "whole-and-part",
    status: "published",
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        id: "html-artifact-1",
        type: "html-artifact",
        title: "분수 막대 HTML 자료",
        instruction: "분수 막대를 직접 조작합니다.",
        interactionKind: "html-artifact",
        html: "<!doctype html><html><body>다시 쓸 HTML 자료</body></html>",
        promptTemplate: "분수 막대 자료를 다시 만들어줘.",
        analysisHooks: [
          {
            id: "html-artifact-1:manipulation-pattern",
            signal: "manipulation-pattern",
            label: "조작 패턴",
          },
        ],
      },
    ],
  },
};

describe("TeacherWorkspace", () => {
  it("preloads a published assignment as editable source material", () => {
    render(<TeacherWorkspace reuseSource={reuseSource} />);

    expect(screen.getByText("불러온 자료로 다시 만들기")).toBeInTheDocument();
    expect(screen.getByText(/원본 코드 ABC123/)).toBeInTheDocument();
    expect(screen.getByLabelText("개념")).toHaveValue("분수의 의미");
    expect(screen.getByLabelText("수업 목표")).toHaveValue(
      "전체와 부분의 관계를 HTML 조작으로 설명한다.",
    );
    expect(
      screen.getByDisplayValue(/다시 쓸 HTML 자료/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /자료 문서 만들기/ }),
    ).toBeInTheDocument();
  });

  it("shows a recoverable message when reuse loading fails", () => {
    render(
      <TeacherWorkspace reuseLoadError="선택한 자료를 찾지 못했습니다." />,
    );

    expect(screen.getByText("기존 자료를 불러오지 못했어요.")).toBeInTheDocument();
    expect(screen.getByText("선택한 자료를 찾지 못했습니다.")).toBeInTheDocument();
  });

  it("shows teacher-friendly help next to technical workflow terms", () => {
    render(<TeacherWorkspace />);

    expect(screen.getByText("선생님 용어 도움말")).toBeInTheDocument();
    expect(screen.getByText("학생 화면 보호 확인")).toBeInTheDocument();
  });

  it("lets teachers apply a ready-made number-line template", async () => {
    const user = userEvent.setup();

    render(<TeacherWorkspace />);

    await user.click(
      screen.getByRole("button", { name: "수직선 위치 찾기 예시 넣기" }),
    );

    expect(screen.getByLabelText("개념")).toHaveValue("수직선 위 분수");
    expect(screen.getByLabelText("활동 타입")).toHaveValue("number-line");
    expect(screen.getByLabelText("수업 목표")).toHaveValue(
      "0과 1 사이를 같은 간격으로 나누어 3/4의 위치를 찾고 설명한다.",
    );
    expect(
      screen.getByDisplayValue(/수직선에서 3\/4 찾기/),
    ).toBeInTheDocument();
  });
});
