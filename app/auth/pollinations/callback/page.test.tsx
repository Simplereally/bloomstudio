/**
 * Tests for the Pollinations OAuth callback page.
 *
 * These tests focus on the security validation of the returnTo parameter
 * to prevent open-redirect attacks.
 *
 * Performance Note: Uses fake timers to avoid waiting for real delays
 * (100ms processing + 3s countdown = 3.1s per test without fake timers).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import PollinationsCallbackPage from "./page";

// Mock next/navigation
const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock pollen-auth
vi.mock("@/lib/pollen-auth", () => ({
  CALLBACK_KEY_PARAM: "api_key",
  isValidApiKeyFormat: vi.fn((key: string) => key.startsWith("sk_")),
  buildAuthorizationUrl: vi.fn(() => "https://pollinations.ai/authorize"),
  getCallbackUrl: vi.fn(() => "https://example.com/auth/pollinations/callback"),
}));

// Mock Convex
const mockSetApiKey = vi.fn().mockResolvedValue({ success: true });

vi.mock("convex/react", () => ({
  useMutation: () => mockSetApiKey,
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      setPollinationsApiKey: "setPollinationsApiKey",
    },
  },
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/** Time constants matching the component implementation */
const PROCESSING_DELAY_MS = 100;
const COUNTDOWN_SECONDS = 3;
const COUNTDOWN_MS = COUNTDOWN_SECONDS * 1000;

describe("PollinationsCallbackPage", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        hash: "",
        pathname: "/auth/pollinations/callback",
        search: "",
        origin: "https://example.com",
        href: "https://example.com/auth/pollinations/callback",
      },
      writable: true,
    });

    // Mock window.history.replaceState
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  /**
   * Helper to advance past the initial processing delay.
   * The component waits 100ms before parsing the hash for browser timing quirks.
   */
  async function advancePastProcessingDelay() {
    await act(async () => {
      vi.advanceTimersByTime(PROCESSING_DELAY_MS);
    });
  }

  /**
   * Helper to advance through the full countdown timer.
   * After successful auth, the component counts down 3 seconds before redirecting.
   */
  async function advanceThroughCountdown() {
    await act(async () => {
      vi.advanceTimersByTime(COUNTDOWN_MS);
    });
  }

  /**
   * Helper to advance past processing and wait for success state.
   */
  async function advanceToSuccessState() {
    await advancePastProcessingDelay();
    // Allow React to process the state update
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
  }

  describe("returnTo validation (isSafeReturnTo)", () => {
    it("should accept valid local paths", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("/studio");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      expect(screen.getByText(/Successfully Connected/i)).toBeInTheDocument();

      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should accept nested local paths", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("/dashboard/settings/profile");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      expect(screen.getByText(/Successfully Connected/i)).toBeInTheDocument();

      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/dashboard/settings/profile");
    });

    it("should reject absolute URLs and fall back to /studio", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("https://evil.com");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      expect(screen.getByText(/Successfully Connected/i)).toBeInTheDocument();

      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should reject protocol-relative URLs (//)", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("//evil.com");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should reject javascript: protocol", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("javascript:alert(1)");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should reject data: protocol", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("data:text/html,<script>alert(1)</script>");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should reject paths with @ (potential username in URL)", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("/@evil.com");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should reject paths with encoded slashes (%2f)", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("/%2f/evil.com");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should reject paths with encoded backslashes (%5c)", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("/%5c/evil.com");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should reject paths with backslashes (potential Windows-style redirect)", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("/\\evil.com");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should default to /studio when returnTo is null", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue(null);

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });

    it("should default to /studio when returnTo is empty string", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      await advanceThroughCountdown();
      expect(mockPush).toHaveBeenCalledWith("/studio");
    });
  });

  describe("URL hash clearing", () => {
    it("should preserve query string when clearing hash", async () => {
      window.location.hash = "#api_key=sk_test123";
      window.location.search = "?returnTo=/dashboard";

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "/auth/pollinations/callback?returnTo=/dashboard",
      );
    });

    it("should work correctly when there is no query string", async () => {
      window.location.hash = "#api_key=sk_test123";
      window.location.search = "";

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "/auth/pollinations/callback",
      );
    });
  });

  describe("error states", () => {
    it("should show error when API key is missing", async () => {
      window.location.hash = "";
      mockGet.mockReturnValue("/studio");

      render(<PollinationsCallbackPage />);

      await advancePastProcessingDelay();

      expect(screen.getByText(/Authorization Cancelled/i)).toBeInTheDocument();
      expect(screen.getByText(/No API key was received/i)).toBeInTheDocument();
    });

    it("should show error when API key format is invalid", async () => {
      window.location.hash = "#api_key=invalid_key";
      mockGet.mockReturnValue("/studio");

      render(<PollinationsCallbackPage />);

      await advancePastProcessingDelay();

      expect(screen.getByText(/Invalid API Key/i)).toBeInTheDocument();
    });

    it("should show processing state initially", () => {
      window.location.hash = "#api_key=sk_test123";

      render(<PollinationsCallbackPage />);

      expect(
        screen.getByText(/Connecting to Pollinations/i),
      ).toBeInTheDocument();
    });
  });

  describe("countdown display", () => {
    it("should display countdown correctly", async () => {
      window.location.hash = "#api_key=sk_test123";
      mockGet.mockReturnValue("/studio");

      render(<PollinationsCallbackPage />);

      await advanceToSuccessState();
      expect(screen.getByText(/Redirecting in 3 seconds/i)).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/Redirecting in 2 seconds/i)).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/Redirecting in 1 seconds/i)).toBeInTheDocument();
    });
  });
});
