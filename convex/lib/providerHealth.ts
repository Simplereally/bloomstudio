/**
 * Provider Health Management
 * 
 * Tracks rate limit status for vision analysis providers (Groq, OpenRouter).
 * Prevents wasteful API calls when providers are rate-limited.
 */

import { MutationCtx, QueryCtx } from "../_generated/server"

// =============================================================================
// Types
// =============================================================================

export type ProviderName = "groq" | "openrouter"

export interface ProviderStatus {
    provider: ProviderName
    isAvailable: boolean
    rateLimitedUntil?: number
    remainingRequests?: number
    requestLimit?: number
}

export interface RateLimitInfo {
    /** Unix timestamp (ms) when the rate limit resets */
    resetAt: number
    /** Number of remaining requests (if known) */
    remaining?: number
    /** Maximum requests in the window (if known) */
    limit?: number
    /** Error message from the provider */
    errorMessage?: string
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Get the health status of a provider
 */
export async function getProviderHealth(
    ctx: QueryCtx,
    provider: ProviderName
): Promise<ProviderStatus | null> {
    const health = await ctx.db
        .query("providerHealth")
        .withIndex("by_provider", (q) => q.eq("provider", provider))
        .first()

    if (!health) {
        return null
    }

    // Check if rate limit has expired
    const now = Date.now()
    const isExpired = health.rateLimitedUntil && health.rateLimitedUntil <= now

    return {
        provider: health.provider,
        isAvailable: isExpired ? true : health.isAvailable,
        rateLimitedUntil: health.rateLimitedUntil,
        remainingRequests: health.remainingRequests,
        requestLimit: health.requestLimit,
    }
}

/**
 * Check if any provider is available for vision analysis
 */
export async function hasAvailableProvider(ctx: QueryCtx): Promise<boolean> {
    const now = Date.now()

    // Check Groq
    const groqHealth = await getProviderHealth(ctx, "groq")
    if (!groqHealth || groqHealth.isAvailable || 
        (groqHealth.rateLimitedUntil && groqHealth.rateLimitedUntil <= now)) {
        return true
    }

    // Check OpenRouter
    const openrouterHealth = await getProviderHealth(ctx, "openrouter")
    if (!openrouterHealth || openrouterHealth.isAvailable || 
        (openrouterHealth.rateLimitedUntil && openrouterHealth.rateLimitedUntil <= now)) {
        return true
    }

    return false
}

/**
 * Get all provider statuses
 */
export async function getAllProviderHealth(ctx: QueryCtx): Promise<ProviderStatus[]> {
    const groq = await getProviderHealth(ctx, "groq")
    const openrouter = await getProviderHealth(ctx, "openrouter")

    const statuses: ProviderStatus[] = []
    if (groq) statuses.push(groq)
    if (openrouter) statuses.push(openrouter)

    return statuses
}

// =============================================================================
// Mutation Functions
// =============================================================================

/**
 * Mark a provider as rate-limited
 */
export async function markProviderRateLimited(
    ctx: MutationCtx,
    provider: ProviderName,
    rateLimitInfo: RateLimitInfo
): Promise<void> {
    const existing = await ctx.db
        .query("providerHealth")
        .withIndex("by_provider", (q) => q.eq("provider", provider))
        .first()

    const now = Date.now()

    if (existing) {
        await ctx.db.patch(existing._id, {
            isAvailable: false,
            rateLimitedUntil: rateLimitInfo.resetAt,
            remainingRequests: rateLimitInfo.remaining ?? 0,
            requestLimit: rateLimitInfo.limit,
            lastError: rateLimitInfo.errorMessage,
            lastChecked: now,
        })
    } else {
        await ctx.db.insert("providerHealth", {
            provider,
            isAvailable: false,
            rateLimitedUntil: rateLimitInfo.resetAt,
            remainingRequests: rateLimitInfo.remaining ?? 0,
            requestLimit: rateLimitInfo.limit,
            lastError: rateLimitInfo.errorMessage,
            lastChecked: now,
        })
    }
}

/**
 * Mark a provider as available (rate limit expired or manually reset)
 */
export async function markProviderAvailable(
    ctx: MutationCtx,
    provider: ProviderName
): Promise<void> {
    const existing = await ctx.db
        .query("providerHealth")
        .withIndex("by_provider", (q) => q.eq("provider", provider))
        .first()

    const now = Date.now()

    if (existing) {
        await ctx.db.patch(existing._id, {
            isAvailable: true,
            rateLimitedUntil: undefined,
            lastError: undefined,
            lastChecked: now,
        })
    } else {
        await ctx.db.insert("providerHealth", {
            provider,
            isAvailable: true,
            lastChecked: now,
        })
    }
}

/**
 * Update provider health after a successful request
 */
export async function updateProviderSuccess(
    ctx: MutationCtx,
    provider: ProviderName,
    remaining?: number,
    limit?: number
): Promise<void> {
    const existing = await ctx.db
        .query("providerHealth")
        .withIndex("by_provider", (q) => q.eq("provider", provider))
        .first()

    const now = Date.now()

    if (existing) {
        await ctx.db.patch(existing._id, {
            isAvailable: true,
            remainingRequests: remaining,
            requestLimit: limit,
            lastError: undefined,
            lastChecked: now,
        })
    } else {
        await ctx.db.insert("providerHealth", {
            provider,
            isAvailable: true,
            remainingRequests: remaining,
            requestLimit: limit,
            lastChecked: now,
        })
    }
}

// =============================================================================
// Parsing Utilities
// =============================================================================

/**
 * Parse rate limit info from a Groq 429 error response
 * 
 * Groq uses a ROLLING 24-hour window for daily limits:
 * - If you hit the limit at 10:00 AM, it resets at 10:00 AM the next day
 * - NOT at midnight UTC like OpenRouter
 * 
 * Groq errors look like:
 * - Daily limit (RPD): "Rate limit reached for model ... on requests per day (RPD)"
 * - Per-minute: "Rate limit reached ... on requests per minute (RPM)"
 * 
 * Headers to watch:
 * - x-ratelimit-reset-requests: Duration string like "12s", "4h", "23h59m"
 */
export function parseGroqRateLimitError(errorMessage: string): RateLimitInfo {
    const now = Date.now()
    
    // Try to extract the x-ratelimit-reset-requests duration from the error
    // This header provides the actual time until reset (e.g., "12s", "4h", "23h59m45s")
    const resetDurationMatch = errorMessage.match(/reset[- ]?requests?[:\s]+(\d+h)?(\d+m)?(\d+(?:\.\d+)?s)?/i)
    
    if (resetDurationMatch) {
        let delayMs = 0
        const hoursStr = resetDurationMatch[1]
        const minsStr = resetDurationMatch[2]
        const secsStr = resetDurationMatch[3]
        
        if (hoursStr) delayMs += parseInt(hoursStr, 10) * 60 * 60 * 1000
        if (minsStr) delayMs += parseInt(minsStr, 10) * 60 * 1000
        if (secsStr) delayMs += parseFloat(secsStr) * 1000
        
        if (delayMs > 0) {
            return {
                resetAt: now + delayMs,
                errorMessage,
            }
        }
    }
    
    // Check if this is a daily limit (RPD) error
    const isDailyLimit = errorMessage.toLowerCase().includes("per day") || 
                         errorMessage.toLowerCase().includes("rpd")
    
    if (isDailyLimit) {
        // Groq uses a ROLLING 24h window - reset is 24 hours from now
        // (The actual reset time depends on when the oldest request in the window was made,
        // but 24h is the conservative maximum)
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
        
        return {
            resetAt: now + TWENTY_FOUR_HOURS_MS,
            errorMessage,
        }
    }
    
    // For per-minute limits, try to extract the "try again in Xm Ys" time
    const retryMatch = errorMessage.match(/try again in (\d+)m([\d.]+)s/i)
    
    if (retryMatch) {
        const minutes = parseInt(retryMatch[1], 10)
        const seconds = parseFloat(retryMatch[2])
        const delayMs = (minutes * 60 + seconds) * 1000
        return {
            resetAt: now + delayMs,
            errorMessage,
        }
    }

    // Fallback: assume 24h rolling window for Groq (conservative)
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
    
    return {
        resetAt: now + TWENTY_FOUR_HOURS_MS,
        errorMessage,
    }
}

/**
 * Parse rate limit info from an OpenRouter 429 error response
 * 
 * OpenRouter has TWO rate limits:
 * - Per-minute: 20 RPM (free tier), resets every minute
 * - Per-day: 50 RPD (free tier), resets at midnight UTC
 * 
 * Error message indicates which limit was hit:
 * - "free-models-per-min" → per-minute limit
 * - "free-models-per-day" → daily limit
 * 
 * OpenRouter errors include metadata:
 * {
 *   "error": {
 *     "message": "Rate limit exceeded: free-models-per-min.",
 *     "metadata": {
 *       "headers": {
 *         "X-RateLimit-Reset": "1768521600000"
 *       }
 *     }
 *   }
 * }
 */
export function parseOpenRouterRateLimitError(errorBody: string): RateLimitInfo {
    const now = Date.now()
    
    try {
        const parsed = JSON.parse(errorBody)
        const errorMessage = parsed?.error?.message ?? ""
        const headers = parsed?.error?.metadata?.headers
        
        // Check if this is a per-minute limit (short wait) vs daily limit (midnight UTC)
        const isPerMinuteLimit = errorMessage.toLowerCase().includes("per-min") ||
                                  errorMessage.toLowerCase().includes("per_min") ||
                                  errorMessage.toLowerCase().includes("per minute")
        
        const isPerDayLimit = errorMessage.toLowerCase().includes("per-day") ||
                              errorMessage.toLowerCase().includes("per_day") ||
                              errorMessage.toLowerCase().includes("per day")
        
        if (headers) {
            const resetAt = headers["X-RateLimit-Reset"]
            const remaining = headers["X-RateLimit-Remaining"]
            const limit = headers["X-RateLimit-Limit"]
            
            if (resetAt) {
                const resetTimestamp = parseInt(resetAt, 10)
                
                // For per-minute limits, use the header value (typically 1-2 mins)
                if (isPerMinuteLimit) {
                    return {
                        resetAt: resetTimestamp,
                        remaining: remaining ? parseInt(remaining, 10) : 0,
                        limit: limit ? parseInt(limit, 10) : undefined,
                        errorMessage,
                    }
                }
                
                // For daily limits, the X-RateLimit-Reset should be midnight UTC
                // But if it's somehow in the past, calculate next midnight
                if (isPerDayLimit) {
                    if (resetTimestamp > now) {
                        return {
                            resetAt: resetTimestamp,
                            remaining: remaining ? parseInt(remaining, 10) : 0,
                            limit: limit ? parseInt(limit, 10) : undefined,
                            errorMessage,
                        }
                    }
                    // Reset is in the past, calculate next midnight
                    const nextMidnightUTC = new Date()
                    nextMidnightUTC.setUTCHours(24, 0, 0, 0)
                    return {
                        resetAt: nextMidnightUTC.getTime(),
                        remaining: 0,
                        limit: limit ? parseInt(limit, 10) : undefined,
                        errorMessage,
                    }
                }
                
                // Unknown limit type - use header value if in future, else midnight
                if (resetTimestamp > now) {
                    return {
                        resetAt: resetTimestamp,
                        remaining: remaining ? parseInt(remaining, 10) : 0,
                        limit: limit ? parseInt(limit, 10) : undefined,
                        errorMessage,
                    }
                }
            }
        }
    } catch {
        // Failed to parse JSON
    }

    // Fallback: OpenRouter free tier daily limit resets at midnight UTC
    const nextMidnightUTC = new Date()
    nextMidnightUTC.setUTCHours(24, 0, 0, 0)
    
    return {
        resetAt: nextMidnightUTC.getTime(),
        errorMessage: errorBody,
    }
}
