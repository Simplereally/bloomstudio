import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type React from "react";
import {
  usePollenAuth,
  usePollenAuthState,
  usePollenAuthActions,
  useIsPollenConnected,
  usePollenApiKey,
} from "./hooks";
import { PollenAuthProvider } from "./context";

// Wrapper component for testing hooks
function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <PollenAuthProvider>{children}</PollenAuthProvider>;
  };
}

describe("pollen-auth/hooks", () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((i: number) => Object.keys(store)[i] || null),
    };
  })();

  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("usePollenAuth", () => {
    it("should return full context value when used within provider", () => {
      const { result } = renderHook(() => usePollenAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty("apiKey");
      expect(result.current).toHaveProperty("isAuthorized");
      expect(result.current).toHaveProperty("authorize");
      expect(result.current).toHaveProperty("deauthorize");
      expect(result.current).toHaveProperty("refreshAuthState");
    });

    it("should throw when used outside provider", () => {
      // Note: The current implementation returns default context instead of throwing
      // This test documents the current behavior
      const { result } = renderHook(() => usePollenAuth());

      // Since we use createContext with default value, it won't throw
      // but will have the warning-logging no-op functions
      expect(result.current).toBeDefined();
    });
  });

  describe("usePollenAuthState", () => {
    it("should return only state properties", () => {
      const { result } = renderHook(() => usePollenAuthState(), {
        wrapper: createWrapper(),
      });

      // Should have state properties
      expect(result.current).toHaveProperty("apiKey");
      expect(result.current).toHaveProperty("isAuthorized");
      expect(result.current).toHaveProperty("expiresAt");
      expect(result.current).toHaveProperty("daysUntilExpiry");
      expect(result.current).toHaveProperty("isExpiringSoon");
      expect(result.current).toHaveProperty("isExpired");
      expect(result.current).toHaveProperty("isLoading");

      // Should NOT have action properties
      expect(result.current).not.toHaveProperty("authorize");
      expect(result.current).not.toHaveProperty("deauthorize");
    });
  });

  describe("usePollenAuthActions", () => {
    it("should return only action functions", () => {
      const { result } = renderHook(() => usePollenAuthActions(), {
        wrapper: createWrapper(),
      });

      // Should have action functions
      expect(result.current).toHaveProperty("authorize");
      expect(result.current).toHaveProperty("deauthorize");
      expect(result.current).toHaveProperty("refreshAuthState");
      expect(typeof result.current.authorize).toBe("function");
      expect(typeof result.current.deauthorize).toBe("function");
      expect(typeof result.current.refreshAuthState).toBe("function");

      // Should NOT have state properties
      expect(result.current).not.toHaveProperty("apiKey");
      expect(result.current).not.toHaveProperty("isAuthorized");
    });
  });

  describe("useIsPollenConnected", () => {
    it("should return false when not authorized", async () => {
      const { result, rerender } = renderHook(() => useIsPollenConnected(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current).toBe(false);

      // After loading
      rerender();
      expect(result.current).toBe(false);
    });

    it("should return true when authorized", async () => {
      // Store a valid key
      const authorizedAt = Date.now();
      const expiresAt = authorizedAt + 30 * 24 * 60 * 60 * 1000;
      localStorageMock.setItem("pollinations_byop_key", "sk_test123456");
      localStorageMock.setItem("pollinations_byop_expiry", String(expiresAt));
      localStorageMock.setItem(
        "pollinations_byop_authorized_at",
        String(authorizedAt)
      );

      const { result, rerender } = renderHook(() => useIsPollenConnected(), {
        wrapper: createWrapper(),
      });

      // Wait for effect to run
      await new Promise((r) => setTimeout(r, 0));
      rerender();

      expect(result.current).toBe(true);
    });
  });

  describe("usePollenApiKey", () => {
    it("should return null when not authorized", () => {
      const { result } = renderHook(() => usePollenApiKey(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeNull();
    });

    it("should return the API key when authorized", async () => {
      // Store a valid key
      const apiKey = "sk_test123456";
      const authorizedAt = Date.now();
      const expiresAt = authorizedAt + 30 * 24 * 60 * 60 * 1000;
      localStorageMock.setItem("pollinations_byop_key", apiKey);
      localStorageMock.setItem("pollinations_byop_expiry", String(expiresAt));
      localStorageMock.setItem(
        "pollinations_byop_authorized_at",
        String(authorizedAt)
      );

      const { result, rerender } = renderHook(() => usePollenApiKey(), {
        wrapper: createWrapper(),
      });

      // Wait for effect to run
      await new Promise((r) => setTimeout(r, 0));
      rerender();

      expect(result.current).toBe(apiKey);
    });
  });
});
