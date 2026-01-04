/**
 * Pollinations Authentication Utilities
 *
 * Handles API key validation and authentication state for gen.pollinations.ai.
 * Supports both publishable (pk_) and secret (sk_) keys.
 *
 * Following SRP: handles only authentication-related logic.
 */

import { z } from "zod"
import { getApiKey } from "@/lib/config/api.config"

/**
 * API Key type definitions
 */
export const ApiKeyTypeSchema = z.enum(["publishable", "secret"])
export type ApiKeyType = z.infer<typeof ApiKeyTypeSchema>

/**
 * Authentication state schema
 */
export const AuthStateSchema = z.object({
    isAuthenticated: z.boolean(),
    keyType: ApiKeyTypeSchema.nullable(),
    key: z.string().optional(),
})
export type AuthState = z.infer<typeof AuthStateSchema>

/**
 * Rate limit information schema
 */
export const RateLimitInfoSchema = z.object({
    keyType: ApiKeyTypeSchema.nullable(),
    burst: z.union([z.number(), z.literal("unlimited")]),
    refill: z.string(),
    description: z.string(),
})
export type RateLimitInfo = z.infer<typeof RateLimitInfoSchema>

/**
 * Rate limit configurations by key type
 */
const RATE_LIMITS = {
    secret: {
        burst: "unlimited" as const,
        refill: "Unlimited",
        description: "Unlimited requests with secret key",
    },
    publishable: {
        burst: 3,
        refill: "1 per 15 sec",
        description: "3 burst requests, refills 1 per 15 seconds",
    },
    anonymous: {
        burst: 1,
        refill: "1 per 30 sec",
        description: "1 request, refills 1 per 30 seconds",
    },
} as const satisfies Record<string, Omit<RateLimitInfo, "keyType">>

/**
 * Validates an API key and returns its type.
 *
 * @param key - The API key to validate
 * @returns "publishable" | "secret" | null based on key prefix
 */
export function validateApiKeyType(key: string | undefined): ApiKeyType | null {
    if (!key || typeof key !== "string") {
        return null
    }

    const trimmedKey = key.trim()

    if (trimmedKey.startsWith("sk_")) {
        return "secret"
    }

    if (trimmedKey.startsWith("pk_")) {
        return "publishable"
    }

    return null
}

/**
 * Gets the current authentication state.
 * Uses getApiKey() from api.config to determine the key based on environment.
 *
 * @returns AuthState object with authentication details
 */
export function getPollinationsAuth(): AuthState {
    const key = getApiKey()
    const keyType = validateApiKeyType(key)

    return {
        isAuthenticated: keyType !== null,
        keyType,
        key: key || undefined,
    }
}

/**
 * Gets rate limit information based on the key type.
 *
 * @param keyType - The type of API key (or null for anonymous)
 * @returns RateLimitInfo object with rate limit details
 */
export function getRateLimitInfo(keyType: ApiKeyType | null): RateLimitInfo {
    if (keyType === "secret") {
        return { keyType, ...RATE_LIMITS.secret }
    }

    if (keyType === "publishable") {
        return { keyType, ...RATE_LIMITS.publishable }
    }

    return { keyType: null, ...RATE_LIMITS.anonymous }
}

/**
 * Gets the Authorization header value for API requests.
 *
 * @param key - Optional API key (defaults to getApiKey())
 * @returns Bearer token string or undefined if no key
 */
export function getAuthorizationHeader(key?: string): string | undefined {
    const apiKey = key ?? getApiKey()
    if (!apiKey) return undefined
    return `Bearer ${apiKey}`
}

/**
 * Checks if the current environment has a publishable key configured.
 *
 * @returns true if a publishable key is available
 */
export function hasPublishableKey(): boolean {
    const key = process.env.NEXT_PUBLIC_POLLINATIONS_KEY
    return validateApiKeyType(key) === "publishable"
}
