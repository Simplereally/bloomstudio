import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PollenAuthProvider, PollenAuthContext } from "./context";
import { useContext } from "react";
import {
  STORAGE_KEY,
  STORAGE_EXPIRY_KEY,
  STORAGE_AUTHORIZED_AT_KEY,
  EXPIRY_DAYS,
  EXPIRING_SOON_THRESHOLD_DAYS,
} from "./constants";

// Test component that consumes the context
function TestConsumer() {
  const context = useContext(PollenAuthContext);
  return (
    <div>
      <span data-testid="isLoading">{String(context.isLoading)}</span>
      <span data-testid="isAuthorized">{String(context.isAuthorized)}</span>
      <span data-testid="isExpiringSoon">{String(context.isExpiringSoon)}</span>
      <span data-testid="isExpired">{String(context.isExpired)}</span>
      <span data-testid="daysUntilExpiry">
        {context.daysUntilExpiry ?? "null"}
      </span>
      <span data-testid="apiKey">{context.apiKey ?? "null"}</span>
      <button onClick={context.authorize} data-testid="authorize">
        Authorize
      </button>
      <button onClick={context.deauthorize} data-testid="deauthorize">
        Deauthorize
      </button>
    </div>
  );
}

describe("pollen-auth/context", () => {
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

  // Store original location
  const originalLocation = window.location;

  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  describe("Initial State", () => {
    it("should show loading state initially", async () => {
      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });
    });

    it("should show unauthorized when no key is stored", async () => {
      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("isAuthorized").textContent).toBe("false");
      expect(screen.getByTestId("apiKey").textContent).toBe("null");
    });
  });

  describe("With Valid Stored Key", () => {
    beforeEach(() => {
      const authorizedAt = Date.now();
      const expiresAt = authorizedAt + EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      localStorageMock.setItem(STORAGE_KEY, "sk_valid_test_key");
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, String(expiresAt));
      localStorageMock.setItem(
        STORAGE_AUTHORIZED_AT_KEY,
        String(authorizedAt)
      );
    });

    it("should show authorized state with valid key", async () => {
      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("isAuthorized").textContent).toBe("true");
      expect(screen.getByTestId("apiKey").textContent).toBe(
        "sk_valid_test_key"
      );
      expect(screen.getByTestId("isExpired").textContent).toBe("false");
    });

    it("should show correct days until expiry", async () => {
      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      const daysUntilExpiry = screen.getByTestId("daysUntilExpiry").textContent;
      expect(Number(daysUntilExpiry)).toBe(EXPIRY_DAYS);
    });
  });

  describe("With Expiring Soon Key", () => {
    beforeEach(() => {
      const daysRemaining = EXPIRING_SOON_THRESHOLD_DAYS - 2; // 5 days
      const expiresAt = Date.now() + daysRemaining * 24 * 60 * 60 * 1000;
      const authorizedAt = expiresAt - EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      localStorageMock.setItem(STORAGE_KEY, "sk_expiring_soon_key");
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, String(expiresAt));
      localStorageMock.setItem(
        STORAGE_AUTHORIZED_AT_KEY,
        String(authorizedAt)
      );
    });

    it("should show expiring soon state", async () => {
      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("isAuthorized").textContent).toBe("true");
      expect(screen.getByTestId("isExpiringSoon").textContent).toBe("true");
    });
  });

  describe("With Expired Key", () => {
    beforeEach(() => {
      const expiredTime = Date.now() - 24 * 60 * 60 * 1000; // 1 day ago
      const authorizedAt = expiredTime - EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      localStorageMock.setItem(STORAGE_KEY, "sk_expired_key");
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, String(expiredTime));
      localStorageMock.setItem(
        STORAGE_AUTHORIZED_AT_KEY,
        String(authorizedAt)
      );
    });

    it("should show expired state", async () => {
      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      expect(screen.getByTestId("isAuthorized").textContent).toBe("false");
      expect(screen.getByTestId("isExpired").textContent).toBe("true");
      expect(screen.getByTestId("apiKey").textContent).toBe("null"); // Key is cleared when expired
    });
  });

  describe("Authorize Action", () => {
    it("should redirect to Pollinations when authorize is called", async () => {
      const user = userEvent.setup();

      // Mock window.location.href setter
      const mockLocation = {
        ...window.location,
        href: "",
        origin: "https://test.com",
      };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("isLoading").textContent).toBe("false");
      });

      await user.click(screen.getByTestId("authorize"));

      expect(window.location.href).toContain("enter.pollinations.ai/authorize");
      expect(window.location.href).toContain("redirect_url=");
    });
  });

  describe("Deauthorize Action", () => {
    beforeEach(() => {
      const authorizedAt = Date.now();
      const expiresAt = authorizedAt + EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      localStorageMock.setItem(STORAGE_KEY, "sk_valid_test_key");
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, String(expiresAt));
      localStorageMock.setItem(
        STORAGE_AUTHORIZED_AT_KEY,
        String(authorizedAt)
      );
    });

    it("should clear auth state when deauthorize is called", async () => {
      const user = userEvent.setup();

      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("isAuthorized").textContent).toBe("true");
      });

      await user.click(screen.getByTestId("deauthorize"));

      expect(screen.getByTestId("isAuthorized").textContent).toBe("false");
      expect(screen.getByTestId("apiKey").textContent).toBe("null");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });
});
