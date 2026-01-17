/**
 * Pollen Auth Validation Utilities
 *
 * Provides validation for BYOP API keys.
 *
 * Note: localStorage storage has been removed. Convex is now the single
 * source of truth for API key persistence. See context.tsx for details.
 */

/**
 * Validates that an API key has the expected format.
 * BYOP keys from Pollinations start with "sk_".
 *
 * @param apiKey - The API key to validate
 * @returns true if the key appears valid, false otherwise
 *
 * @example
 * ```ts
 * if (!isValidApiKeyFormat(apiKey)) {
 *   throw new Error("Invalid API key format");
 * }
 * ```
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  // BYOP keys start with sk_ and have reasonable length
  return apiKey.startsWith("sk_") && apiKey.length >= 10;
}
