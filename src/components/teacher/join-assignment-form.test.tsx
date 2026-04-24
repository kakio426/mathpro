import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JoinAssignmentForm } from "./join-assignment-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("JoinAssignmentForm", () => {
  beforeEach(() => {
    push.mockReset();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("normalizes a classroom code, checks it, stores it, and enters play", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ assignment: {} })));

    render(<JoinAssignmentForm />);

    await user.type(
      screen.getByLabelText("선생님이 알려준 코드"),
      "ab c-123",
    );
    await user.click(screen.getByRole("button", { name: /활동 화면으로 입장/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/play/ABC123"));
    expect(fetchMock).toHaveBeenCalledWith("/api/assignments/ABC123", {
      method: "GET",
    });
    expect(
      JSON.parse(
        window.localStorage.getItem("mathpro:recent-assignment-codes") ?? "[]",
      ),
    ).toEqual(["ABC123"]);
  });

  it("shows a friendly local validation message for a short code", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<JoinAssignmentForm />);

    await user.type(screen.getByLabelText("선생님이 알려준 코드"), "a1");
    await user.click(screen.getByRole("button", { name: /활동 화면으로 입장/ }));

    expect(
      screen.getByText(/참여 코드는 보통 6자리예요/),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("explains when a code cannot be found", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }));

    render(<JoinAssignmentForm />);

    await user.type(screen.getByLabelText("선생님이 알려준 코드"), "missing");
    await user.click(screen.getByRole("button", { name: /활동 화면으로 입장/ }));

    expect(
      await screen.findByText(/코드를 찾지 못했어요/),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("lets students pick a recent code from the same browser", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "mathpro:recent-assignment-codes",
      JSON.stringify(["ABC123", "DEF456"]),
    );

    render(<JoinAssignmentForm />);

    await user.click(screen.getByRole("button", { name: "DEF 456" }));

    expect(screen.getByLabelText("선생님이 알려준 코드")).toHaveValue("DEF 456");
  });
});
