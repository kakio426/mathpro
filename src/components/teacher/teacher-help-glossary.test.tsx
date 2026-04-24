import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeacherHelpGlossary } from "./teacher-help-glossary";

describe("TeacherHelpGlossary", () => {
  it("explains technical terms in teacher-friendly language", () => {
    render(<TeacherHelpGlossary />);

    expect(screen.getByText("선생님 용어 도움말")).toBeInTheDocument();
    expect(screen.getByText("움직이는 수업자료 원본")).toBeInTheDocument();
    expect(screen.getByText("AI에게 보내는 제작 주문서")).toBeInTheDocument();
    expect(screen.getByText("학생 화면 보호 확인")).toBeInTheDocument();
    expect(screen.getByText("학생이 만진 과정")).toBeInTheDocument();
    expect(screen.getByText("로그인 없는 입장 번호")).toBeInTheDocument();
  });
});

