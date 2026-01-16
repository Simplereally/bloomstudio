"use server"

import { getPublicFeedPageCached, getFollowingFeedPageCached } from "@/app/_server/cache/feed"
import { getCurrentUserId } from "../convex/client"

/**
 * Server action to load a page of the public feed.
 * Used by client components for "load more" pagination.
 */
export async function loadPublicFeedPage(input: {
    cursor: string | null
    numItems?: number
    filterPreference?: "block" | "blur" | "allow"
}) {
    return getPublicFeedPageCached(input.cursor, input.numItems, input.filterPreference ?? "blur")
}

/**
 * Server action to load a page of the following feed.
 * Requires authentication - returns empty result if not authenticated.
 * Used by client components for "load more" pagination.
 */
export async function loadFollowingFeedPage(input: {
    cursor: string | null
    numItems?: number
}) {
    const userId = await getCurrentUserId()
    if (!userId) {
        // Return empty result for unauthenticated users
        return { page: [], isDone: true, continueCursor: "" }
    }
    return getFollowingFeedPageCached(userId, input.cursor, input.numItems)
}
