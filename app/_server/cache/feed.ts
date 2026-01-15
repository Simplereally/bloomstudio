import "server-only"
import { unstable_cache } from "next/cache"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { CACHE_TTL, CACHE_TAGS, PAGE_SIZES } from "./config"
import { getConvexClerkToken } from "../convex/client"

type Cursor = string | null

/**
 * Cached public feed page query.
 * This is a SHARED cache - the same cached data is used for all users.
 * 
 * Two-tier TTL strategy:
 * - First page (cursor = null): Short TTL for freshness
 * - Later pages: Long TTL since older content rarely changes
 */
export function getPublicFeedPageCached(cursor: Cursor, numItems: number = PAGE_SIZES.FEED) {
    const isFirstPage = cursor === null

    return unstable_cache(
        async () => {
            // Note: filterPreference is omitted for caching simplicity
            // If you need user-specific filtering, this becomes per-user
            return fetchQuery(api.generatedImages.getPublicFeed, {
                paginationOpts: { numItems, cursor },
                filterPreference: undefined, // Use default (no filter for cached)
            })
        },
        // Cache key parts: distinguish first page from later pages
        ["feed:public", isFirstPage ? "first" : "later", String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.FEED_PUBLIC_FIRST_PAGE : CACHE_TTL.FEED_PUBLIC_LATER_PAGES,
            tags: [CACHE_TAGS.FEED_PUBLIC],
        }
    )()
}

/**
 * Cached following feed page query.
 * Cache is per-user, keyed by userId - each user sees images from people they follow.
 * 
 * Two-tier TTL strategy:
 * - First page (cursor = null): Short TTL for fresh content from followed creators
 * - Later pages: Longer TTL since older content is stable
 * 
 * Note: Token is captured in closure but NOT part of cache key.
 * userId provides stable cache key isolation.
 */
export async function getFollowingFeedPageCached(
    userId: string,
    cursor: Cursor,
    numItems: number = PAGE_SIZES.FEED
) {
    const token = await getConvexClerkToken()
    const isFirstPage = cursor === null

    return unstable_cache(
        async () => {
            return fetchQuery(
                api.generatedImages.getFollowingFeed,
                { paginationOpts: { numItems, cursor } },
                { token }
            )
        },
        // Cache key parts: per-user, distinguish first page from later pages
        ["feed:following", userId, isFirstPage ? "first" : "later", String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.FEED_FOLLOWING_FIRST_PAGE : CACHE_TTL.FEED_FOLLOWING_LATER_PAGES,
            tags: [CACHE_TAGS.FEED_FOLLOWING_USER(userId)],
        }
    )()
}
