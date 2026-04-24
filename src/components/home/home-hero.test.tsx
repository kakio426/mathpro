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
  it("renders the teacher authoring workspace", () => {
    render(<HomeHero />);

    expect(
      screen.getByRole("heading", {
        name: "HTML 인터랙티브 자료 만들기",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(`${siteConfig.name}`)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /HTML 자료 문서 만들기/ }),
    ).toBeInTheDocument();
  });
});
