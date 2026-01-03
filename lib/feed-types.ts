/**
 * Feed Type Definitions
 * 
 * Type-safe definitions for feed routing.
 */

export type FeedType = "public" | "following"

export const FEED_TYPES: readonly FeedType[] = ["public", "following"] as const

/**
 * Type guard to check if a string is a valid FeedType
 */
export function isValidFeedType(value: unknown): value is FeedType {
    return typeof value === "string" && FEED_TYPES.includes(value as FeedType)
}

/**
 * Feed type display names for UI
 */
export const FEED_TYPE_LABELS: Record<FeedType, string> = {
    public: "Public",
    following: "Following",
} as const
