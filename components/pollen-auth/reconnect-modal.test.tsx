import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReconnectModal } from "./reconnect-modal";

// Mock the usePollenAuth hook
let mockAuthState = {
  isExpired: false,
  isAuthorized: false,
  isLoading: false,
};

vi.mock("@/lib/pollen-auth", () => ({
  usePollenAuth: () => mockAuthState,
}));

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
    mockAuthState = {
      isExpired: false,
      isAuthorized: false,
      isLoading: false,
    };
  });

  it("does not render when not expired", () => {
    mockAuthState.isExpired = false;
    mockAuthState.isAuthorized = true;

    render(<ReconnectModal />);

    expect(screen.queryByText(/connection expired/i)).not.toBeInTheDocument();
  });

  it("renders when key is expired and not authorized", () => {
    mockAuthState.isExpired = true;
    mockAuthState.isAuthorized = false;

    render(<ReconnectModal />);

    expect(screen.getByText(/connection expired/i)).toBeInTheDocument();
    expect(
      screen.getByText(/your pollinations connection has expired/i)
    ).toBeInTheDocument();
  });

  it("does not render while loading", () => {
    mockAuthState.isExpired = true;
    mockAuthState.isAuthorized = false;
    mockAuthState.isLoading = true;

    render(<ReconnectModal />);

    expect(screen.queryByText(/connection expired/i)).not.toBeInTheDocument();
  });

  it("shows reconnect benefits", () => {
    mockAuthState.isExpired = true;
    mockAuthState.isAuthorized = false;

    render(<ReconnectModal />);

    expect(screen.getByText(/zero api costs for generating/i)).toBeInTheDocument();
    expect(screen.getByText(/full access to all models/i)).toBeInTheDocument();
    expect(
      screen.getByText(/secure, temporary 30-day connection/i)
    ).toBeInTheDocument();
  });

  it("contains reconnect button", () => {
    mockAuthState.isExpired = true;
    mockAuthState.isAuthorized = false;

    render(<ReconnectModal />);

    expect(screen.getByTestId("connect-button")).toBeInTheDocument();
    expect(
      screen.getByText(/reconnect to pollinations/i)
    ).toBeInTheDocument();
  });

  it("renders when forceOpen is true regardless of auth state", () => {
    mockAuthState.isExpired = false;
    mockAuthState.isAuthorized = true;

    render(<ReconnectModal forceOpen={true} />);

    expect(screen.getByText(/connection expired/i)).toBeInTheDocument();
  });

  it("does not render when forceOpen is false even if expired", () => {
    mockAuthState.isExpired = true;
    mockAuthState.isAuthorized = false;

    render(<ReconnectModal forceOpen={false} />);

    expect(screen.queryByText(/connection expired/i)).not.toBeInTheDocument();
  });
});
