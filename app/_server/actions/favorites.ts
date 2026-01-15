"use server"

import { requireUserId } from "../convex/client"
import { getFavoritesPageCached } from "../cache/favorites"

/**
 * Load user's favorites page.
 */
export async function loadFavoritesPage(input: {
    cursor: string | null
    numItems?: number
}) {
    const userId = await requireUserId()
    return getFavoritesPageCached(userId, input.cursor, input.numItems)
}
