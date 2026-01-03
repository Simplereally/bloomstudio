"use client"

/**
 * useAuthStatus Hook
 *
 * Client-side hook for checking Pollinations API authentication status.
 * Returns authentication state and rate limit information.
 *
 * Note: Only checks the NEXT_PUBLIC_POLLINATIONS_KEY on the client side.
 * Server-side secret key status is not exposed to the client.
 */

import { useMemo } from "react"
import {
    validateApiKeyType,
    getRateLimitInfo,
    type ApiKeyType,
    type RateLimitInfo,
} from "@/lib/auth"

/**
 * Return type for useAuthStatus hook
 */
export interface UseAuthStatusReturn {
    /** Whether any API key is configured */
    isAuthenticated: boolean

    /** Type of API key configured (only "publishable" or null on client) */
    keyType: ApiKeyType | null

    /** Rate limit information based on key type */
    rateLimitInfo: RateLimitInfo

    /** Human-readable rate limit description */
    rateLimitDescription: string
}

/**
 * Hook for checking client-side authentication status.
 *
 * This hook only checks the publishable key (NEXT_PUBLIC_POLLINATIONS_KEY)
 * as secret keys should never be exposed to the client.
 *
 * @example
 * ```tsx
 * const { isAuthenticated, keyType, rateLimitDescription } = useAuthStatus()
 *
 * return (
 *   <div>
 *     {isAuthenticated ? (
 *       <Badge variant="success">Authenticated ({keyType})</Badge>
 *     ) : (
 *       <Badge variant="outline">Anonymous</Badge>
 *     )}
 *     <p className="text-xs text-muted-foreground">
 *       Rate limit: {rateLimitDescription}
 *     </p>
 *   </div>
 * )
 * ```
 */
export function useAuthStatus(): UseAuthStatusReturn {
    return useMemo(() => {
        // Get the publishable key from environment
        const publishableKey = process.env.NEXT_PUBLIC_POLLINATIONS_KEY
        const keyType = validateApiKeyType(publishableKey)

        // Only "publishable" or null is valid on client
        // If somehow a secret key is in NEXT_PUBLIC, treat as invalid
        const validKeyType = keyType === "publishable" ? keyType : null

        const rateLimitInfo = getRateLimitInfo(validKeyType)

        return {
            isAuthenticated: validKeyType !== null,
            keyType: validKeyType,
            rateLimitInfo,
            rateLimitDescription: rateLimitInfo.description,
        }
    }, [])
}
