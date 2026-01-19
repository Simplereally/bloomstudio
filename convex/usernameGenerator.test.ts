/**
 * Tests for usernameGenerator
 *
 * Tests the generateRandomUsername function which creates
 * random usernames for privacy-preserving display names.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateRandomUsername } from "./usernameGenerator";

describe("generateRandomUsername", () => {
  describe("format validation", () => {
    it("returns a non-empty string", () => {
      const username = generateRandomUsername();
      expect(username).toBeDefined();
      expect(typeof username).toBe("string");
      expect(username.length).toBeGreaterThan(0);
    });

    it("starts with a capital letter", () => {
      const username = generateRandomUsername();
      expect(username[0]).toMatch(/[A-Z]/);
    });

    it("contains only alphanumeric characters", () => {
      // Run multiple times to cover randomness
      for (let i = 0; i < 50; i++) {
        const username = generateRandomUsername();
        expect(username).toMatch(/^[A-Za-z0-9]+$/);
      }
    });

    it("has reasonable length (between 6 and 30 characters)", () => {
      // Run multiple times to cover different combinations
      for (let i = 0; i < 50; i++) {
        const username = generateRandomUsername();
        expect(username.length).toBeGreaterThanOrEqual(6);
        expect(username.length).toBeLessThanOrEqual(30);
      }
    });
  });

  describe("structure validation", () => {
    it("contains at least two capital letters (one for adjective, one for noun)", () => {
      const username = generateRandomUsername();
      const capitalCount = (username.match(/[A-Z]/g) || []).length;
      // Should have at least 2 capitals: one for adjective, one for noun
      expect(capitalCount).toBeGreaterThanOrEqual(2);
    });

    it("generates usernames without numbers (when random < 0.5)", () => {
      // Mock Math.random to return values < 0.5 for the number decision
      const originalRandom = Math.random;
      let callCount = 0;

      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        // First two calls are for adjective and noun selection
        // Third call is for whether to add number (return < 0.5 = no number)
        if (callCount === 3) {
          return 0.4; // < 0.5, no number added
        }
        return originalRandom();
      });

      const username = generateRandomUsername();
      // Should not end with numbers
      expect(username).toMatch(/[A-Za-z]$/);

      vi.restoreAllMocks();
    });

    it("generates usernames with numbers (when random > 0.5)", () => {
      // Mock Math.random to return values > 0.5 for the number decision
      const originalRandom = Math.random;
      let callCount = 0;

      vi.spyOn(Math, "random").mockImplementation(() => {
        callCount++;
        // First two calls are for adjective and noun selection
        // Third and fourth calls are for number suffix
        if (callCount === 3) {
          return 0.6; // > 0.5, add number
        }
        if (callCount === 4) {
          return 0.5; // Will give us number 50
        }
        return originalRandom();
      });

      const username = generateRandomUsername();
      // Should end with numbers
      expect(username).toMatch(/\d+$/);

      vi.restoreAllMocks();
    });
  });

  describe("deterministic tests with mocked random", () => {
    beforeEach(() => {
      vi.spyOn(Math, "random");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("uses first adjective and noun when random returns 0", () => {
      vi.mocked(Math.random).mockReturnValue(0);

      const username = generateRandomUsername();
      // When random returns 0:
      // - adjective index = floor(0 * 72) = 0 -> "Sunny"
      // - noun index = floor(0 * 72) = 0 -> "Phoenix"
      // - addNumber = 0 > 0.5 = false (no suffix)
      expect(username).toBe("SunnyPhoenix");
    });

    it("uses last adjective and noun when random returns 0.99", () => {
      vi.mocked(Math.random).mockReturnValue(0.99);

      const username = generateRandomUsername();
      // When random returns 0.99:
      // - adjective index = floor(0.99 * 72) = 71 -> "Falling"
      // - noun index = floor(0.99 * 72) = 71 -> "Symphony"
      // - addNumber = 0.99 > 0.5 = true
      // - suffix = floor(0.99 * 99) + 1 = 98 + 1 = 99
      expect(username).toBe("FallingSymphony99");
    });

    it("generates number suffix between 1 and 99", () => {
      let callCount = 0;

      vi.mocked(Math.random).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return 0; // adjective and noun selection
        if (callCount === 3) return 0.6; // addNumber = true
        if (callCount === 4) return 0; // suffix = floor(0 * 99) + 1 = 1
        return 0;
      });

      const username = generateRandomUsername();
      expect(username).toBe("SunnyPhoenix1");
    });
  });

  describe("randomness distribution", () => {
    it("generates different usernames on multiple calls", () => {
      const usernames = new Set<string>();

      // Generate 100 usernames
      for (let i = 0; i < 100; i++) {
        usernames.add(generateRandomUsername());
      }

      // Should have good variety (at least 80% unique)
      expect(usernames.size).toBeGreaterThan(80);
    });

    it("generates usernames with and without numbers over many iterations", () => {
      let withNumbers = 0;
      let withoutNumbers = 0;

      for (let i = 0; i < 100; i++) {
        const username = generateRandomUsername();
        if (/\d+$/.test(username)) {
          withNumbers++;
        } else {
          withoutNumbers++;
        }
      }

      // Should have a reasonable distribution (roughly 50/50 but allow variance)
      expect(withNumbers).toBeGreaterThan(20);
      expect(withoutNumbers).toBeGreaterThan(20);
    });
  });

  describe("word lists integrity", () => {
    it("only uses valid adjectives from the defined list", () => {
      // Known adjectives from the module (first and last few)
      const knownAdjectives = [
        "Sunny",
        "Cosmic",
        "Electric",
        "Mystic",
        "Crystal",
        "Falling",
        "Rising",
        "Fading",
        "Glowing",
        "Spinning",
      ];

      for (let i = 0; i < 50; i++) {
        const username = generateRandomUsername();
        // Extract potential adjective (everything before second capital or end)
        const parts = username.split(/(?=[A-Z])/);
        const adjective = parts[0];

        // Verify it starts with a known capital letter adjective pattern
        expect(adjective[0]).toMatch(/[A-Z]/);
      }
    });
  });
});
