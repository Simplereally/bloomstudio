// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useApiCardState } from "./use-api-card-state";

// Mock the usePollenAuth hook
const mockAuthorize = vi.fn();
const mockDeauthorize = vi.fn();
let mockPollenAuthState = {
  isAuthorized: false,
  isLoading: false,
  authorize: mockAuthorize,
  deauthorize: mockDeauthorize,
};

vi.mock("@/lib/pollen-auth", () => ({
  usePollenAuth: () => mockPollenAuthState,
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useApiCardState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPollenAuthState = {
      isAuthorized: false,
      isLoading: false,
      authorize: mockAuthorize,
      deauthorize: mockDeauthorize,
    };
  });

  describe("loading states", () => {
    it("returns loading state when pollen auth is loading", () => {
      mockPollenAuthState.isLoading = true;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.byopState.isLoading).toBe(true);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.connectionStatus).toBe("loading");
    });

    it("returns not loading when pollen auth is ready", () => {
      mockPollenAuthState.isLoading = false;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("connection states", () => {
    it("returns not-connected when BYOP is not authorized", () => {
      mockPollenAuthState.isAuthorized = false;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe("not-connected");
    });

    it("returns byop-connected when BYOP is authorized", () => {
      mockPollenAuthState.isAuthorized = true;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionStatus).toBe("byop-connected");
      expect(result.current.byopState.isConnected).toBe(true);
    });
  });

  describe("handlers", () => {
    it("handleReconnect calls authorize and sets redirecting state", () => {
      const { result } = renderHook(() => useApiCardState());

      act(() => {
        result.current.handlers.handleReconnect();
      });

      expect(mockAuthorize).toHaveBeenCalledTimes(1);
      expect(result.current.actionState.isRedirecting).toBe(true);
    });

    it("handleDisconnect calls deauthorize", () => {
      mockPollenAuthState.isAuthorized = true;
      const { result } = renderHook(() => useApiCardState());

      act(() => {
        result.current.handlers.handleDisconnect();
      });

      expect(mockDeauthorize).toHaveBeenCalledTimes(1);
    });
  });
});
