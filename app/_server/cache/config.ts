import "server-only"

/**
 * Cache TTL configuration for different data types.
 * 
 * Strategy:
 * - First page (cursor = null): Short TTL for fresh content at the top
 * - Subsequent pages: Long TTL since older content rarely changes
 * - Public data: Shared cache across users
 * - Private data: Per-user cache keyed by userId
 */
export const CACHE_TTL = {
    // Public feed - shared across all users
    FEED_PUBLIC_FIRST_PAGE: 60,           // 1 minute - fresh content matters
    FEED_PUBLIC_LATER_PAGES: 60 * 60 * 6, // 6 hours - older content is stable

    // User history - per-user cache
    HISTORY_FIRST_PAGE: 30,               // 30 seconds - new generations show up fast
    HISTORY_LATER_PAGES: 60 * 60 * 12,    // 12 hours - historical data is stable

    // User favorites - per-user cache  
    FAVORITES_FIRST_PAGE: 60,             // 1 minute
    FAVORITES_LATER_PAGES: 60 * 60 * 6,   // 6 hours

    // Following feed - per-user cache
    FEED_FOLLOWING_FIRST_PAGE: 60,        // 1 minute
    FEED_FOLLOWING_LATER_PAGES: 60 * 60,  // 1 hour
} as const

/**
 * Cache tag prefixes for invalidation.
 * Format: `{prefix}:{identifier}`
 */
export const CACHE_TAGS = {
    // Shared caches
    FEED_PUBLIC: "feed:public",

    // Per-user caches (append userId)
    HISTORY_USER: (userId: string) => `history:user:${userId}`,
    FAVORITES_USER: (userId: string) => `favorites:user:${userId}`,
    FEED_FOLLOWING_USER: (userId: string) => `feed:following:${userId}`,
} as const

/**
 * Default page sizes for cached queries.
 * Keep consistent with client-side hooks for cache key stability.
 */
export const PAGE_SIZES = {
    DEFAULT: 20,
    STUDIO_GALLERY: 20,
    HISTORY: 20,
    FAVORITES: 20,
    FEED: 20,
} as const
