import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PollenAuthProvider, PollenAuthContext } from "./context";
import { useContext } from "react";

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

// Test component that consumes the context
function TestConsumer() {
  const context = useContext(PollenAuthContext);
  return (
    <div>
      <span data-testid="isLoading">{String(context.isLoading)}</span>
      <span data-testid="isAuthorized">{String(context.isAuthorized)}</span>
      <span data-testid="apiKey">{context.apiKey ?? "null"}</span>
      <span data-testid="needsReconnect">{String(context.needsReconnect)}</span>
      <button onClick={context.authorize} data-testid="authorize">
        Authorize
      </button>
      <button onClick={context.deauthorize} data-testid="deauthorize">
        Deauthorize
      </button>
      <button
        onClick={() => context.setNeedsReconnect(true)}
        data-testid="setNeedsReconnect"
      >
        Set Needs Reconnect
      </button>
    </div>
  );
}

describe("pollen-auth/context", () => {
  // Store original location
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoveApiKey.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  describe("Loading State", () => {
    it("should show loading state when Convex query is undefined", () => {
      mockUseQuery.mockReturnValue(undefined);

      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      expect(screen.getByTestId("isLoading").textContent).toBe("true");
      expect(screen.getByTestId("isAuthorized").textContent).toBe("false");
      expect(screen.getByTestId("apiKey").textContent).toBe("null");
    });
  });

  describe("Unauthorized State", () => {
    it("should show unauthorized when Convex returns null", () => {
      mockUseQuery.mockReturnValue(null);

      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      expect(screen.getByTestId("isLoading").textContent).toBe("false");
      expect(screen.getByTestId("isAuthorized").textContent).toBe("false");
      expect(screen.getByTestId("apiKey").textContent).toBe("null");
    });
  });

  describe("Authorized State", () => {
    it("should show authorized state when Convex returns a key", () => {
      mockUseQuery.mockReturnValue("sk_valid_test_key");

      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      expect(screen.getByTestId("isLoading").textContent).toBe("false");
      expect(screen.getByTestId("isAuthorized").textContent).toBe("true");
      expect(screen.getByTestId("apiKey").textContent).toBe(
        "sk_valid_test_key",
      );
    });

    it("should clear needsReconnect when authorized", async () => {
      // Start with no key and needsReconnect
      mockUseQuery.mockReturnValue(null);

      const { rerender } = render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("setNeedsReconnect"));

      expect(screen.getByTestId("needsReconnect").textContent).toBe("true");

      // Simulate user reconnecting (Convex now returns a key)
      mockUseQuery.mockReturnValue("sk_new_key");

      rerender(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      expect(screen.getByTestId("needsReconnect").textContent).toBe("false");
    });
  });

  describe("Authorize Action", () => {
    it("should redirect to Pollinations when authorize is called", async () => {
      mockUseQuery.mockReturnValue(null);

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
        </PollenAuthProvider>,
      );

      await user.click(screen.getByTestId("authorize"));

      expect(window.location.href).toContain("enter.pollinations.ai/authorize");
      expect(window.location.href).toContain("redirect_url=");
    });
  });

  describe("Deauthorize Action", () => {
    it("should call removeApiKey mutation when deauthorize is called", async () => {
      mockUseQuery.mockReturnValue("sk_valid_test_key");

      const user = userEvent.setup();

      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      expect(screen.getByTestId("isAuthorized").textContent).toBe("true");

      await user.click(screen.getByTestId("deauthorize"));

      expect(mockRemoveApiKey).toHaveBeenCalled();
    });

    it("should reset needsReconnect when deauthorize is called", async () => {
      mockUseQuery.mockReturnValue(null);

      const user = userEvent.setup();

      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      // Set needsReconnect first
      await user.click(screen.getByTestId("setNeedsReconnect"));
      expect(screen.getByTestId("needsReconnect").textContent).toBe("true");

      // Deauthorize should clear it
      await user.click(screen.getByTestId("deauthorize"));
      expect(screen.getByTestId("needsReconnect").textContent).toBe("false");
    });
  });

  describe("setNeedsReconnect Action", () => {
    it("should set needsReconnect to true", async () => {
      mockUseQuery.mockReturnValue(null);

      const user = userEvent.setup();

      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      expect(screen.getByTestId("needsReconnect").textContent).toBe("false");

      await user.click(screen.getByTestId("setNeedsReconnect"));

      expect(screen.getByTestId("needsReconnect").textContent).toBe("true");
    });

    it("should call removeApiKey when setting needsReconnect to true", async () => {
      mockUseQuery.mockReturnValue("sk_invalid_key");

      const user = userEvent.setup();

      render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      await user.click(screen.getByTestId("setNeedsReconnect"));

      // Should remove the invalid key from server
      expect(mockRemoveApiKey).toHaveBeenCalled();
    });
  });

  describe("Context Default Values", () => {
    it("should warn when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      function OutsideConsumer() {
        const context = useContext(PollenAuthContext);
        return (
          <button onClick={context.authorize} data-testid="authorize">
            Authorize
          </button>
        );
      }

      render(<OutsideConsumer />);

      // Trigger the action
      screen.getByTestId("authorize").click();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[PollenAuth] authorize called outside of provider",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Reactive Updates", () => {
    it("should update state when Convex query changes", async () => {
      // Start with no key
      mockUseQuery.mockReturnValue(null);

      const { rerender } = render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      expect(screen.getByTestId("isAuthorized").textContent).toBe("false");

      // Simulate key being added (e.g., after OAuth callback)
      mockUseQuery.mockReturnValue("sk_new_key");

      rerender(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("isAuthorized").textContent).toBe("true");
        expect(screen.getByTestId("apiKey").textContent).toBe("sk_new_key");
      });
    });

    it("should update state when key is removed", async () => {
      // Start with a key
      mockUseQuery.mockReturnValue("sk_existing_key");

      const { rerender } = render(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      expect(screen.getByTestId("isAuthorized").textContent).toBe("true");

      // Simulate key being removed
      mockUseQuery.mockReturnValue(null);

      rerender(
        <PollenAuthProvider>
          <TestConsumer />
        </PollenAuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("isAuthorized").textContent).toBe("false");
        expect(screen.getByTestId("apiKey").textContent).toBe("null");
      });
    });
  });
});
