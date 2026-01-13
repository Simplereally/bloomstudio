import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ByopExpiredSection } from "./byop-expired-section";

describe("ByopExpiredSection", () => {
  const defaultProps = {
    isRedirecting: false,
    onReconnect: vi.fn(),
  };

  it("renders expired alert", () => {
    render(<ByopExpiredSection {...defaultProps} />);
    expect(screen.getByText("Connection Expired")).toBeInTheDocument();
    expect(
      screen.getByText(/Your Pollinations connection has expired/i)
    ).toBeInTheDocument();
  });

  it("calls onReconnect when button is clicked", async () => {
    const user = userEvent.setup();
    const onReconnect = vi.fn();
    render(<ByopExpiredSection {...defaultProps} onReconnect={onReconnect} />);

    await user.click(screen.getByRole("button", { name: /reconnect now/i }));
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it("disables button when redirecting", () => {
    render(<ByopExpiredSection {...defaultProps} isRedirecting={true} />);
    expect(
      screen.getByRole("button", { name: /reconnect now/i })
    ).toBeDisabled();
  });
});
