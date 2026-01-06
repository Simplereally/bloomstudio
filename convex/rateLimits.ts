/**
 * Convex Rate Limiting Module
 *
 * Implements a sliding window rate limiting algorithm using Convex's
 * database for storage. This avoids external dependencies like Redis
 * while providing reliable rate limiting.
 */
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Rate limit configuration for different endpoints.
 * Each entry defines the maximum requests allowed within a time window.
 */
export const RATE_LIMIT_CONFIG = {
    "enhance-prompt": {
        maxRequests: 10,
        windowMs: 60 * 1000, // 1 minute
    },
    "suggestions": {
        maxRequests: 20,
        windowMs: 60 * 1000, // 1 minute
    },
} as const

export type RateLimitEndpoint = keyof typeof RATE_LIMIT_CONFIG

/**
 * Check and consume a rate limit for a given user and endpoint.
 * Uses a sliding window algorithm to track usage.
 *
 * @param userId - The Clerk user ID
 * @param endpoint - The endpoint being rate limited
 * @returns Object with allowed (boolean), remaining requests, and reset time
 */
export const checkRateLimit = mutation({
    args: {
        userId: v.string(),
        endpoint: v.union(v.literal("enhance-prompt"), v.literal("suggestions")),
    },
    returns: v.object({
        allowed: v.boolean(),
        remaining: v.number(),
        resetAt: v.number(),
    }),
    handler: async (ctx, args) => {
        const { userId, endpoint } = args
        const config = RATE_LIMIT_CONFIG[endpoint]
        const key = `${endpoint}:${userId}`
        const now = Date.now()
        const windowStart = now - config.windowMs

        // Get existing rate limit record
        const existing = await ctx.db
            .query("rateLimits")
            .withIndex("by_key", (q) => q.eq("key", key))
            .unique()

        if (!existing) {
            // First request - create new record
            await ctx.db.insert("rateLimits", {
                key,
                count: 1,
                windowStart: now,
            })
            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetAt: now + config.windowMs,
            }
        }

        // Check if window has expired
        if (existing.windowStart < windowStart) {
            // Window expired - reset counter
            await ctx.db.patch(existing._id, {
                count: 1,
                windowStart: now,
            })
            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetAt: now + config.windowMs,
            }
        }

        // Within current window - check limit
        if (existing.count >= config.maxRequests) {
            // Rate limit exceeded
            const resetAt = existing.windowStart + config.windowMs
            return {
                allowed: false,
                remaining: 0,
                resetAt,
            }
        }

        // Increment counter
        const newCount = existing.count + 1
        await ctx.db.patch(existing._id, {
            count: newCount,
        })

        return {
            allowed: true,
            remaining: config.maxRequests - newCount,
            resetAt: existing.windowStart + config.windowMs,
        }
    },
})

/**
 * Get current rate limit status without consuming a request.
 * Useful for client-side display of remaining requests.
 */
export const getRateLimitStatus = query({
    args: {
        userId: v.string(),
        endpoint: v.union(v.literal("enhance-prompt"), v.literal("suggestions")),
    },
    returns: v.object({
        remaining: v.number(),
        resetAt: v.number(),
    }),
    handler: async (ctx, args) => {
        const { userId, endpoint } = args
        const config = RATE_LIMIT_CONFIG[endpoint]
        const key = `${endpoint}:${userId}`
        const now = Date.now()
        const windowStart = now - config.windowMs

        const existing = await ctx.db
            .query("rateLimits")
            .withIndex("by_key", (q) => q.eq("key", key))
            .unique()

        if (!existing || existing.windowStart < windowStart) {
            // No record or expired window - full quota available
            return {
                remaining: config.maxRequests,
                resetAt: now + config.windowMs,
            }
        }

        const remaining = Math.max(0, config.maxRequests - existing.count)
        return {
            remaining,
            resetAt: existing.windowStart + config.windowMs,
        }
    },
})

/**
 * Clean up expired rate limit records.
 * Should be called periodically (e.g., via a cron job) to prevent table bloat.
 */
export const cleanupExpiredLimits = mutation({
    args: {},
    returns: v.object({
        deleted: v.number(),
    }),
    handler: async (ctx) => {
        // Use the longest window from our config
        const maxWindowMs = Math.max(
            ...Object.values(RATE_LIMIT_CONFIG).map((c) => c.windowMs)
        )
        const cutoff = Date.now() - maxWindowMs * 2 // Keep some buffer

        // Query all records and filter/delete expired ones
        const allRecords = await ctx.db.query("rateLimits").collect()
        let deleted = 0

        for (const record of allRecords) {
            if (record.windowStart < cutoff) {
                await ctx.db.delete(record._id)
                deleted++
            }
        }

        return { deleted }
    },
})
