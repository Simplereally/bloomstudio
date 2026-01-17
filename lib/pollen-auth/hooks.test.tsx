import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type React from "react";
import {
  usePollenAuth,
  usePollenAuthState,
  usePollenAuthActions,
  useIsPollenConnected,
  usePollenApiKey,
  useNeedsReconnect,
} from "./hooks";
import { PollenAuthProvider } from "./context";

// Mock Convex hooks
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockRemoveApiKey = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => {
    mockUseMutation();
    return mockRemoveApiKey;
  },
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      getPollinationsApiKey: "getPollinationsApiKey",
      removePollinationsApiKey: "removePollinationsApiKey",
    },
  },
}));

// Wrapper component for testing hooks
function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <PollenAuthProvider>{children}</PollenAuthProvider>;
  };
}

describe("pollen-auth/hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoveApiKey.mockResolvedValue({ success: true });
  });

  describe("usePollenAuth", () => {
    it("should return full context value when used within provider", () => {
      mockUseQuery.mockReturnValue(null);

      const { result } = renderHook(() => usePollenAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("apiKey");
      expect(result.current).toHaveProperty("isAuthorized");
      expect(result.current).toHaveProperty("authorize");
      expect(result.current).toHaveProperty("deauthorize");
      expect(result.current).toHaveProperty("setNeedsReconnect");
      expect(result.current).toHaveProperty("needsReconnect");
    });

    it("should throw when used outside provider", () => {
      // Suppress console.error for this test since React will log the error
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => { });

      expect(() => {
        renderHook(() => usePollenAuth());
      }).toThrow("[usePollenAuth] must be used within a PollenAuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("usePollenAuthState", () => {
    it("should return only state properties", () => {
      mockUseQuery.mockReturnValue(null);

      const { result } = renderHook(() => usePollenAuthState(), {
        wrapper: createWrapper(),
      });

      // Should have state properties
      expect(result.current).toHaveProperty("apiKey");
      expect(result.current).toHaveProperty("isAuthorized");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("needsReconnect");

      // Should NOT have action properties
      expect(result.current).not.toHaveProperty("authorize");
      expect(result.current).not.toHaveProperty("deauthorize");
    });

    it("should reflect loading state from Convex query", () => {
      mockUseQuery.mockReturnValue(undefined);

      const { result } = renderHook(() => usePollenAuthState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("should reflect authorized state from Convex query", () => {
      mockUseQuery.mockReturnValue("sk_test_key");

      const { result } = renderHook(() => usePollenAuthState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthorized).toBe(true);
      expect(result.current.apiKey).toBe("sk_test_key");
    });
  });

  describe("usePollenAuthActions", () => {
    it("should return only action functions", () => {
      mockUseQuery.mockReturnValue(null);

      const { result } = renderHook(() => usePollenAuthActions(), {
        wrapper: createWrapper(),
      });

      // Should have action functions
      expect(result.current).toHaveProperty("authorize");
      expect(result.current).toHaveProperty("deauthorize");
      expect(result.current).toHaveProperty("setNeedsReconnect");
      expect(typeof result.current.authorize).toBe("function");
      expect(typeof result.current.deauthorize).toBe("function");
      expect(typeof result.current.setNeedsReconnect).toBe("function");

      // Should NOT have state properties
      expect(result.current).not.toHaveProperty("apiKey");
      expect(result.current).not.toHaveProperty("isAuthorized");
    });
  });

  describe("useIsPollenConnected", () => {
    it("should return false when loading", () => {
      mockUseQuery.mockReturnValue(undefined);

      const { result } = renderHook(() => useIsPollenConnected(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(false);
    });

    it("should return false when not authorized", () => {
      mockUseQuery.mockReturnValue(null);

      const { result } = renderHook(() => useIsPollenConnected(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(false);
    });

    it("should return true when authorized", () => {
      mockUseQuery.mockReturnValue("sk_test123456");

      const { result } = renderHook(() => useIsPollenConnected(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(true);
    });
  });

  describe("usePollenApiKey", () => {
    it("should return null when not authorized", () => {
      mockUseQuery.mockReturnValue(null);

      const { result } = renderHook(() => usePollenApiKey(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeNull();
    });

    it("should return null when loading", () => {
      mockUseQuery.mockReturnValue(undefined);

      const { result } = renderHook(() => usePollenApiKey(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeNull();
    });

    it("should return the API key when authorized", () => {
      const apiKey = "sk_test123456";
      mockUseQuery.mockReturnValue(apiKey);

      const { result } = renderHook(() => usePollenApiKey(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(apiKey);
    });
  });

  describe("useNeedsReconnect", () => {
    it("should return needsReconnect state and setter", () => {
      mockUseQuery.mockReturnValue(null);

      const { result } = renderHook(() => useNeedsReconnect(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("needsReconnect");
      expect(result.current).toHaveProperty("setNeedsReconnect");
      expect(typeof result.current.setNeedsReconnect).toBe("function");
    });

    it("should initially be false", () => {
      mockUseQuery.mockReturnValue(null);

      const { result } = renderHook(() => useNeedsReconnect(), {
        wrapper: createWrapper(),
      });

      expect(result.current.needsReconnect).toBe(false);
    });

    it("should update state when setNeedsReconnect is called", () => {
      mockUseQuery.mockReturnValue(null);

      const { result } = renderHook(() => useNeedsReconnect(), {
        wrapper: createWrapper(),
      });

      expect(result.current.needsReconnect).toBe(false);

      act(() => {
        result.current.setNeedsReconnect(true);
      });

      expect(result.current.needsReconnect).toBe(true);

      act(() => {
        result.current.setNeedsReconnect(false);
      });

      expect(result.current.needsReconnect).toBe(false);
    });
  });
});
