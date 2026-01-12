import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExpiryBannerState } from "./use-expiry-banner-state";

// Mock the usePollenAuth hook
const mockAuthorize = vi.fn();
let mockPollenAuthState = {
  isExpiringSoon: false,
  isExpired: false,
  daysUntilExpiry: null as number | null,
  authorize: mockAuthorize,
  isLoading: false,
};

vi.mock("@/lib/pollen-auth", () => ({
  usePollenAuth: () => mockPollenAuthState,
}));

describe("useExpiryBannerState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPollenAuthState = {
      isExpiringSoon: false,
      isExpired: false,
      daysUntilExpiry: null,
      authorize: mockAuthorize,
      isLoading: false,
    };
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe("shouldShow logic", () => {
    it("returns shouldShow false when not expiring soon and not expired", () => {
      const { result } = renderHook(() => useExpiryBannerState());
      expect(result.current.shouldShow).toBe(false);
    });

    it("returns shouldShow true when expiring soon", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 5;

      const { result } = renderHook(() => useExpiryBannerState());
      expect(result.current.shouldShow).toBe(true);
    });

    it("returns shouldShow true when expired", () => {
      mockPollenAuthState.isExpired = true;

      const { result } = renderHook(() => useExpiryBannerState());
      expect(result.current.shouldShow).toBe(true);
    });

    it("returns shouldShow false when loading", () => {
      mockPollenAuthState.isLoading = true;
      mockPollenAuthState.isExpiringSoon = true;

      const { result } = renderHook(() => useExpiryBannerState());
      expect(result.current.shouldShow).toBe(false);
    });

    it("returns shouldShow false when dismissed", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 5;

      const { result } = renderHook(() => useExpiryBannerState());

      act(() => {
        result.current.handlers.handleDismiss();
      });

      expect(result.current.shouldShow).toBe(false);
    });
  });

  describe("daysText computation", () => {
    it("returns empty string when daysUntilExpiry is null", () => {
      const { result } = renderHook(() => useExpiryBannerState());
      expect(result.current.daysText).toBe("");
    });

    it("returns 'today' when daysUntilExpiry is 0", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 0;

      const { result } = renderHook(() => useExpiryBannerState());
      expect(result.current.daysText).toBe("today");
    });

    it("returns 'tomorrow' when daysUntilExpiry is 1", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 1;

      const { result } = renderHook(() => useExpiryBannerState());
      expect(result.current.daysText).toBe("tomorrow");
    });

    it("returns 'in X days' when daysUntilExpiry is > 1", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 5;

      const { result } = renderHook(() => useExpiryBannerState());
      expect(result.current.daysText).toBe("in 5 days");
    });
  });

  describe("handleDismiss", () => {
    it("sets isDismissed to true", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 5;

      const { result } = renderHook(() => useExpiryBannerState());

      expect(result.current.isDismissed).toBe(false);

      act(() => {
        result.current.handlers.handleDismiss();
      });

      expect(result.current.isDismissed).toBe(true);
    });

    it("persists dismissed state in sessionStorage", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 5;

      const { result } = renderHook(() =>
        useExpiryBannerState({ storageKey: "test_dismiss" })
      );

      act(() => {
        result.current.handlers.handleDismiss();
      });

      expect(sessionStorage.getItem("test_dismiss")).toBe("true");
    });

    it("does nothing when dismissible is false", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 5;

      const { result } = renderHook(() =>
        useExpiryBannerState({ dismissible: false })
      );

      act(() => {
        result.current.handlers.handleDismiss();
      });

      expect(result.current.isDismissed).toBe(false);
    });

    it("reads dismissed state from sessionStorage on mount", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 5;

      sessionStorage.setItem("test_key", "true");

      const { result } = renderHook(() =>
        useExpiryBannerState({ storageKey: "test_key" })
      );

      expect(result.current.isDismissed).toBe(true);
      expect(result.current.shouldShow).toBe(false);
    });
  });

  describe("handleReconnect", () => {
    it("calls authorize and sets redirecting state", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 5;

      const { result } = renderHook(() => useExpiryBannerState());

      act(() => {
        result.current.handlers.handleReconnect();
      });

      expect(mockAuthorize).toHaveBeenCalledTimes(1);
      expect(result.current.isRedirecting).toBe(true);
    });
  });

  describe("auth state passthrough", () => {
    it("exposes auth state values", () => {
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.isExpired = false;
      mockPollenAuthState.daysUntilExpiry = 3;
      mockPollenAuthState.isLoading = false;

      const { result } = renderHook(() => useExpiryBannerState());

      expect(result.current.isExpiringSoon).toBe(true);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.daysUntilExpiry).toBe(3);
      expect(result.current.isAuthLoading).toBe(false);
    });
  });
});
