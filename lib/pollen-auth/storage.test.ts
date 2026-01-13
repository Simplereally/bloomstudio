import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  storeApiKey,
  getStoredApiKey,
  getStoredMetadata,
  clearStoredAuth,
  isAuthExpired,
  getDaysUntilExpiry,
  isValidApiKeyFormat,
} from "./storage";
import {
  STORAGE_KEY,
  STORAGE_EXPIRY_KEY,
  STORAGE_AUTHORIZED_AT_KEY,
  EXPIRY_DAYS,
} from "./constants";

describe("pollen-auth/storage", () => {
  // Store original localStorage descriptor for restoration
  let originalLocalStorageDescriptor: PropertyDescriptor | undefined;

  // Mock localStorage - use factory function to create fresh store per test
  const createLocalStorageMock = () => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((i: number) => Object.keys(store)[i] || null),
    };
  };

  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // Save original descriptor before first test
    if (originalLocalStorageDescriptor === undefined) {
      originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
        window,
        "localStorage"
      );
    }

    // Create fresh mock for each test
    localStorageMock = createLocalStorageMock();

    // Use Object.defineProperty to stub window.localStorage directly
    // This ensures the mock is applied correctly since storage.ts uses window.localStorage
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original localStorage
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, "localStorage", originalLocalStorageDescriptor);
    }
  });

  describe("storeApiKey", () => {
    it("should store API key and metadata in localStorage", () => {
      const apiKey = "sk_test123456";
      const authorizedAt = Date.now();

      const result = storeApiKey(apiKey, authorizedAt);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        apiKey
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_AUTHORIZED_AT_KEY,
        String(authorizedAt)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_EXPIRY_KEY,
        String(authorizedAt + EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      );
    });

    it("should use current time as default authorizedAt", () => {
      const apiKey = "sk_test123456";
      const before = Date.now();
      storeApiKey(apiKey);
      const after = Date.now();

      const storedAuthorizedAt = localStorageMock.setItem.mock.calls.find(
        (call) => call[0] === STORAGE_AUTHORIZED_AT_KEY
      )?.[1];

      expect(Number(storedAuthorizedAt)).toBeGreaterThanOrEqual(before);
      expect(Number(storedAuthorizedAt)).toBeLessThanOrEqual(after);
    });

    it("should return false for empty API key", () => {
      const result = storeApiKey("");
      expect(result).toBe(false);
      // The isLocalStorageAvailable check uses setItem for feature detection,
      // but we should verify no actual key storage call was made
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.anything()
      );
    });

    it("should return false for invalid API key type", () => {
      // @ts-expect-error - Testing runtime behavior with wrong type
      const result = storeApiKey(null);
      expect(result).toBe(false);
    });
  });

  describe("getStoredApiKey", () => {
    it("should retrieve stored API key", () => {
      const apiKey = "sk_test123456";
      localStorageMock.setItem(STORAGE_KEY, apiKey);

      const result = getStoredApiKey();

      expect(result).toBe(apiKey);
    });

    it("should return null when no key is stored", () => {
      const result = getStoredApiKey();
      expect(result).toBeNull();
    });
  });

  describe("getStoredMetadata", () => {
    it("should retrieve stored metadata", () => {
      const authorizedAt = Date.now();
      const expiresAt = authorizedAt + EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      localStorageMock.setItem(
        STORAGE_AUTHORIZED_AT_KEY,
        String(authorizedAt)
      );
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, String(expiresAt));

      const result = getStoredMetadata();

      expect(result).toEqual({
        authorizedAt,
        expiresAt,
      });
    });

    it("should return null when metadata is missing", () => {
      const result = getStoredMetadata();
      expect(result).toBeNull();
    });

    it("should return null when only partial metadata exists", () => {
      localStorageMock.setItem(STORAGE_AUTHORIZED_AT_KEY, String(Date.now()));
      // Missing STORAGE_EXPIRY_KEY

      const result = getStoredMetadata();
      expect(result).toBeNull();
    });
  });

  describe("clearStoredAuth", () => {
    it("should remove all stored auth data", () => {
      // Store some data first
      localStorageMock.setItem(STORAGE_KEY, "sk_test");
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, "123");
      localStorageMock.setItem(STORAGE_AUTHORIZED_AT_KEY, "456");

      const result = clearStoredAuth();

      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_EXPIRY_KEY
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        STORAGE_AUTHORIZED_AT_KEY
      );
    });
  });

  describe("isAuthExpired", () => {
    it("should return true when no auth is stored", () => {
      const result = isAuthExpired();
      expect(result).toBe(true);
    });

    it("should return true when auth is expired", () => {
      const expiredTime = Date.now() - 1000; // 1 second ago
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, String(expiredTime));
      localStorageMock.setItem(
        STORAGE_AUTHORIZED_AT_KEY,
        String(expiredTime - EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      );

      const result = isAuthExpired();
      expect(result).toBe(true);
    });

    it("should return false when auth is valid", () => {
      const futureTime = Date.now() + 24 * 60 * 60 * 1000; // 1 day from now
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, String(futureTime));
      localStorageMock.setItem(
        STORAGE_AUTHORIZED_AT_KEY,
        String(futureTime - EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      );

      const result = isAuthExpired();
      expect(result).toBe(false);
    });
  });

  describe("getDaysUntilExpiry", () => {
    it("should return null when no auth is stored", () => {
      const result = getDaysUntilExpiry();
      expect(result).toBeNull();
    });

    it("should return 0 when auth is expired", () => {
      const expiredTime = Date.now() - 24 * 60 * 60 * 1000; // 1 day ago
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, String(expiredTime));
      localStorageMock.setItem(
        STORAGE_AUTHORIZED_AT_KEY,
        String(expiredTime - EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      );

      const result = getDaysUntilExpiry();
      expect(result).toBe(0);
    });

    it("should return correct days remaining", () => {
      const daysFromNow = 15;
      const futureTime =
        Date.now() + daysFromNow * 24 * 60 * 60 * 1000 - 1000; // Just under 15 days
      localStorageMock.setItem(STORAGE_EXPIRY_KEY, String(futureTime));
      localStorageMock.setItem(
        STORAGE_AUTHORIZED_AT_KEY,
        String(futureTime - EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      );

      const result = getDaysUntilExpiry();
      expect(result).toBe(daysFromNow);
    });
  });

  describe("isValidApiKeyFormat", () => {
    it("should return true for valid sk_ prefixed keys", () => {
      expect(isValidApiKeyFormat("sk_test123456")).toBe(true);
      expect(isValidApiKeyFormat("sk_abcdefghij")).toBe(true);
      expect(
        isValidApiKeyFormat("sk_very_long_key_with_lots_of_characters")
      ).toBe(true);
    });

    it("should return false for invalid keys", () => {
      expect(isValidApiKeyFormat("")).toBe(false);
      expect(isValidApiKeyFormat("test123456")).toBe(false);
      expect(isValidApiKeyFormat("pk_test123456")).toBe(false);
      expect(isValidApiKeyFormat("sk_short")).toBe(false); // Too short
      // @ts-expect-error - Testing runtime behavior with wrong type
      expect(isValidApiKeyFormat(null)).toBe(false);
      // @ts-expect-error - Testing runtime behavior with wrong type
      expect(isValidApiKeyFormat(undefined)).toBe(false);
    });
  });
});
