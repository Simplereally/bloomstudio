/**
 * @vitest-environment node
 *
 * Tests for favorites server actions
 * 
 * Regression test: Ensures getConvexClerkToken is called OUTSIDE unstable_cache
 * to avoid "headers() inside cache scope" runtime error.
 * See: https://nextjs.org/docs/app/api-reference/functions/unstable_cache
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the cache function
const mockGetFavoritesPageCached = vi.fn()

vi.mock("@/app/_server/cache/favorites", () => ({
    getFavoritesPageCached: (...args: unknown[]) => mockGetFavoritesPageCached(...args),
}))

// Mock the auth helper
const mockRequireUserId = vi.fn()

vi.mock("../convex/client", () => ({
    requireUserId: () => mockRequireUserId(),
}))

// Import after mocks
import { loadFavoritesPage } from "./favorites"

describe("favorites server actions", () => {
    const mockPaginatedResult = {
        page: [
            { _id: "img1", url: "https://example.com/1.jpg" },
            { _id: "img2", url: "https://example.com/2.jpg" },
        ],
        continueCursor: "cursor123",
        isDone: false,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockRequireUserId.mockResolvedValue("user_123")
        mockGetFavoritesPageCached.mockResolvedValue(mockPaginatedResult)
    })

    describe("loadFavoritesPage", () => {
        it("calls getFavoritesPageCached with userId and cursor", async () => {
            const result = await loadFavoritesPage({ cursor: "abc123" })

            expect(mockRequireUserId).toHaveBeenCalled()
            expect(mockGetFavoritesPageCached).toHaveBeenCalledWith("user_123", "abc123", undefined)
            expect(result).toEqual(mockPaginatedResult)
        })

        it("calls getFavoritesPageCached with null cursor for first page", async () => {
            await loadFavoritesPage({ cursor: null })

            expect(mockGetFavoritesPageCached).toHaveBeenCalledWith("user_123", null, undefined)
        })

        it("passes numItems when provided", async () => {
            await loadFavoritesPage({ cursor: null, numItems: 50 })

            expect(mockGetFavoritesPageCached).toHaveBeenCalledWith("user_123", null, 50)
        })

        it("throws error when user is not authenticated", async () => {
            mockRequireUserId.mockRejectedValue(new Error("Authentication required"))

            await expect(loadFavoritesPage({ cursor: null })).rejects.toThrow("Authentication required")
            expect(mockGetFavoritesPageCached).not.toHaveBeenCalled()
        })
    })
})
