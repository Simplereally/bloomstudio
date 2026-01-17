/**
 * @vitest-environment node
 *
 * Tests for feed server actions
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the cache functions
const mockGetPublicFeedPageCached = vi.fn()
const mockGetFollowingFeedPageCached = vi.fn()

vi.mock("@/app/_server/cache/feed", () => ({
    getPublicFeedPageCached: (...args: unknown[]) => mockGetPublicFeedPageCached(...args),
    getFollowingFeedPageCached: (...args: unknown[]) => mockGetFollowingFeedPageCached(...args),
}))

// Mock the auth helper
const mockGetCurrentUserId = vi.fn()

vi.mock("../convex/client", () => ({
    getCurrentUserId: () => mockGetCurrentUserId(),
}))

// Import after mocks
import { loadPublicFeedPage, loadFollowingFeedPage } from "./feed"

describe("feed server actions", () => {
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
        mockGetPublicFeedPageCached.mockResolvedValue(mockPaginatedResult)
        mockGetFollowingFeedPageCached.mockResolvedValue(mockPaginatedResult)
    })

    describe("loadPublicFeedPage", () => {
        it("calls getPublicFeedPageCached with cursor", async () => {
            const result = await loadPublicFeedPage({ cursor: "abc123" })

            expect(mockGetPublicFeedPageCached).toHaveBeenCalledWith("abc123", undefined, "blur")
            expect(result).toEqual(mockPaginatedResult)
        })

        it("calls getPublicFeedPageCached with null cursor for first page", async () => {
            await loadPublicFeedPage({ cursor: null })

            expect(mockGetPublicFeedPageCached).toHaveBeenCalledWith(null, undefined, "blur")
        })

        it("passes numItems when provided", async () => {
            await loadPublicFeedPage({ cursor: null, numItems: 50 })

            expect(mockGetPublicFeedPageCached).toHaveBeenCalledWith(null, 50, "blur")
        })

        it("passes filterPreference 'block' when provided", async () => {
            await loadPublicFeedPage({ cursor: null, filterPreference: "block" })

            expect(mockGetPublicFeedPageCached).toHaveBeenCalledWith(null, undefined, "block")
        })

        it("passes filterPreference 'allow' when provided", async () => {
            await loadPublicFeedPage({ cursor: null, filterPreference: "allow" })

            expect(mockGetPublicFeedPageCached).toHaveBeenCalledWith(null, undefined, "allow")
        })

        it("passes all parameters together correctly", async () => {
            await loadPublicFeedPage({ cursor: "cursor_xyz", numItems: 25, filterPreference: "block" })

            expect(mockGetPublicFeedPageCached).toHaveBeenCalledWith("cursor_xyz", 25, "block")
        })
    })

    describe("loadFollowingFeedPage", () => {
        it("returns empty result when not authenticated", async () => {
            mockGetCurrentUserId.mockResolvedValue(undefined)

            const result = await loadFollowingFeedPage({ cursor: null })

            expect(result).toEqual({ page: [], isDone: true, continueCursor: "" })
            expect(mockGetFollowingFeedPageCached).not.toHaveBeenCalled()
        })

        it("calls getFollowingFeedPageCached when authenticated", async () => {
            mockGetCurrentUserId.mockResolvedValue("user_123")

            const result = await loadFollowingFeedPage({ cursor: "abc123" })

            expect(mockGetFollowingFeedPageCached).toHaveBeenCalledWith("user_123", "abc123", undefined)
            expect(result).toEqual(mockPaginatedResult)
        })

        it("passes numItems when provided", async () => {
            mockGetCurrentUserId.mockResolvedValue("user_123")

            await loadFollowingFeedPage({ cursor: null, numItems: 30 })

            expect(mockGetFollowingFeedPageCached).toHaveBeenCalledWith("user_123", null, 30)
        })
    })
})
