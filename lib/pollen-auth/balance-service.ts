/**
 * Pollen Balance Service
 *
 * Service for fetching the user's pollen balance from the Pollinations API.
 * This service handles API calls, response parsing, and error handling.
 */

/**
 * Base URL for the Pollinations API
 */
export const POLLINATIONS_API_BASE = "https://gen.pollinations.ai";

/**
 * Response from Pollinations /account/balance endpoint
 */
export interface PollenBalanceResponse {
  /** The remaining pollen balance */
  balance: number;
}

/**
 * Error types from balance API
 */
export type BalanceErrorCode =
  | "UNAUTHORIZED" // 401 - Invalid or missing API key
  | "FORBIDDEN" // 403 - Missing account:balance permission
  | "NETWORK_ERROR" // Network failure
  | "UNKNOWN_ERROR"; // Unexpected error

/**
 * Error object returned when balance fetch fails
 */
export interface BalanceError {
  code: BalanceErrorCode;
  message: string;
}

/**
 * Type guard to check if an error is a BalanceError
 */
export function isBalanceError(error: unknown): error is BalanceError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as BalanceError).code === "string" &&
    typeof (error as BalanceError).message === "string"
  );
}

/**
 * Builds the Authorization header value for API requests
 */
export function buildAuthHeader(apiKey: string): string {
  return `Bearer ${apiKey}`;
}

/**
 * Builds the full balance endpoint URL
 */
export function buildBalanceUrl(): string {
  return `${POLLINATIONS_API_BASE}/api/account/balance`;
}

/**
 * Parses the balance response from the API
 */
export function parseBalanceResponse(data: unknown): PollenBalanceResponse {
  if (
    typeof data === "object" &&
    data !== null &&
    "balance" in data &&
    typeof (data as PollenBalanceResponse).balance === "number"
  ) {
    return { balance: (data as PollenBalanceResponse).balance };
  }
  throw {
    code: "UNKNOWN_ERROR",
    message: "Invalid response format",
  } as BalanceError;
}

/**
 * Fetches the user's pollen balance from Pollinations API
 *
 * @param apiKey - The user's BYOP API key
 * @returns The balance response containing the remaining pollen
 * @throws {BalanceError} When the request fails
 *
 * @example
 * ```ts
 * try {
 *   const { balance } = await fetchPollenBalance("sk_your_api_key");
 *   console.log(`Balance: ${balance}`);
 * } catch (error) {
 *   if (isBalanceError(error)) {
 *     console.error(`Error: ${error.code} - ${error.message}`);
 *   }
 * }
 * ```
 */
export async function fetchPollenBalance(
  apiKey: string
): Promise<PollenBalanceResponse> {
  try {
    const response = await fetch(buildBalanceUrl(), {
      method: "GET",
      headers: {
        Authorization: buildAuthHeader(apiKey),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw {
          code: "UNAUTHORIZED",
          message: "Invalid or expired API key",
        } as BalanceError;
      }
      if (response.status === 403) {
        throw {
          code: "FORBIDDEN",
          message: "API key missing account:balance permission",
        } as BalanceError;
      }
      throw {
        code: "UNKNOWN_ERROR",
        message: `HTTP ${response.status}`,
      } as BalanceError;
    }

    const data = await response.json();
    return parseBalanceResponse(data);
  } catch (error) {
    // Re-throw BalanceErrors as-is
    if (isBalanceError(error)) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw {
        code: "NETWORK_ERROR",
        message: "Network request failed",
      } as BalanceError;
    }

    // Handle other errors
    throw {
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Unknown network error",
    } as BalanceError;
  }
}
