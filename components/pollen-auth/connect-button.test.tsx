import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectButton } from "./connect-button";

// Mock the usePollenAuth hook
const mockAuthorize = vi.fn();
vi.mock("@/lib/pollen-auth", () => ({
  usePollenAuth: () => ({
    authorize: mockAuthorize,
    isLoading: false,
  }),
}));

describe("ConnectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default text", () => {
    render(<ConnectButton />);
    expect(
      screen.getByRole("button", { name: /connect with pollinations/i })
    ).toBeInTheDocument();
  });

  it("renders with custom children text", () => {
    render(<ConnectButton>Get Started Free</ConnectButton>);
    expect(
      screen.getByRole("button", { name: /get started free/i })
    ).toBeInTheDocument();
  });

  it("calls authorize when clicked", async () => {
    const user = userEvent.setup();
    render(<ConnectButton />);

    const button = screen.getByRole("button", {
      name: /connect with pollinations/i,
    });
    await user.click(button);

    expect(mockAuthorize).toHaveBeenCalledTimes(1);
  });

  it("shows badge when showBadge is true", () => {
    render(<ConnectButton showBadge />);
    expect(screen.getByText(/zero api costs/i)).toBeInTheDocument();
    expect(screen.getByText(/one-click setup/i)).toBeInTheDocument();
  });

  it("does not show badge by default", () => {
    render(<ConnectButton />);
    expect(screen.queryByText(/zero api costs/i)).not.toBeInTheDocument();
  });

  it("renders zap icon by default", () => {
    render(<ConnectButton />);
    // The button should contain an svg icon
    const button = screen.getByRole("button");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("respects disabled prop", () => {
    render(<ConnectButton disabled />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<ConnectButton className="custom-class" />);
    // The className is applied to the wrapper div, not the button
    const wrapper = screen.getByRole("button").parentElement;
    expect(wrapper).toHaveClass("custom-class");
  });
});
