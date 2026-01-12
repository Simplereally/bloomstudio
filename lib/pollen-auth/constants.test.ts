import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  STORAGE_KEY,
  STORAGE_EXPIRY_KEY,
  STORAGE_AUTHORIZED_AT_KEY,
  EXPIRY_DAYS,
  EXPIRING_SOON_THRESHOLD_DAYS,
  POLLINATIONS_AUTH_BASE_URL,
  CALLBACK_KEY_PARAM,
  buildAuthorizationUrl,
  getCallbackUrl,
} from "./constants";

describe("pollen-auth/constants", () => {
  describe("Storage Keys", () => {
    it("should have correct storage key values", () => {
      expect(STORAGE_KEY).toBe("pollinations_byop_key");
      expect(STORAGE_EXPIRY_KEY).toBe("pollinations_byop_expiry");
      expect(STORAGE_AUTHORIZED_AT_KEY).toBe("pollinations_byop_authorized_at");
    });
  });

  describe("Expiry Configuration", () => {
    it("should have 30 day expiry", () => {
      expect(EXPIRY_DAYS).toBe(30);
    });

    it("should warn 7 days before expiry", () => {
      expect(EXPIRING_SOON_THRESHOLD_DAYS).toBe(7);
    });
  });

  describe("Auth URLs", () => {
    it("should have correct Pollinations auth base URL", () => {
      expect(POLLINATIONS_AUTH_BASE_URL).toBe(
        "https://enter.pollinations.ai/authorize"
      );
    });

    it("should have correct callback key parameter", () => {
      expect(CALLBACK_KEY_PARAM).toBe("api_key");
    });
  });

  describe("buildAuthorizationUrl", () => {
    it("should build URL with redirect_url parameter", () => {
      const redirectUrl = "https://example.com/callback";
      const result = buildAuthorizationUrl(redirectUrl);

      expect(result).toContain(POLLINATIONS_AUTH_BASE_URL);
      expect(result).toContain(
        `redirect_url=${encodeURIComponent(redirectUrl)}`
      );
    });

    it("should properly encode special characters in redirect URL", () => {
      const redirectUrl = "https://example.com/callback?foo=bar&baz=qux";
      const result = buildAuthorizationUrl(redirectUrl);

      // Should be double-encoded since it's a URL within a URL
      expect(result).toContain("redirect_url=");
      expect(result).not.toContain("?foo=bar");
    });
  });

  describe("getCallbackUrl", () => {
    const originalWindow = global.window;
    const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    });

    afterEach(() => {
      global.window = originalWindow;
      if (originalEnv) {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", originalEnv);
      }
    });

    it("should use window.location.origin when available", () => {
      global.window = {
        location: {
          origin: "https://myapp.com",
        },
      } as unknown as Window & typeof globalThis;

      const result = getCallbackUrl();
      expect(result).toBe("https://myapp.com/auth/pollinations/callback");
    });

    it("should use NEXT_PUBLIC_APP_URL when window is not available", () => {
      // @ts-expect-error - Intentionally setting window to undefined for testing
      global.window = undefined;
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://env-app.com");

      const result = getCallbackUrl();
      expect(result).toBe("https://env-app.com/auth/pollinations/callback");
    });

    it("should fall back to default URL when neither is available", () => {
      // @ts-expect-error - Intentionally setting window to undefined for testing
      global.window = undefined;
      vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);

      const result = getCallbackUrl();
      expect(result).toBe(
        "https://bloomstudio.fun/auth/pollinations/callback"
      );
    });
  });
});
