import "server-only"
import { unstable_cache } from "next/cache"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { CACHE_TTL, CACHE_TAGS, PAGE_SIZES } from "./config"
import { getConvexClerkToken } from "../convex/client"

type Cursor = string | null

/**
 * Cached user favorites page query.
 * Cache is per-user, keyed by userId.
 */
export async function getFavoritesPageCached(
    userId: string,
    cursor: Cursor,
    numItems: number = PAGE_SIZES.FAVORITES
) {
    const isFirstPage = cursor === null

    return unstable_cache(
        async () => {
            const token = await getConvexClerkToken()
            return fetchQuery(
                api.favorites.list,
                { paginationOpts: { numItems, cursor } },
                { token }
            )
        },
        ["favorites", userId, isFirstPage ? "first" : "later", String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.FAVORITES_FIRST_PAGE : CACHE_TTL.FAVORITES_LATER_PAGES,
            tags: [CACHE_TAGS.FAVORITES_USER(userId)],
        }
    )()
}
