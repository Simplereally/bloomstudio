/**
 * Tests for use-balance hook utilities
 *
 * Tests the formatBalance pure function which handles various
 * API response formats for balance/credit display.
 */

import { describe, it, expect } from "vitest";
import { formatBalance, type BalanceData } from "./use-balance";

describe("formatBalance", () => {
  describe("null/undefined handling", () => {
    it("returns null when data is null", () => {
      expect(formatBalance(null)).toBeNull();
    });

    it("returns null when data is an empty object", () => {
      expect(formatBalance({} as BalanceData)).toBeNull();
    });
  });

  describe("pendingSpend format", () => {
    it("formats pendingSpend correctly", () => {
      expect(formatBalance({ pendingSpend: 10.5 })).toBe("$10.50");
    });

    it("formats zero pendingSpend", () => {
      expect(formatBalance({ pendingSpend: 0 })).toBe("$0.00");
    });

    it("formats large pendingSpend values", () => {
      expect(formatBalance({ pendingSpend: 1234.56 })).toBe("$1234.56");
    });

    it("formats pendingSpend with many decimal places", () => {
      expect(formatBalance({ pendingSpend: 10.999 })).toBe("$11.00");
    });

    it("prioritizes pendingSpend over other properties", () => {
      expect(
        formatBalance({
          pendingSpend: 5,
          balance: 10,
          amountCents: 2000,
        })
      ).toBe("$5.00");
    });
  });

  describe("balance format", () => {
    it("formats balance correctly", () => {
      expect(formatBalance({ balance: 25.75 })).toBe("$25.75");
    });

    it("formats zero balance", () => {
      expect(formatBalance({ balance: 0 })).toBe("$0.00");
    });

    it("formats large balance values", () => {
      expect(formatBalance({ balance: 9999.99 })).toBe("$9999.99");
    });

    it("prioritizes balance over amountCents", () => {
      expect(
        formatBalance({
          balance: 15,
          amountCents: 3000,
        })
      ).toBe("$15.00");
    });
  });

  describe("amountCents format", () => {
    it("converts cents to dollars correctly", () => {
      expect(formatBalance({ amountCents: 1000 })).toBe("$10.00");
    });

    it("handles zero cents", () => {
      expect(formatBalance({ amountCents: 0 })).toBe("$0.00");
    });

    it("handles odd cent amounts", () => {
      expect(formatBalance({ amountCents: 1234 })).toBe("$12.34");
    });

    it("handles single digit cents", () => {
      expect(formatBalance({ amountCents: 1 })).toBe("$0.01");
    });

    it("handles large cent amounts", () => {
      expect(formatBalance({ amountCents: 999999 })).toBe("$9999.99");
    });
  });

  describe("edge cases", () => {
    it("handles negative pendingSpend", () => {
      expect(formatBalance({ pendingSpend: -5.5 })).toBe("$-5.50");
    });

    it("handles negative balance", () => {
      expect(formatBalance({ balance: -10 })).toBe("$-10.00");
    });

    it("handles very small decimal values", () => {
      expect(formatBalance({ pendingSpend: 0.001 })).toBe("$0.00");
    });

    it("returns null when only currency is provided", () => {
      expect(formatBalance({ currency: "USD" })).toBeNull();
    });
  });
});
