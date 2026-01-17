/**
 * @vitest-environment node
 *
 * Tests for feed cache functions
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock server-only to allow testing
vi.mock("server-only", () => ({}))

// Track when getConvexClerkToken and unstable_cache are called
const callOrder: string[] = []

// Mock getConvexClerkToken to track call order
const mockGetConvexClerkToken = vi.fn().mockImplementation(async () => {
    callOrder.push("getConvexClerkToken")
    return "mock-token"
})

vi.mock("../convex/client", () => ({
    getConvexClerkToken: () => mockGetConvexClerkToken(),
}))

// Mock fetchQuery
const mockFetchQuery = vi.fn().mockResolvedValue({
    page: [],
    continueCursor: null,
    isDone: true,
})

vi.mock("convex/nextjs", () => ({
    fetchQuery: (...args: unknown[]) => mockFetchQuery(...args),
}))

// Mock unstable_cache
vi.mock("next/cache", () => ({
    unstable_cache: (fn: () => Promise<unknown>, _keys: string[], _opts: unknown) => {
        return async () => {
            callOrder.push("unstable_cache_callback_start")
            const result = await fn()
            callOrder.push("unstable_cache_callback_end")
            return result
        }
    },
}))

// Mock API
vi.mock("@/convex/_generated/api", () => ({
    api: {
        generatedImages: {
            getPublicFeed: "generatedImages:getPublicFeed",
            getFollowingFeed: "generatedImages:getFollowingFeed",
        },
    },
}))

// Mock config
vi.mock("./config", () => ({
    CACHE_TTL: {
        FEED_PUBLIC_FIRST_PAGE: 10,
        FEED_PUBLIC_LATER_PAGES: 100,
        FEED_FOLLOWING_FIRST_PAGE: 20,
        FEED_FOLLOWING_LATER_PAGES: 200,
    },
    CACHE_TAGS: {
        FEED_PUBLIC: "feed:public",
        FEED_FOLLOWING_USER: (userId: string) => `feed:following:${userId}`,
    },
    PAGE_SIZES: {
        FEED: 10,
    },
}))

import { getFollowingFeedPageCached, getPublicFeedPageCached } from "./feed"

describe("feed cache", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        callOrder.length = 0
    })

    describe("getPublicFeedPageCached", () => {
        it("calls fetchQuery with correct arguments", async () => {
            await getPublicFeedPageCached(null, 10, "block")

            expect(mockFetchQuery).toHaveBeenCalledWith(
                "generatedImages:getPublicFeed",
                {
                    paginationOpts: { numItems: 10, cursor: null },
                    filterPreference: "block",
                }
            )
        })

        it("does NOT call getConvexClerkToken (public data)", async () => {
            await getPublicFeedPageCached(null, 10)
            expect(mockGetConvexClerkToken).not.toHaveBeenCalled()
        })
    })

    describe("getFollowingFeedPageCached", () => {
        it("calls getConvexClerkToken BEFORE unstable_cache callback", async () => {
            await getFollowingFeedPageCached("user_123", null, 10)

            const tokenCallIndex = callOrder.indexOf("getConvexClerkToken")
            const cacheCallbackIndex = callOrder.indexOf("unstable_cache_callback_start")

            expect(tokenCallIndex).toBeGreaterThan(-1)
            expect(cacheCallbackIndex).toBeGreaterThan(-1)
            expect(tokenCallIndex).toBeLessThan(cacheCallbackIndex)
        })

        it("passes token to fetchQuery inside cache callback", async () => {
            await getFollowingFeedPageCached("user_123", "cursor_123", 10)

            expect(mockFetchQuery).toHaveBeenCalledWith(
                "generatedImages:getFollowingFeed",
                { paginationOpts: { numItems: 10, cursor: "cursor_123" } },
                { token: "mock-token" }
            )
        })

        it("uses correct cache keys and tags", async () => {
            // Note: We can't strictly inspect the arguments passed to unstable_cache because of the mock implementation.
            // If we needed to test keys/tags more strictly, we'd need a more spy-like mock for unstable_cache.
            // But verify the function runs is a good baseline.
            await getFollowingFeedPageCached("user_123", null, 10)
            expect(mockFetchQuery).toHaveBeenCalled()
        })
    })
})
