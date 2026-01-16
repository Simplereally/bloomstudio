import "server-only"
import { unstable_cache } from "next/cache"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { CACHE_TTL, CACHE_TAGS, PAGE_SIZES } from "./config"
import { getConvexClerkToken } from "../convex/client"

type Cursor = string | null

interface HistoryFilters {
    visibility?: "public" | "unlisted"
    models?: string[]
}

/**
 * Cached user history page query (lightweight - for studio gallery).
 * Cache is per-user, keyed by userId.
 * 
 * Note: Token is captured in closure but NOT part of cache key.
 * userId provides stable cache key isolation.
 */
export async function getMyImagesPageCached(
    userId: string,
    cursor: Cursor,
    numItems: number = PAGE_SIZES.STUDIO_GALLERY,
    filters?: HistoryFilters
) {
    const token = await getConvexClerkToken()
    const isFirstPage = cursor === null

    // Normalize filters for stable cache key (clone before sorting to avoid mutating caller's array)
    const filterKey = filters
        ? JSON.stringify({ v: filters.visibility, m: filters.models ? [...filters.models].sort() : undefined })
        : "none"

    return unstable_cache(
        async () => {
            return fetchQuery(
                api.generatedImages.getMyImages,
                {
                    paginationOpts: { numItems, cursor },
                    visibility: filters?.visibility,
                    models: filters?.models,
                },
                { token }
            )
        },
        ["history:my-images", userId, isFirstPage ? "first" : "later", filterKey, String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.HISTORY_FIRST_PAGE : CACHE_TTL.HISTORY_LATER_PAGES,
            tags: [CACHE_TAGS.HISTORY_USER(userId)],
        }
    )()
}

/**
 * Cached user history with display data (for history page with cards).
 */
export async function getMyImagesWithDisplayDataCached(
    userId: string,
    cursor: Cursor,
    numItems: number = PAGE_SIZES.HISTORY,
    filters?: HistoryFilters
) {
    const token = await getConvexClerkToken()
    const isFirstPage = cursor === null

    // Normalize filters for stable cache key (clone before sorting to avoid mutating caller's array)
    const filterKey = filters
        ? JSON.stringify({ v: filters.visibility, m: filters.models ? [...filters.models].sort() : undefined })
        : "none"

    return unstable_cache(
        async () => {
            return fetchQuery(
                api.generatedImages.getMyImagesWithDisplayData,
                {
                    paginationOpts: { numItems, cursor },
                    visibility: filters?.visibility,
                    models: filters?.models,
                },
                { token }
            )
        },
        ["history:display", userId, isFirstPage ? "first" : "later", filterKey, String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.HISTORY_FIRST_PAGE : CACHE_TTL.HISTORY_LATER_PAGES,
            tags: [CACHE_TAGS.HISTORY_USER(userId)],
        }
    )()
}
