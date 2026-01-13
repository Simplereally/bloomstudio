import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useApiCardState } from "./use-api-card-state";

// Mock the Convex hooks
const mockRemoveApiKey = vi.fn();
let mockSavedKey: string | null | undefined = undefined;

vi.mock("convex/react", () => ({
  useQuery: () => mockSavedKey,
  useMutation: () => mockRemoveApiKey,
}));

// Mock the API module to return distinguishable references
vi.mock("@/convex/_generated/api", () => ({
  api: {
    users: {
      getPollinationsApiKey: "getPollinationsApiKey",
      removePollinationsApiKey: "removePollinationsApiKey",
    },
  },
}));

// Mock the usePollenAuth hook
const mockAuthorize = vi.fn();
const mockDeauthorize = vi.fn();
let mockPollenAuthState = {
  isAuthorized: false,
  isExpiringSoon: false,
  isExpired: false,
  daysUntilExpiry: null as number | null,
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
    mockSavedKey = undefined;
    mockPollenAuthState = {
      isAuthorized: false,
      isExpiringSoon: false,
      isExpired: false,
      daysUntilExpiry: null,
      isLoading: false,
      authorize: mockAuthorize,
      deauthorize: mockDeauthorize,
    };
  });

  describe("loading states", () => {
    it("returns loading state when legacy key is undefined", () => {
      mockSavedKey = undefined;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.legacyState.isLegacyLoading).toBe(true);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.connectionStatus).toBe("loading");
    });

    it("returns loading state when pollen auth is loading", () => {
      mockSavedKey = null;
      mockPollenAuthState.isLoading = true;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.byopState.isLoading).toBe(true);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.connectionStatus).toBe("loading");
    });
  });

  describe("connection states", () => {
    it("returns not-connected when no keys are present", () => {
      mockSavedKey = null;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionType).toBe(null);
      expect(result.current.connectionStatus).toBe("not-connected");
    });

    it("returns legacy-active when only legacy key is present", () => {
      mockSavedKey = "some-encrypted-key";
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionType).toBe("legacy");
      expect(result.current.connectionStatus).toBe("legacy-active");
      expect(result.current.legacyState.hasLegacyKey).toBe(true);
    });

    it("returns byop-connected when BYOP is authorized", () => {
      mockSavedKey = null;
      mockPollenAuthState.isAuthorized = true;
      mockPollenAuthState.daysUntilExpiry = 25;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionType).toBe("byop");
      expect(result.current.connectionStatus).toBe("byop-connected");
      expect(result.current.byopState.isConnected).toBe(true);
    });

    it("returns expiring-soon when BYOP key is expiring soon", () => {
      mockSavedKey = null;
      mockPollenAuthState.isAuthorized = true;
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 5;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionStatus).toBe("expiring-soon");
      expect(result.current.byopState.isExpiringSoon).toBe(true);
    });

    it("returns expired when BYOP key is expired", () => {
      mockSavedKey = null;
      mockPollenAuthState.isAuthorized = true;
      mockPollenAuthState.isExpired = true;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.connectionStatus).toBe("expired");
      expect(result.current.byopState.isExpired).toBe(true);
    });

    it("returns not-connected when BYOP is expired but not authorized", () => {
      mockSavedKey = null;
      mockPollenAuthState.isAuthorized = false;
      mockPollenAuthState.isExpired = true;
      const { result } = renderHook(() => useApiCardState());

      // Without isByopConnected, expired status should not apply
      expect(result.current.connectionStatus).toBe("not-connected");
    });

    it("returns legacy-active when legacy key exists even if BYOP expiry flags are set", () => {
      // This is the key bug fix test: legacy keys should not be affected by BYOP expiry state
      mockSavedKey = "some-encrypted-legacy-key";
      mockPollenAuthState.isAuthorized = false;
      mockPollenAuthState.isExpired = true;
      mockPollenAuthState.isExpiringSoon = true;
      mockPollenAuthState.daysUntilExpiry = 3;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionType).toBe("legacy");
      expect(result.current.connectionStatus).toBe("legacy-active");
    });
  });

  describe("action state", () => {
    it("manages legacy section visibility", () => {
      mockSavedKey = null;
      const { result } = renderHook(() => useApiCardState());

      expect(result.current.actionState.showLegacySection).toBe(false);

      act(() => {
        result.current.actionState.setShowLegacySection(true);
      });

      expect(result.current.actionState.showLegacySection).toBe(true);
    });
  });

  describe("handlers", () => {
    it("handleReconnect calls authorize and sets redirecting state", () => {
      mockSavedKey = null;
      const { result } = renderHook(() => useApiCardState());

      act(() => {
        result.current.handlers.handleReconnect();
      });

      expect(mockAuthorize).toHaveBeenCalledTimes(1);
      expect(result.current.actionState.isRedirecting).toBe(true);
    });

    it("handleDisconnect calls deauthorize", async () => {
      mockSavedKey = null;
      mockPollenAuthState.isAuthorized = true;
      const { result } = renderHook(() => useApiCardState());

      act(() => {
        result.current.handlers.handleDisconnect();
      });

      expect(mockDeauthorize).toHaveBeenCalledTimes(1);
    });

    it("handleRemoveLegacyKey removes the key", async () => {
      mockSavedKey = "some-key";
      const { result } = renderHook(() => useApiCardState());

      await act(async () => {
        await result.current.handlers.handleRemoveLegacyKey();
      });

      await waitFor(() => {
        expect(result.current.actionState.isRemoving).toBe(false);
      });

      expect(mockRemoveApiKey).toHaveBeenCalledWith({});
    });
  });
});
