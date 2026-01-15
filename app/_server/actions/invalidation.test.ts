/**
 * @vitest-environment node
 *
 * Tests for cache invalidation server actions
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock next/cache
const mockRevalidateTag = vi.fn()
vi.mock("next/cache", () => ({
    revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}))

// Mock the auth helper
const mockRequireUserId = vi.fn()

vi.mock("../convex/client", () => ({
    requireUserId: () => mockRequireUserId(),
}))

// Mock cache config
vi.mock("../cache/config", () => ({
    CACHE_TAGS: {
        FEED_PUBLIC: "feed:public",
        HISTORY_USER: (userId: string) => `history:user:${userId}`,
        FAVORITES_USER: (userId: string) => `favorites:user:${userId}`,
        FEED_FOLLOWING_USER: (userId: string) => `feed:following:${userId}`,
    },
}))

// Import after mocks
import {
    invalidateUserHistoryCache,
    invalidateUserFavoritesCache,
    invalidatePublicFeedCache,
    invalidateUserFollowingFeedCache,
    invalidateVisibilityChange,
    invalidateImageDeletion,
    invalidateFollowChange,
} from "./invalidation"

describe("cache invalidation server actions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockRequireUserId.mockResolvedValue("user_123")
    })

    describe("invalidateUserHistoryCache", () => {
        it("revalidates user-specific history tag", async () => {
            await invalidateUserHistoryCache()

            expect(mockRequireUserId).toHaveBeenCalled()
            expect(mockRevalidateTag).toHaveBeenCalledWith("history:user:user_123", "max")
        })

        it("throws when not authenticated", async () => {
            mockRequireUserId.mockRejectedValue(new Error("Authentication required"))

            await expect(invalidateUserHistoryCache()).rejects.toThrow("Authentication required")
        })
    })

    describe("invalidateUserFavoritesCache", () => {
        it("revalidates user-specific favorites tag", async () => {
            await invalidateUserFavoritesCache()

            expect(mockRequireUserId).toHaveBeenCalled()
            expect(mockRevalidateTag).toHaveBeenCalledWith("favorites:user:user_123", "max")
        })
    })

    describe("invalidatePublicFeedCache", () => {
        it("revalidates public feed tag (no auth required)", async () => {
            await invalidatePublicFeedCache()

            expect(mockRequireUserId).not.toHaveBeenCalled()
            expect(mockRevalidateTag).toHaveBeenCalledWith("feed:public", "max")
        })
    })

    describe("invalidateUserFollowingFeedCache", () => {
        it("revalidates user-specific following feed tag", async () => {
            await invalidateUserFollowingFeedCache()

            expect(mockRequireUserId).toHaveBeenCalled()
            expect(mockRevalidateTag).toHaveBeenCalledWith("feed:following:user_123", "max")
        })
    })

    describe("invalidateVisibilityChange", () => {
        it("invalidates both history and public feed caches", async () => {
            await invalidateVisibilityChange()

            expect(mockRevalidateTag).toHaveBeenCalledWith("history:user:user_123", "max")
            expect(mockRevalidateTag).toHaveBeenCalledWith("feed:public", "max")
            expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
        })
    })

    describe("invalidateImageDeletion", () => {
        it("invalidates both history and public feed caches", async () => {
            await invalidateImageDeletion()

            expect(mockRevalidateTag).toHaveBeenCalledWith("history:user:user_123", "max")
            expect(mockRevalidateTag).toHaveBeenCalledWith("feed:public", "max")
            expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
        })
    })

    describe("invalidateFollowChange", () => {
        it("invalidates following feed cache", async () => {
            await invalidateFollowChange()

            expect(mockRevalidateTag).toHaveBeenCalledWith("feed:following:user_123", "max")
            expect(mockRevalidateTag).toHaveBeenCalledTimes(1)
        })
    })
})
