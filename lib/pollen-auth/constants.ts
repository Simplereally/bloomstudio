/**
 * Pollen Auth Constants
 *
 * Configuration constants for the BYOP (Bring Your Own Pollen) authentication system.
 * These constants define storage keys, expiration settings, and Pollinations OAuth URLs.
 */

/**
 * localStorage key for storing the BYOP API key.
 * The key is stored client-side only for security.
 */
export const STORAGE_KEY = "pollinations_byop_key";

/**
 * localStorage key for storing the expiry timestamp.
 * Stored as Unix timestamp (milliseconds).
 */
export const STORAGE_EXPIRY_KEY = "pollinations_byop_expiry";

/**
 * localStorage key for storing when the user authorized.
 * Stored as Unix timestamp (milliseconds).
 */
export const STORAGE_AUTHORIZED_AT_KEY = "pollinations_byop_authorized_at";

/**
 * Number of days until the BYOP API key expires.
 * Pollinations BYOP keys have a 30-day lifetime.
 */
export const EXPIRY_DAYS = 30;

/**
 * Number of days before expiry to start showing "expiring soon" warnings.
 * Users will see a reconnect prompt when their key is about to expire.
 */
export const EXPIRING_SOON_THRESHOLD_DAYS = 7;

/**
 * The base URL for Pollinations OAuth authorization.
 * Users are redirected here to authorize access to their Pollen wallet.
 */
export const POLLINATIONS_AUTH_BASE_URL =
  "https://enter.pollinations.ai/authorize";

/**
 * The hash parameter name for the API key in the OAuth callback.
 * Pollinations returns the key in the URL hash fragment as: #api_key=sk_...
 */
export const CALLBACK_KEY_PARAM = "api_key";

/**
 * Builds the full Pollinations authorization URL with the redirect URL.
 * @param redirectUrl - The URL to redirect back to after authorization
 * @returns The complete authorization URL
 */
export function buildAuthorizationUrl(redirectUrl: string): string {
  const url = new URL(POLLINATIONS_AUTH_BASE_URL);
  url.searchParams.set("redirect_url", redirectUrl);
  return url.toString();
}

/**
 * Gets the callback URL for the current environment.
 * Uses NEXT_PUBLIC_APP_URL or falls back to window.location.origin.
 * @returns The callback URL path
 */
export function getCallbackUrl(): string {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://bloomstudio.fun";
  return `${baseUrl}/auth/pollinations/callback`;
}
