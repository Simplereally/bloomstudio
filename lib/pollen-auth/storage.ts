/**
 * Pollen Auth Storage Utilities
 *
 * Provides localStorage wrappers for securely storing and retrieving
 * the BYOP API key and associated metadata.
 *
 * Security: Keys are stored ONLY in localStorage and never sent to our server.
 */

import {
  EXPIRY_DAYS,
  STORAGE_AUTHORIZED_AT_KEY,
  STORAGE_EXPIRY_KEY,
  STORAGE_KEY,
} from "./constants";

/**
 * Custom event name dispatched when pollen auth storage changes.
 * This is used to notify same-tab listeners (the native storage event only fires cross-tab).
 */
export const POLLEN_AUTH_CHANGED_EVENT = "pollen-auth-changed";

/**
 * Dispatches the custom auth changed event if in browser environment.
 */
function dispatchAuthChangedEvent(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(POLLEN_AUTH_CHANGED_EVENT));
  }
}

/**
 * Metadata stored alongside the API key.
 */
export interface PollenAuthMetadata {
  /** When the user authorized (Unix timestamp in ms) */
  authorizedAt: number;
  /** When the authorization expires (Unix timestamp in ms) */
  expiresAt: number;
}

/**
 * Check if we're running in a browser environment with localStorage available.
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Stores the BYOP API key and metadata in localStorage.
 *
 * @param apiKey - The API key to store (format: sk_...)
 * @param authorizedAt - Optional timestamp when authorized (defaults to now)
 * @returns true if stored successfully, false otherwise
 */
export function storeApiKey(
  apiKey: string,
  authorizedAt: number = Date.now()
): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn("[PollenAuth] localStorage is not available");
    return false;
  }

  // Validate API key format before attempting storage
  if (!isValidApiKeyFormat(apiKey)) {
    console.warn("[PollenAuth] Invalid API key format provided");
    return false;
  }

  // Prepare all values before writing to storage (atomic-like write)
  const expiresAt = authorizedAt + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const values: Array<{ key: string; value: string }> = [
    { key: STORAGE_KEY, value: apiKey },
    { key: STORAGE_EXPIRY_KEY, value: String(expiresAt) },
    { key: STORAGE_AUTHORIZED_AT_KEY, value: String(authorizedAt) },
  ];

  try {
    // Write all values within the try block
    for (const { key, value } of values) {
      window.localStorage.setItem(key, value);
    }

    // Dispatch custom event to notify same-tab listeners
    dispatchAuthChangedEvent();

    return true;
  } catch (error) {
    console.error("[PollenAuth] Failed to store API key:", error);

    // Clean up any keys that may have been written to avoid partial-write state
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_EXPIRY_KEY);
      window.localStorage.removeItem(STORAGE_AUTHORIZED_AT_KEY);
    } catch {
      // Ignore cleanup errors - we're already in an error state
    }

    return false;
  }
}

/**
 * Retrieves the stored BYOP API key from localStorage.
 *
 * @returns The stored API key, or null if not found
 */
export function getStoredApiKey(): string | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("[PollenAuth] Failed to retrieve API key:", error);
    return null;
  }
}

/**
 * Retrieves the stored metadata for the BYOP authorization.
 *
 * @returns The stored metadata, or null if not found
 */
export function getStoredMetadata(): PollenAuthMetadata | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const authorizedAtStr = window.localStorage.getItem(
      STORAGE_AUTHORIZED_AT_KEY
    );
    const expiresAtStr = window.localStorage.getItem(STORAGE_EXPIRY_KEY);

    if (!authorizedAtStr || !expiresAtStr) {
      return null;
    }

    const authorizedAt = parseInt(authorizedAtStr, 10);
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(authorizedAt) || isNaN(expiresAt)) {
      return null;
    }

    return { authorizedAt, expiresAt };
  } catch (error) {
    console.error("[PollenAuth] Failed to retrieve metadata:", error);
    return null;
  }
}

/**
 * Clears all stored BYOP authorization data from localStorage.
 *
 * @returns true if cleared successfully, false otherwise
 */
export function clearStoredAuth(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_EXPIRY_KEY);
    window.localStorage.removeItem(STORAGE_AUTHORIZED_AT_KEY);

    // Dispatch custom event to notify same-tab listeners
    dispatchAuthChangedEvent();

    return true;
  } catch (error) {
    console.error("[PollenAuth] Failed to clear stored auth:", error);
    return false;
  }
}

/**
 * Checks if the stored authorization has expired.
 *
 * @returns true if expired or no auth stored, false if still valid
 */
export function isAuthExpired(): boolean {
  const metadata = getStoredMetadata();
  if (!metadata) {
    return true;
  }
  return Date.now() >= metadata.expiresAt;
}

/**
 * Calculates the number of days until the authorization expires.
 *
 * @returns Number of days until expiry, or null if no auth stored
 */
export function getDaysUntilExpiry(): number | null {
  const metadata = getStoredMetadata();
  if (!metadata) {
    return null;
  }

  const msUntilExpiry = metadata.expiresAt - Date.now();
  if (msUntilExpiry <= 0) {
    return 0;
  }

  return Math.ceil(msUntilExpiry / (24 * 60 * 60 * 1000));
}

/**
 * Validates that an API key has the expected format.
 * BYOP keys from Pollinations start with "sk_".
 *
 * @param apiKey - The API key to validate
 * @returns true if the key appears valid, false otherwise
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  // BYOP keys start with sk_ and have reasonable length
  return apiKey.startsWith("sk_") && apiKey.length >= 10;
}
