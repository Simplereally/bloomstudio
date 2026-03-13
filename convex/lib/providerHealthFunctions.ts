/**
 * Provider Health Convex Functions
 * 
 * Queries and mutations for managing vision provider rate limit status.
 */

import { internalMutation, internalQuery } from "../_generated/server"
import { v } from "convex/values"
import {
    getProviderHealth,
    hasAvailableProvider,
    markProviderRateLimited,
    markProviderAvailable,
    parseGroqRateLimitError,
    parseOpenRouterRateLimitError,
    type ProviderName,
} from "./providerHealth"

// =============================================================================
// Queries
// =============================================================================

/**
 * Check if any vision provider is available
 */
export const checkProvidersAvailable = internalQuery({
    args: {},
    handler: async (ctx) => {
        return hasAvailableProvider(ctx)
    },
})

/**
 * Get health status of a specific provider
 */
export const getHealth = internalQuery({
    args: {
        provider: v.union(v.literal("groq"), v.literal("openrouter")),
    },
    handler: async (ctx, args) => {
        return getProviderHealth(ctx, args.provider)
    },
})

export const getAllHealth = internalQuery({
    args: {},
    handler: async (ctx) => {
        return Promise.all([
            getProviderHealth(ctx, "groq"),
            getProviderHealth(ctx, "openrouter"),
        ])
    },
})

// =============================================================================
// Mutations
// =============================================================================

/**
 * Mark a provider as rate-limited based on error response
 */
export const recordRateLimit = internalMutation({
    args: {
        provider: v.union(v.literal("groq"), v.literal("openrouter")),
        errorBody: v.string(),
    },
    handler: async (ctx, args) => {
        const rateLimitInfo = args.provider === "groq"
            ? parseGroqRateLimitError(args.errorBody)
            : parseOpenRouterRateLimitError(args.errorBody)

        await markProviderRateLimited(ctx, args.provider, rateLimitInfo)
    },
})

/**
 * Mark a provider as rate-limited with explicit reset time
 * Used when we know the exact reset timestamp
 */
export const recordRateLimitWithReset = internalMutation({
    args: {
        provider: v.union(v.literal("groq"), v.literal("openrouter")),
        resetAt: v.number(),
        remaining: v.optional(v.number()),
        limit: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await markProviderRateLimited(ctx, args.provider, {
            resetAt: args.resetAt,
            remaining: args.remaining,
            limit: args.limit,
            errorMessage: args.errorMessage,
        })
    },
})

/**
 * Mark a provider as available (manual reset or after checking)
 */
export const markAvailable = internalMutation({
    args: {
        provider: v.union(v.literal("groq"), v.literal("openrouter")),
    },
    handler: async (ctx, args) => {
        await markProviderAvailable(ctx, args.provider)
    },
})

/**
 * Check and reset providers whose rate limits have expired
 */
export const refreshExpiredLimits = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now()
        const providers: ProviderName[] = ["groq", "openrouter"]

        for (const provider of providers) {
            const health = await ctx.db
                .query("providerHealth")
                .withIndex("by_provider", (q) => q.eq("provider", provider))
                .first()

            if (health && !health.isAvailable && health.rateLimitedUntil) {
                if (health.rateLimitedUntil <= now) {
                    await markProviderAvailable(ctx, provider)
                }
            }
        }
    },
})

/**
 * Reset all provider health data (for debugging/testing)
 */
export const resetAllProviders = internalMutation({
    args: {},
    handler: async (ctx) => {
        await markProviderAvailable(ctx, "groq")
        await markProviderAvailable(ctx, "openrouter")
    },
})
