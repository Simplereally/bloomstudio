import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReconnectModal } from "./reconnect-modal";

// Mock the ConnectButton since it's tested separately
vi.mock("./connect-button", () => ({
  ConnectButton: ({
    children,
    size,
    className,
  }: {
    children: React.ReactNode;
    size?: string;
    className?: string;
  }) => (
    <button data-testid="connect-button" data-size={size} className={className}>
      {children}
    </button>
  ),
}));

describe("ReconnectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when open is false", () => {
    render(<ReconnectModal open={false} onOpenChange={() => {}} />);

    expect(screen.queryByText(/connection issue/i)).not.toBeInTheDocument();
  });

  it("renders when open is true", () => {
    render(<ReconnectModal open={true} onOpenChange={() => {}} />);

    expect(screen.getByText(/connection issue/i)).toBeInTheDocument();
    expect(
      screen.getByText(/your pollinations connection is no longer valid/i)
    ).toBeInTheDocument();
  });

  it("shows reconnect benefits", () => {
    render(<ReconnectModal open={true} onOpenChange={() => {}} />);

    expect(
      screen.getByText(/zero api costs for generating/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/full access to all models/i)).toBeInTheDocument();
    expect(
      screen.getByText(/secure connection to pollinations/i)
    ).toBeInTheDocument();
  });

  it("contains reconnect button", () => {
    render(<ReconnectModal open={true} onOpenChange={() => {}} />);

    expect(screen.getByTestId("connect-button")).toBeInTheDocument();
    expect(
      screen.getByText(/reconnect to pollinations/i)
    ).toBeInTheDocument();
  });

  it("contains redirect info text", () => {
    render(<ReconnectModal open={true} onOpenChange={() => {}} />);

    expect(
      screen.getByText(/this will redirect you to pollinations/i)
    ).toBeInTheDocument();
  });
});
