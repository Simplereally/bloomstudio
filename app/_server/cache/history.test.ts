/**
 * @vitest-environment node
 *
 * Tests for history cache functions
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock server-only
vi.mock("server-only", () => ({}))

const callOrder: string[] = []

const mockGetConvexClerkToken = vi.fn().mockImplementation(async () => {
    callOrder.push("getConvexClerkToken")
    return "mock-token"
})

vi.mock("../convex/client", () => ({
    getConvexClerkToken: () => mockGetConvexClerkToken(),
}))

const mockFetchQuery = vi.fn().mockResolvedValue({
    page: [],
    continueCursor: null,
    isDone: true,
})

vi.mock("convex/nextjs", () => ({
    fetchQuery: (...args: unknown[]) => mockFetchQuery(...args),
}))

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

vi.mock("@/convex/_generated/api", () => ({
    api: {
        generatedImages: {
            getMyImages: "generatedImages:getMyImages",
            getMyImagesWithDisplayData: "generatedImages:getMyImagesWithDisplayData",
        },
    },
}))

vi.mock("./config", () => ({
    CACHE_TTL: {
        HISTORY_FIRST_PAGE: 30,
        HISTORY_LATER_PAGES: 300,
    },
    CACHE_TAGS: {
        HISTORY_USER: (userId: string) => `history:user:${userId}`,
    },
    PAGE_SIZES: {
        STUDIO_GALLERY: 10,
        HISTORY: 10,
    },
}))

import { getMyImagesPageCached, getMyImagesWithDisplayDataCached } from "./history"

describe("history cache", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        callOrder.length = 0
    })

    describe("getMyImagesPageCached", () => {
        it("calls getConvexClerkToken BEFORE unstable_cache callback", async () => {
            await getMyImagesPageCached("user_123", null, 10)

            const tokenCallIndex = callOrder.indexOf("getConvexClerkToken")
            const cacheCallbackIndex = callOrder.indexOf("unstable_cache_callback_start")

            expect(tokenCallIndex).toBeGreaterThan(-1)
            expect(cacheCallbackIndex).toBeGreaterThan(-1)
            expect(tokenCallIndex).toBeLessThan(cacheCallbackIndex)
        })

        it("passes filters correctly", async () => {
            const filters = { visibility: "public" as const, models: ["flux", "sdxl"] }
            await getMyImagesPageCached("user_123", null, 10, filters)

            expect(mockFetchQuery).toHaveBeenCalledWith(
                "generatedImages:getMyImages",
                {
                    paginationOpts: { numItems: 10, cursor: null },
                    visibility: "public",
                    models: ["flux", "sdxl"],
                },
                { token: "mock-token" }
            )
        })

        it("handles missing filters", async () => {
            await getMyImagesPageCached("user_123", null, 10)

            expect(mockFetchQuery).toHaveBeenCalledWith(
                "generatedImages:getMyImages",
                {
                    paginationOpts: { numItems: 10, cursor: null },
                    visibility: undefined,
                    models: undefined,
                },
                { token: "mock-token" }
            )
        })
    })

    describe("getMyImagesWithDisplayDataCached", () => {
        it("calls getConvexClerkToken BEFORE unstable_cache callback", async () => {
            await getMyImagesWithDisplayDataCached("user_123", null, 10)

            const tokenCallIndex = callOrder.indexOf("getConvexClerkToken")
            const cacheCallbackIndex = callOrder.indexOf("unstable_cache_callback_start")

            expect(tokenCallIndex).toBeGreaterThan(-1)
            expect(cacheCallbackIndex).toBeGreaterThan(-1)
            expect(tokenCallIndex).toBeLessThan(cacheCallbackIndex)
        })

        it("passes filters correctly", async () => {
            const filters = { visibility: "unlisted" as const, models: ["mj"] }
            await getMyImagesWithDisplayDataCached("user_123", "cursor_xyz", 10, filters)

            expect(mockFetchQuery).toHaveBeenCalledWith(
                "generatedImages:getMyImagesWithDisplayData",
                {
                    paginationOpts: { numItems: 10, cursor: "cursor_xyz" },
                    visibility: "unlisted",
                    models: ["mj"],
                },
                { token: "mock-token" }
            )
        })
    })
})
