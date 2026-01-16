"use server"

import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "../cache/config"
import { requireUserId } from "../convex/client"

/**
 * Invalidate the current user's history cache.
 * Call after image creation, deletion, or visibility changes.
 * 
 * Uses "max" profile for stale-while-revalidate behavior:
 * serves cached content immediately while fetching fresh data in background.
 */
export async function invalidateUserHistoryCache() {
    const userId = await requireUserId()
    revalidateTag(CACHE_TAGS.HISTORY_USER(userId), "max")
}

/**
 * Invalidate the current user's favorites cache.
 * Call after toggling favorites.
 * 
 * Uses "max" profile for stale-while-revalidate behavior.
 */
export async function invalidateUserFavoritesCache() {
    const userId = await requireUserId()
    revalidateTag(CACHE_TAGS.FAVORITES_USER(userId), "max")
}

/**
 * Invalidate the public feed cache.
 * Call after an image becomes public or is removed from public.
 * 
 * Uses "max" profile for stale-while-revalidate behavior.
 */
export async function invalidatePublicFeedCache() {
    revalidateTag(CACHE_TAGS.FEED_PUBLIC, "max")
}

/**
 * Invalidate the current user's following feed cache.
 * Call when followed users' content changes or when follow relationships change.
 * 
 * Uses "max" profile for stale-while-revalidate behavior.
 */
export async function invalidateUserFollowingFeedCache() {
    const userId = await requireUserId()
    revalidateTag(CACHE_TAGS.FEED_FOLLOWING_USER(userId), "max")
}

/**
 * Invalidate all caches affected by visibility change.
 */
export async function invalidateVisibilityChange() {
    await invalidateUserHistoryCache()
    await invalidatePublicFeedCache()
    // Note: Following feed is also affected when images become public/unlisted
    // but we don't invalidate it here since it's per-follower and would be expensive
}

/**
 * Invalidate all caches affected by image deletion.
 */
export async function invalidateImageDeletion() {
    await invalidateUserHistoryCache()
    await invalidatePublicFeedCache()
}

/**
 * Invalidate all caches affected by follow/unfollow action.
 * Call when the current user follows or unfollows someone.
 */
export async function invalidateFollowChange() {
    await invalidateUserFollowingFeedCache()
}
