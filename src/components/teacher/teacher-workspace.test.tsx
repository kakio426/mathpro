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
  it("preloads a published assignment as editable source material", async () => {
    const user = userEvent.setup();

    render(<TeacherWorkspace reuseSource={reuseSource} />);

    expect(screen.getByText("불러온 자료로 다시 만들기")).toBeInTheDocument();
    expect(screen.getByText(/원본 참여 코드 ABC123/)).toBeInTheDocument();

    await user.click(screen.getByText("수업 조건 더 보기"));
    expect(screen.getByLabelText("개념")).toHaveValue("분수의 의미");
    expect(screen.getByLabelText("수업 목표")).toHaveValue(
      "전체와 부분의 관계를 HTML 조작으로 설명한다.",
    );

    await user.click(screen.getByRole("button", { name: "AI 결과 가져오기" }));
    expect(
      screen.getByDisplayValue(/다시 쓸 HTML 자료/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /발행 준비하기/ }),
    ).toBeInTheDocument();
  });

  it("shows a recoverable message when reuse loading fails", () => {
    render(
      <TeacherWorkspace reuseLoadError="선택한 자료를 찾지 못했습니다." />,
    );

    expect(screen.getByText("기존 자료를 불러오지 못했어요.")).toBeInTheDocument();
    expect(screen.getByText("선택한 자료를 찾지 못했습니다.")).toBeInTheDocument();
  });

  it("keeps the AI result import hidden until teachers open the import dialog", async () => {
    const user = userEvent.setup();

    render(<TeacherWorkspace />);

    expect(
      screen.getByText("학생 화면은 자료를 가져오면 바로 나타납니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /발행 준비하기/ }),
    ).toBeDisabled();
    expect(screen.queryByLabelText("AI가 만든 자료")).not.toBeInTheDocument();
    expect(screen.queryByText("고급 설정")).not.toBeInTheDocument();
    for (const technicalTerm of screen.queryAllByText(
      /interactive-lesson\.html|html-artifact|allowedEvents/,
    )) {
      expect(technicalTerm).not.toBeVisible();
    }

    await user.type(
      screen.getByLabelText("만들고 싶은 자료"),
      "초등 4학년 수직선에서 3/4 찾기",
    );
    await user.click(screen.getByRole("button", { name: "AI 요청문 만들기" }));
    await user.click(screen.getByRole("button", { name: "AI 결과 가져오기" }));

    expect(screen.getByLabelText("AI가 만든 자료")).toBeVisible();
  });

  it("creates a copy-focused prompt from only a topic", async () => {
    const user = userEvent.setup();

    render(<TeacherWorkspace />);

    expect(
      screen.queryByRole("button", { name: "요청문 복사하기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "AI 결과 가져오기" }),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText("만들고 싶은 자료"),
      "초등 4학년 수직선에서 3/4 찾기",
    );
    await user.click(screen.getByRole("button", { name: "AI 요청문 만들기" }));

    expect(screen.getByText("요청문이 준비됐습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "요청문 복사하기" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "AI 결과 가져오기" }),
    ).toBeEnabled();
    expect(
      screen.getByText("초등 4학년 수직선에서 3/4 찾기"),
    ).toBeInTheDocument();
    for (const technicalTerm of screen.queryAllByText("postMessage")) {
      expect(technicalTerm).not.toBeVisible();
    }
  });

  it("shows teacher-friendly help only inside the import dialog help", async () => {
    const user = userEvent.setup();

    render(<TeacherWorkspace />);

    expect(screen.queryByText("선생님 용어 도움말")).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText("만들고 싶은 자료"),
      "초등 4학년 수직선에서 3/4 찾기",
    );
    await user.click(screen.getByRole("button", { name: "AI 요청문 만들기" }));
    await user.click(screen.getByRole("button", { name: "AI 결과 가져오기" }));

    expect(screen.getByText("문제가 생겼나요?")).toBeInTheDocument();
    expect(screen.getByText("선생님 용어 도움말")).not.toBeVisible();

    await user.click(screen.getByText("문제가 생겼나요?"));

    expect(screen.getByText("선생님 용어 도움말")).toBeVisible();
    expect(screen.getByText("학생 화면 보호 확인")).toBeVisible();
  });

  it("turns imported AI material into the student preview", async () => {
    const user = userEvent.setup();

    render(<TeacherWorkspace />);

    await user.type(
      screen.getByLabelText("만들고 싶은 자료"),
      "초등 4학년 수직선에서 3/4 찾기",
    );
    await user.click(screen.getByRole("button", { name: "AI 요청문 만들기" }));
    await user.click(screen.getByRole("button", { name: "AI 결과 가져오기" }));
    await user.type(
      screen.getByLabelText("AI가 만든 자료"),
      `1. 교사용 한 줄: 수직선 위에서 3/4 위치를 직접 움직이며 찾게 합니다.

2. HTML 코드:
\`\`\`html
<!doctype html><html><body><h1>수직선 활동</h1></body></html>
\`\`\`

3. 학습 질문:
1. 0과 1 사이를 몇 칸으로 나누었나요?
2. 3/4은 0에서 몇 칸 이동한 위치인가요?
3. 간격이 같지 않으면 어떤 문제가 생기나요?`,
    );
    await user.click(screen.getByRole("button", { name: "미리보기로 가져오기" }));

    expect(
      screen.getByTitle("학생에게 보일 수업자료 미리보기"),
    ).toBeInTheDocument();
    expect(screen.getByText("수업에서 이렇게 활용하세요")).toBeInTheDocument();
    expect(
      screen.getByText("수직선 위에서 3/4 위치를 직접 움직이며 찾게 합니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("학습 질문")).toBeInTheDocument();
    expect(
      screen.getByText("0과 1 사이를 몇 칸으로 나누었나요?"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("AI가 만든 자료")).not.toBeInTheDocument();
  });

  it("shows a friendly import error when the AI response has no runnable material", async () => {
    const user = userEvent.setup();

    render(<TeacherWorkspace />);

    await user.type(
      screen.getByLabelText("만들고 싶은 자료"),
      "초등 4학년 길이 단위 비교하기",
    );
    await user.click(screen.getByRole("button", { name: "AI 요청문 만들기" }));
    await user.click(screen.getByRole("button", { name: "AI 결과 가져오기" }));
    await user.type(
      screen.getByLabelText("AI가 만든 자료"),
      "교사용 한 줄: 아직 실행 자료가 없습니다.",
    );
    await user.click(screen.getByRole("button", { name: "미리보기로 가져오기" }));

    expect(
      screen.getByText(
        "HTML 부분을 찾지 못했어요. Gemini 답변 전체를 다시 붙여넣어 주세요.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("AI가 만든 자료")).toBeVisible();
  });

  it("lets teachers apply a ready-made number-line template", async () => {
    const user = userEvent.setup();

    render(<TeacherWorkspace />);

    await user.click(
      screen.getByRole("button", { name: "수직선 위치 찾기 샘플 사용하기" }),
    );

    await user.click(screen.getByText("수업 조건 더 보기"));
    expect(screen.getByLabelText("개념")).toHaveValue("수직선 위 분수");
    expect(screen.getByLabelText("활동 유형")).toHaveValue("number-line");
    expect(screen.getByLabelText("수업 목표")).toHaveValue(
      "0과 1 사이를 같은 간격으로 나누어 3/4의 위치를 찾고 설명한다.",
    );

    expect(
      screen.getByTitle("학생에게 보일 수업자료 미리보기"),
    ).toBeInTheDocument();
  });
});
