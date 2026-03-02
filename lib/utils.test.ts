/**
 * Tests for lib/utils
 *
 * Tests the core utility functions used throughout the application.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cn, isLocalhost } from "./utils";

describe("cn (className utility)", () => {
  describe("basic usage", () => {
    it("returns empty string for no arguments", () => {
      expect(cn()).toBe("");
    });

    it("returns single class as-is", () => {
      expect(cn("foo")).toBe("foo");
    });

    it("joins multiple classes with space", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles array of classes", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });
  });

  describe("conditional classes", () => {
    it("includes class when condition is true", () => {
      const isActive = true;
      expect(cn("base", isActive && "active")).toBe("base active");
    });

    it("excludes class when condition is false", () => {
      const isActive = false;
      expect(cn("base", isActive && "active")).toBe("base");
    });

    it("handles object syntax", () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });

    it("handles undefined and null", () => {
      expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
    });
  });

  describe("Tailwind merge functionality", () => {
    it("merges conflicting Tailwind classes (last wins)", () => {
      expect(cn("p-4", "p-8")).toBe("p-8");
    });

    it("merges conflicting text colors", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("merges conflicting background colors", () => {
      expect(cn("bg-white", "bg-black")).toBe("bg-black");
    });

    it("preserves non-conflicting classes", () => {
      expect(cn("p-4", "m-4")).toBe("p-4 m-4");
    });

    it("handles complex Tailwind merging", () => {
      // padding-x vs padding-left conflict
      expect(cn("px-4", "pl-2")).toBe("px-4 pl-2");
    });

    it("merges responsive variants correctly", () => {
      expect(cn("sm:p-4", "sm:p-8")).toBe("sm:p-8");
    });

    it("merges hover variants correctly", () => {
      expect(cn("hover:bg-blue-500", "hover:bg-red-500")).toBe(
        "hover:bg-red-500"
      );
    });
  });

  describe("edge cases", () => {
    it("trims whitespace from classes", () => {
      expect(cn("  foo  ", "  bar  ")).toBe("foo bar");
    });

    it("handles empty strings", () => {
      expect(cn("foo", "", "bar")).toBe("foo bar");
    });

    it("handles mixed conditional and static classes", () => {
      const variant = "primary";
      expect(
        cn(
          "base-class",
          variant === "primary" && "text-blue-500",
          variant === "secondary" && "text-gray-500",
          { disabled: false }
        )
      ).toBe("base-class text-blue-500");
    });
  });
});

describe("isLocalhost", () => {
  const originalWindow = globalThis.window;

  function stubWindow(value: unknown) {
    Object.defineProperty(globalThis, "window", {
      value,
      writable: true,
      configurable: true,
    });
  }

  beforeEach(() => {
    // Reset window mock before each test
    stubWindow(undefined);
  });

  afterEach(() => {
    // Restore original window
    stubWindow(originalWindow);
  });

  describe("server-side rendering (no window)", () => {
    it("returns false when window is undefined", () => {
      stubWindow(undefined);
      expect(isLocalhost()).toBe(false);
    });
  });

  describe("client-side with localhost", () => {
    it('returns true for "localhost"', () => {
      stubWindow({ location: { hostname: "localhost" } });
      expect(isLocalhost()).toBe(true);
    });

    it('returns true for "127.0.0.1"', () => {
      stubWindow({ location: { hostname: "127.0.0.1" } });
      expect(isLocalhost()).toBe(true);
    });
  });

  describe("client-side with production domains", () => {
    it("returns false for production domain", () => {
      stubWindow({ location: { hostname: "example.com" } });
      expect(isLocalhost()).toBe(false);
    });

    it("returns false for subdomain", () => {
      stubWindow({ location: { hostname: "app.example.com" } });
      expect(isLocalhost()).toBe(false);
    });

    it("returns false for vercel preview domains", () => {
      stubWindow({ location: { hostname: "my-app-123.vercel.app" } });
      expect(isLocalhost()).toBe(false);
    });
  });

  describe("edge cases", () => {
    it('returns false for "localhost.com" (not localhost)', () => {
      stubWindow({ location: { hostname: "localhost.com" } });
      expect(isLocalhost()).toBe(false);
    });

    it('returns false for "local.host"', () => {
      stubWindow({ location: { hostname: "local.host" } });
      expect(isLocalhost()).toBe(false);
    });
  });
});
