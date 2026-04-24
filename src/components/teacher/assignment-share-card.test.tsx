import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssignmentShareCard } from "./assignment-share-card";

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

describe("AssignmentShareCard", () => {
  it("renders a classroom-ready code, QR image, and student link", () => {
    render(
      <AssignmentShareCard
        code="ABC123"
        shareUrl="http://localhost:3000/play/ABC123"
        title="교실 공유"
      />,
    );

    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "ABC123 학생 링크 QR" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "코드 복사" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "링크 복사" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /학생 화면/ })).toHaveAttribute(
      "href",
      "/play/ABC123",
    );
  });
});
