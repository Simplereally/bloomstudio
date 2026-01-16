/**
 * @vitest-environment jsdom
 *
 * Tests for usePollenBalance Hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  formatBalance,
  isLowBalance,
  DEFAULT_LOW_BALANCE_THRESHOLD,
  usePollenBalance,
} from "./use-pollen-balance";

// Mock the pollen-auth module
const mockUsePollenAuth = vi.fn();
vi.mock("@/lib/pollen-auth", () => ({
  usePollenAuth: () => mockUsePollenAuth(),
}));

// Mock the balance service
const mockFetchPollenBalance = vi.fn();
vi.mock("@/lib/pollen-auth/balance-service", () => ({
  fetchPollenBalance: (...args: unknown[]) => mockFetchPollenBalance(...args),
  isBalanceError: (error: unknown): boolean => {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "message" in error
    );
  },
}));

/**
 * Property-based tests for balance formatting and threshold detection
 * Feature: pollen-balance-display
 */
describe("hooks/use-pollen-balance", () => {
  describe("formatBalance", () => {
    /**
     * Feature: pollen-balance-display, Property 4: Balance Formatting
     * Validates: Requirements 4.1
     *
     * For any numeric balance value, the formatBalance function SHALL produce
     * a string representation with exactly 2 decimal places.
     */
    it("Property 4: should format any balance with exactly 2 decimal places", () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1e10, max: 1e10, noNaN: true, noDefaultInfinity: true }),
          (balance) => {
            const result = formatBalance(balance);
            expect(result).not.toBeNull();
            
            // Verify format: should have exactly 2 decimal places
            const parts = result!.split(".");
            expect(parts.length).toBe(2);
            expect(parts[1].length).toBe(2);
            
            // Verify the numeric value is preserved (within floating point tolerance)
            const parsed = parseFloat(result!);
            expect(Math.abs(parsed - balance)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return null for null input", () => {
      expect(formatBalance(null)).toBeNull();
    });

    it("should return null for undefined input", () => {
      expect(formatBalance(undefined)).toBeNull();
    });

    it("should format zero correctly", () => {
      expect(formatBalance(0)).toBe("0.00");
    });

    it("should format whole numbers with .00", () => {
      expect(formatBalance(100)).toBe("100.00");
      expect(formatBalance(1000)).toBe("1000.00");
    });

    it("should format decimals correctly", () => {
      expect(formatBalance(123.45)).toBe("123.45");
      expect(formatBalance(0.1)).toBe("0.10");
      expect(formatBalance(0.01)).toBe("0.01");
    });
  });

  describe("isLowBalance", () => {
    /**
     * Feature: pollen-balance-display, Property 5: Low Balance Threshold Detection
     * Validates: Requirements 4.4
     *
     * For any balance value and configurable threshold, isLowBalance SHALL return
     * true if and only if balance < threshold.
     */
    it("Property 5: should correctly detect low balance for any value and threshold", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true }),
          (balance, threshold) => {
            const result = isLowBalance(balance, threshold);
            const expected = balance < threshold;
            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return false for null balance", () => {
      expect(isLowBalance(null)).toBe(false);
      expect(isLowBalance(null, 100)).toBe(false);
    });

    it("should return false for undefined balance", () => {
      expect(isLowBalance(undefined)).toBe(false);
      expect(isLowBalance(undefined, 100)).toBe(false);
    });

    it("should use default threshold when not specified", () => {
      // Below default threshold
      expect(isLowBalance(DEFAULT_LOW_BALANCE_THRESHOLD - 1)).toBe(true);
      // At default threshold
      expect(isLowBalance(DEFAULT_LOW_BALANCE_THRESHOLD)).toBe(false);
      // Above default threshold
      expect(isLowBalance(DEFAULT_LOW_BALANCE_THRESHOLD + 1)).toBe(false);
    });

    it("should respect custom threshold", () => {
      const customThreshold = 50;
      expect(isLowBalance(49, customThreshold)).toBe(true);
      expect(isLowBalance(50, customThreshold)).toBe(false);
      expect(isLowBalance(51, customThreshold)).toBe(false);
    });
  });
});


/**
 * Unit tests for usePollenBalance hook behavior
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */
describe("usePollenBalance hook", () => {
  let queryClient: QueryClient;

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = "TestWrapper";

  const createWrapper = () => TestWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("loading state", () => {
    /**
     * Test loading state
     * Validates: Requirements 1.2
     */
    it("should show loading state while auth is loading", () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: null,
        isAuthorized: false,
        isLoading: true,
      });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.balance).toBeNull();
      expect(result.current.formattedBalance).toBeNull();
    });

    it("should show loading state while fetching balance", async () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: "sk_test_key",
        isAuthorized: true,
        isLoading: false,
      });

      // Make fetch hang to test loading state
      mockFetchPollenBalance.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      // Should be loading while query is pending
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("successful fetch", () => {
    /**
     * Test successful fetch
     * Validates: Requirements 1.1
     */
    it("should return balance data on successful fetch", async () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: "sk_test_key",
        isAuthorized: true,
        isLoading: false,
      });

      mockFetchPollenBalance.mockResolvedValue({ balance: 123.45 });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.balance).toBe(123.45);
      expect(result.current.formattedBalance).toBe("123.45");
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should detect low balance correctly", async () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: "sk_test_key",
        isAuthorized: true,
        isLoading: false,
      });

      mockFetchPollenBalance.mockResolvedValue({ balance: 0.5 }); // Below default threshold of 1

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLowBalance).toBe(true);
    });
  });

  describe("error states", () => {
    /**
     * Test error states
     * Validates: Requirements 1.3
     */
    it("should handle UNAUTHORIZED error", async () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: "sk_invalid_key",
        isAuthorized: true,
        isLoading: false,
      });

      mockFetchPollenBalance.mockRejectedValue({
        code: "UNAUTHORIZED",
        message: "Invalid or expired API key",
      });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.code).toBe("UNAUTHORIZED");
      expect(result.current.balance).toBeNull();
    });

    it("should handle FORBIDDEN error", async () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: "sk_test_key",
        isAuthorized: true,
        isLoading: false,
      });

      mockFetchPollenBalance.mockRejectedValue({
        code: "FORBIDDEN",
        message: "API key missing account:balance permission",
      });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.code).toBe("FORBIDDEN");
    });

    it("should handle NETWORK_ERROR (retries infinitely)", async () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: "sk_test_key",
        isAuthorized: true,
        isLoading: false,
      });

      // NETWORK_ERROR triggers infinite retry, so we verify the fetch is called
      // and the hook stays in loading/fetching state
      mockFetchPollenBalance.mockRejectedValue({
        code: "NETWORK_ERROR",
        message: "Network request failed",
      });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      // Wait for the first fetch attempt
      await waitFor(() => {
        expect(mockFetchPollenBalance).toHaveBeenCalled();
      });

      // For network errors, the hook should keep retrying (not show error immediately)
      // The balance should remain null while retrying
      expect(result.current.balance).toBeNull();
    });
  });

  describe("disabled when not authorized", () => {
    /**
     * Test disabled when not authorized
     * Validates: Requirements 1.4
     */
    it("should not fetch when user is not authorized", () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: null,
        isAuthorized: false,
        isLoading: false,
      });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      expect(mockFetchPollenBalance).not.toHaveBeenCalled();
      expect(result.current.balance).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it("should not fetch when apiKey is missing", () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: null,
        isAuthorized: true, // Edge case: authorized but no key
        isLoading: false,
      });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      expect(mockFetchPollenBalance).not.toHaveBeenCalled();
      expect(result.current.balance).toBeNull();
    });
  });

  describe("refetch and invalidation", () => {
    it("should provide refetch function", async () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: "sk_test_key",
        isAuthorized: true,
        isLoading: false,
      });

      mockFetchPollenBalance.mockResolvedValue({ balance: 100 });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.balance).toBe(100);

      // Update mock to return new balance
      mockFetchPollenBalance.mockResolvedValue({ balance: 90 });

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.balance).toBe(90);
      });
    });

    it("should provide invalidateBalance function", async () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: "sk_test_key",
        isAuthorized: true,
        isLoading: false,
      });

      mockFetchPollenBalance.mockResolvedValue({ balance: 100 });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // invalidateBalance should be a function
      expect(typeof result.current.invalidateBalance).toBe("function");

      // Update mock to return new balance
      mockFetchPollenBalance.mockResolvedValue({ balance: 80 });

      // Trigger invalidation
      act(() => {
        result.current.invalidateBalance();
      });

      await waitFor(() => {
        expect(result.current.balance).toBe(80);
      });
    });

    /**
     * Feature: pollen-balance-display, Property 3: Rate Limiting Behavior
     * Validates: Requirements 3.3, 3.4
     *
     * For any sequence of invalidateBalance calls within a debounce window,
     * the Balance_Service SHALL make at most one API request, and subsequent
     * calls within the minimum refresh interval SHALL be coalesced.
     */
    it("Property 3: should coalesce rapid invalidateBalance calls within debounce window", async () => {
      mockUsePollenAuth.mockReturnValue({
        apiKey: "sk_test_key",
        isAuthorized: true,
        isLoading: false,
      });

      mockFetchPollenBalance.mockResolvedValue({ balance: 100 });

      const { result } = renderHook(() => usePollenBalance(), {
        wrapper: createWrapper(),
      });

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mock call count after initial fetch
      mockFetchPollenBalance.mockClear();
      mockFetchPollenBalance.mockResolvedValue({ balance: 90 });

      // Property test: for any number of rapid calls (1-20), only 1 API request should be made
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (callCount) => {
            // Reset mock for each property iteration
            mockFetchPollenBalance.mockClear();

            // Make multiple rapid invalidateBalance calls
            act(() => {
              for (let i = 0; i < callCount; i++) {
                result.current.invalidateBalance();
              }
            });

            // Due to debouncing, only the first call should trigger an invalidation
            // Subsequent calls within MIN_REFRESH_INTERVAL_MS should be ignored
            // The query client will only make 1 request (or 0 if all were debounced)
            const callsMade = mockFetchPollenBalance.mock.calls.length;
            expect(callsMade).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
