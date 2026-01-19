/**
 * Tests for constants
 *
 * Tests the application-wide constants.
 */

import { describe, it, expect } from "vitest";
import { LAST_UPDATED, TERMS_LAST_UPDATED } from "./constants";

describe("constants", () => {
  describe("LAST_UPDATED", () => {
    it("is a non-empty string", () => {
      expect(LAST_UPDATED).toBeDefined();
      expect(typeof LAST_UPDATED).toBe("string");
      expect(LAST_UPDATED.length).toBeGreaterThan(0);
    });

    it("follows expected date format", () => {
      // Should be in format like "January 11, 2026"
      expect(LAST_UPDATED).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
    });
  });

  describe("TERMS_LAST_UPDATED", () => {
    it("is a non-empty string", () => {
      expect(TERMS_LAST_UPDATED).toBeDefined();
      expect(typeof TERMS_LAST_UPDATED).toBe("string");
      expect(TERMS_LAST_UPDATED.length).toBeGreaterThan(0);
    });

    it("follows expected date format", () => {
      // Should be in format like "January 11, 2026"
      expect(TERMS_LAST_UPDATED).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
    });
  });
});
