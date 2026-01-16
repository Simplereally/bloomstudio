import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  fetchPollenBalance,
  buildAuthHeader,
  buildBalanceUrl,
  parseBalanceResponse,
  isBalanceError,
  POLLINATIONS_API_BASE,
  type BalanceError,
} from "./balance-service";

describe("pollen-auth/balance-service", () => {
  describe("buildAuthHeader", () => {
    /**
     * Feature: pollen-balance-display, Property 1: API Request Construction
     * Validates: Requirements 2.1
     *
     * For any valid BYOP API key, the buildAuthHeader function SHALL produce
     * an Authorization header with the format "Bearer {apiKey}"
     */
    it("Property 1: should construct Bearer token for any API key", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (apiKey) => {
            const header = buildAuthHeader(apiKey);
            expect(header).toBe(`Bearer ${apiKey}`);
            expect(header.startsWith("Bearer ")).toBe(true);
            expect(header.slice(7)).toBe(apiKey);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("buildBalanceUrl", () => {
    it("should return the correct balance endpoint URL", () => {
      const url = buildBalanceUrl();
      expect(url).toBe(`${POLLINATIONS_API_BASE}/api/account/balance`);
      expect(url).toBe("https://gen.pollinations.ai/api/account/balance");
    });
  });

  describe("parseBalanceResponse", () => {
    /**
     * Feature: pollen-balance-display, Property 2: Response Parsing Round-Trip
     * Validates: Requirements 2.2
     *
     * For any valid balance number, parsing the response through parseBalanceResponse
     * SHALL produce a PollenBalanceResponse object where response.balance equals
     * the original balance value.
     */
    it("Property 2: should parse any valid balance number correctly", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, noNaN: true, noDefaultInfinity: true }),
          (balance) => {
            const input = { balance };
            const result = parseBalanceResponse(input);
            expect(result.balance).toBe(balance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should throw for invalid response format - missing balance", () => {
      expect(() => parseBalanceResponse({})).toThrow();
      expect(() => parseBalanceResponse({ other: 123 })).toThrow();
    });

    it("should throw for invalid response format - wrong type", () => {
      expect(() => parseBalanceResponse({ balance: "100" })).toThrow();
      expect(() => parseBalanceResponse(null)).toThrow();
      expect(() => parseBalanceResponse(undefined)).toThrow();
    });
  });

  describe("isBalanceError", () => {
    it("should return true for valid BalanceError objects", () => {
      const error: BalanceError = { code: "UNAUTHORIZED", message: "test" };
      expect(isBalanceError(error)).toBe(true);
    });

    it("should return false for non-BalanceError objects", () => {
      expect(isBalanceError(null)).toBe(false);
      expect(isBalanceError(undefined)).toBe(false);
      expect(isBalanceError({})).toBe(false);
      expect(isBalanceError({ code: "UNAUTHORIZED" })).toBe(false);
      expect(isBalanceError({ message: "test" })).toBe(false);
      expect(isBalanceError(new Error("test"))).toBe(false);
    });
  });


  describe("fetchPollenBalance", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    /**
     * Unit tests for error handling
     * Validates: Requirements 2.3, 2.4, 2.5
     */
    describe("error handling", () => {
      it("should return UNAUTHORIZED error for 401 response", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
        });

        await expect(fetchPollenBalance("sk_test_key")).rejects.toMatchObject({
          code: "UNAUTHORIZED",
          message: "Invalid or expired API key",
        });
      });

      it("should return FORBIDDEN error for 403 response", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
        });

        await expect(fetchPollenBalance("sk_test_key")).rejects.toMatchObject({
          code: "FORBIDDEN",
          message: "API key missing account:balance permission",
        });
      });

      it("should return NETWORK_ERROR for network failures", async () => {
        global.fetch = vi.fn().mockRejectedValue(
          new TypeError("Failed to fetch")
        );

        await expect(fetchPollenBalance("sk_test_key")).rejects.toMatchObject({
          code: "NETWORK_ERROR",
        });
      });

      it("should return UNKNOWN_ERROR for other HTTP errors", async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
        });

        await expect(fetchPollenBalance("sk_test_key")).rejects.toMatchObject({
          code: "UNKNOWN_ERROR",
          message: "HTTP 500",
        });
      });
    });

    describe("successful fetch", () => {
      it("should return balance on successful response", async () => {
        const mockBalance = 1234.56;
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ balance: mockBalance }),
        });

        const result = await fetchPollenBalance("sk_test_key");
        expect(result.balance).toBe(mockBalance);
      });

      it("should call fetch with correct URL and headers", async () => {
        const apiKey = "sk_test_api_key_123";
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ balance: 100 }),
        });

        await fetchPollenBalance(apiKey);

        expect(global.fetch).toHaveBeenCalledWith(
          "https://gen.pollinations.ai/api/account/balance",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
      });
    });
  });
});
