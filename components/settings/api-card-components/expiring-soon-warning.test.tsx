import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpiringSoonWarning } from "./expiring-soon-warning";

describe("ExpiringSoonWarning", () => {
  const defaultProps = {
    daysUntilExpiry: 5,
    isRedirecting: false,
    onReconnect: vi.fn(),
  };

  it("renders warning with days count", () => {
    render(<ExpiringSoonWarning {...defaultProps} />);
    expect(screen.getByText("Connection Expiring Soon")).toBeInTheDocument();
    expect(screen.getByText(/expires in 5 days/i)).toBeInTheDocument();
  });

  it("calls onReconnect when button is clicked", async () => {
    const user = userEvent.setup();
    const onReconnect = vi.fn();
    render(
      <ExpiringSoonWarning {...defaultProps} onReconnect={onReconnect} />
    );

    await user.click(screen.getByRole("button", { name: /reconnect/i }));
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it("disables button when redirecting", () => {
    render(<ExpiringSoonWarning {...defaultProps} isRedirecting={true} />);
    expect(screen.getByRole("button", { name: /reconnect/i })).toBeDisabled();
  });
});
