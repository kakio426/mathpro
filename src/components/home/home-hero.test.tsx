import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeHero } from "@/components/home/home-hero";
import { siteConfig } from "@/lib/site";

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
  it("renders the current learning entry links", () => {
    render(<HomeHero />);

    expect(
      screen.getByRole("heading", {
        name: new RegExp(`분수 개념을 문제풀이가 아니라 사고의 흐름으로 설계하는 ${siteConfig.name}`),
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /학습 시작/ })).toHaveAttribute(
      "href",
      "/lab/whole-and-part",
    );
    expect(screen.getByRole("link", { name: /리포트 상태 보기/ })).toHaveAttribute(
      "href",
      "/report/demo-session",
    );
  });
});
