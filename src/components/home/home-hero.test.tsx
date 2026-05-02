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
        name: "자료를 고르고, 내 수업에 맞게 바꾸세요",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("수학프로 제작실")).toBeInTheDocument();
    expect(screen.getByText("최근 만들어진 교육자료")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "직접 새로 만들기" }),
    ).toBeInTheDocument();
  });
});
