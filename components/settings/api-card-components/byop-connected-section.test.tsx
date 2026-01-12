import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ByopConnectedSection } from "./byop-connected-section";

describe("ByopConnectedSection", () => {
  const defaultProps = {
    daysUntilExpiry: 25,
    isRedirecting: false,
    onReconnect: vi.fn(),
    onDisconnect: vi.fn(),
  };

  it("renders connected state", () => {
    render(<ByopConnectedSection {...defaultProps} />);
    expect(screen.getByText("Connected via BYOP")).toBeInTheDocument();
  });

  it("shows days until expiry", () => {
    render(<ByopConnectedSection {...defaultProps} daysUntilExpiry={15} />);
    expect(screen.getByText(/15 days/)).toBeInTheDocument();
  });

  it("hides expiry when null", () => {
    render(<ByopConnectedSection {...defaultProps} daysUntilExpiry={null} />);
    expect(screen.queryByText(/days/)).not.toBeInTheDocument();
  });

  it("calls onReconnect when Reconnect button is clicked", async () => {
    const user = userEvent.setup();
    const onReconnect = vi.fn();
    render(<ByopConnectedSection {...defaultProps} onReconnect={onReconnect} />);

    await user.click(screen.getByRole("button", { name: /reconnect/i }));
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it("disables Reconnect button when redirecting", () => {
    render(<ByopConnectedSection {...defaultProps} isRedirecting={true} />);
    expect(screen.getByRole("button", { name: /reconnect/i })).toBeDisabled();
  });

  it("has Disconnect button that opens confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<ByopConnectedSection {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /disconnect/i }));
    expect(
      screen.getByText("Disconnect from Pollinations?")
    ).toBeInTheDocument();
  });

  it("calls onDisconnect when confirmed", async () => {
    const user = userEvent.setup();
    const onDisconnect = vi.fn();
    render(
      <ByopConnectedSection {...defaultProps} onDisconnect={onDisconnect} />
    );

    // Open dialog
    await user.click(screen.getByRole("button", { name: /disconnect/i }));

    // Confirm disconnect in dialog
    await user.click(screen.getByRole("button", { name: /^disconnect$/i }));

    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });
});
