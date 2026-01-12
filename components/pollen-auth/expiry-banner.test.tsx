import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpiryBanner } from "./expiry-banner";

// Mock the usePollenAuth hook
const mockAuthorize = vi.fn();
let mockAuthState = {
  isExpiringSoon: false,
  isExpired: false,
  daysUntilExpiry: null as number | null,
  authorize: mockAuthorize,
  isLoading: false,
};

vi.mock("@/lib/pollen-auth", () => ({
  usePollenAuth: () => mockAuthState,
}));

describe("ExpiryBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      isExpiringSoon: false,
      isExpired: false,
      daysUntilExpiry: null,
      authorize: mockAuthorize,
      isLoading: false,
    };
    // Clear sessionStorage
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("does not render when not expiring soon and not expired", () => {
    render(<ExpiryBanner />);
    expect(
      screen.queryByText(/pollinations connection/i)
    ).not.toBeInTheDocument();
  });

  it("renders expiring soon warning with days count", () => {
    mockAuthState.isExpiringSoon = true;
    mockAuthState.daysUntilExpiry = 5;

    render(<ExpiryBanner />);

    expect(
      screen.getByText(/pollinations connection expiring soon/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/expires in 5 days/i)).toBeInTheDocument();
  });

  it("renders expired state", () => {
    mockAuthState.isExpired = true;

    render(<ExpiryBanner />);

    expect(screen.getByText(/connection expired/i)).toBeInTheDocument();
    expect(
      screen.getByText(/your pollinations connection has expired/i)
    ).toBeInTheDocument();
  });

  it("shows 'tomorrow' for 1 day until expiry", () => {
    mockAuthState.isExpiringSoon = true;
    mockAuthState.daysUntilExpiry = 1;

    render(<ExpiryBanner />);

    expect(screen.getByText(/expires tomorrow/i)).toBeInTheDocument();
  });

  it("shows 'today' for 0 days until expiry", () => {
    mockAuthState.isExpiringSoon = true;
    mockAuthState.daysUntilExpiry = 0;

    render(<ExpiryBanner />);

    expect(screen.getByText(/expires today/i)).toBeInTheDocument();
  });

  it("calls authorize when reconnect is clicked", async () => {
    const user = userEvent.setup();
    mockAuthState.isExpiringSoon = true;
    mockAuthState.daysUntilExpiry = 3;

    render(<ExpiryBanner />);

    const reconnectButton = screen.getByRole("button", { name: /reconnect/i });
    await user.click(reconnectButton);

    expect(mockAuthorize).toHaveBeenCalledTimes(1);
  });

  it("can be dismissed when dismissible", async () => {
    const user = userEvent.setup();
    mockAuthState.isExpiringSoon = true;
    mockAuthState.daysUntilExpiry = 5;

    render(<ExpiryBanner dismissible />);

    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    await user.click(dismissButton);

    // Banner should be hidden after dismissal
    expect(
      screen.queryByText(/pollinations connection expiring soon/i)
    ).not.toBeInTheDocument();
  });

  it("persists dismissed state in sessionStorage", async () => {
    const user = userEvent.setup();
    mockAuthState.isExpiringSoon = true;
    mockAuthState.daysUntilExpiry = 5;

    render(<ExpiryBanner storageKey="test_dismiss" />);

    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    await user.click(dismissButton);

    expect(sessionStorage.getItem("test_dismiss")).toBe("true");
  });

  it("does not show dismiss button when not dismissible", () => {
    mockAuthState.isExpiringSoon = true;
    mockAuthState.daysUntilExpiry = 5;

    render(<ExpiryBanner dismissible={false} />);

    expect(
      screen.queryByRole("button", { name: /dismiss/i })
    ).not.toBeInTheDocument();
  });

  it("does not show dismiss button when expired", () => {
    mockAuthState.isExpired = true;

    render(<ExpiryBanner dismissible />);

    // Should not have dismiss button when expired (must reconnect)
    expect(
      screen.queryByRole("button", { name: /dismiss/i })
    ).not.toBeInTheDocument();
  });

  it("does not render while loading", () => {
    mockAuthState.isLoading = true;
    mockAuthState.isExpiringSoon = true;
    mockAuthState.daysUntilExpiry = 3;

    render(<ExpiryBanner />);

    expect(
      screen.queryByText(/pollinations connection/i)
    ).not.toBeInTheDocument();
  });
});
