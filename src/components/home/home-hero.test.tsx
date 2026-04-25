import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeHero } from "@/components/home/home-hero";

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

describe("HomeHero", () => {
  it("renders the teacher authoring workspace", () => {
    render(<HomeHero />);

    expect(
      screen.getByRole("heading", {
        name: "어떤 수업자료를 만들까요?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("수학프로 제작실")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "AI 요청문 만들기" }),
    ).toBeInTheDocument();
  });
});
