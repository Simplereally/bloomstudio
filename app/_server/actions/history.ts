"use server"

import { requireUserId } from "../convex/client"
import { getMyImagesPageCached, getMyImagesWithDisplayDataCached } from "../cache/history"

interface HistoryFilters {
    visibility?: "public" | "unlisted"
    models?: string[]
}

/**
 * Load user's image history page (lightweight - studio gallery).
 */
export async function loadMyHistoryPage(input: {
    cursor: string | null
    numItems?: number
    filters?: HistoryFilters
}) {
    const userId = await requireUserId()
    return getMyImagesPageCached(userId, input.cursor, input.numItems, input.filters)
}

/**
 * Load user's image history with display data (history page).
 */
export async function loadMyHistoryWithDisplayPage(input: {
    cursor: string | null
    numItems?: number
    filters?: HistoryFilters
}) {
    const userId = await requireUserId()
    return getMyImagesWithDisplayDataCached(userId, input.cursor, input.numItems, input.filters)
}
