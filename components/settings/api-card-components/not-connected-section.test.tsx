import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotConnectedSection } from "./not-connected-section";

describe("NotConnectedSection", () => {
  const defaultProps = {
    isRedirecting: false,
    onConnect: vi.fn(),
  };

  it("renders not connected state", () => {
    render(<NotConnectedSection {...defaultProps} />);
    expect(screen.getByText("Connect to Pollinations")).toBeInTheDocument();
    expect(screen.getByText(/zero API costs/i)).toBeInTheDocument();
  });

  it("calls onConnect when button is clicked", async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<NotConnectedSection {...defaultProps} onConnect={onConnect} />);

    await user.click(
      screen.getByRole("button", { name: /connect with pollinations/i })
    );
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("disables button when redirecting", () => {
    render(<NotConnectedSection {...defaultProps} isRedirecting={true} />);
    expect(
      screen.getByRole("button", { name: /connect with pollinations/i })
    ).toBeDisabled();
  });
});
