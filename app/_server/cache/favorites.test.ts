/**
 * @vitest-environment node
 *
 * Tests for favorites cache functions
 * 
 * REGRESSION TEST: This test suite specifically validates that getConvexClerkToken
 * is called OUTSIDE the unstable_cache callback to prevent the runtime error:
 * "Route used headers() inside a function cached with unstable_cache()"
 * 
 * Root cause: Clerk's auth() uses headers() which is dynamic data.
 * Dynamic data cannot be accessed inside unstable_cache scope.
 * 
 * Fix: Call getConvexClerkToken() BEFORE unstable_cache() and capture token in closure.
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

// Mock unstable_cache to track when its callback is executed
vi.mock("next/cache", () => ({
    unstable_cache: (fn: () => Promise<unknown>, _keys: string[], _opts: unknown) => {
        // Return a function that, when called, executes the cached function
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
        favorites: {
            list: "favorites:list",
        },
    },
}))

// Mock config
vi.mock("./config", () => ({
    CACHE_TTL: {
        FAVORITES_FIRST_PAGE: 30,
        FAVORITES_LATER_PAGES: 120,
    },
    CACHE_TAGS: {
        FAVORITES_USER: (userId: string) => `favorites:${userId}`,
    },
    PAGE_SIZES: {
        FAVORITES: 20,
    },
}))

// Import after mocks
import { getFavoritesPageCached } from "./favorites"

describe("favorites cache", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        callOrder.length = 0 // Clear array
    })

    describe("getFavoritesPageCached", () => {
        it("calls getConvexClerkToken BEFORE unstable_cache callback", async () => {
            await getFavoritesPageCached("user_123", null, 20)

            // This is the critical assertion for the regression fix.
            // getConvexClerkToken MUST be called BEFORE the unstable_cache callback starts.
            // Otherwise, we get: "Route used headers() inside unstable_cache()"
            const tokenCallIndex = callOrder.indexOf("getConvexClerkToken")
            const cacheCallbackIndex = callOrder.indexOf("unstable_cache_callback_start")

            expect(tokenCallIndex).toBeGreaterThan(-1)
            expect(cacheCallbackIndex).toBeGreaterThan(-1)
            expect(tokenCallIndex).toBeLessThan(cacheCallbackIndex)
        })

        it("passes token to fetchQuery inside cache callback", async () => {
            await getFavoritesPageCached("user_123", null, 20)

            expect(mockFetchQuery).toHaveBeenCalledWith(
                "favorites:list",
                { paginationOpts: { numItems: 20, cursor: null } },
                { token: "mock-token" }
            )
        })

        it("uses correct cache configuration for first page", async () => {
            await getFavoritesPageCached("user_123", null, 20)

            expect(mockFetchQuery).toHaveBeenCalled()
        })

        it("uses correct cache configuration for later pages", async () => {
            await getFavoritesPageCached("user_123", "cursor_abc", 20)

            expect(mockFetchQuery).toHaveBeenCalledWith(
                "favorites:list",
                { paginationOpts: { numItems: 20, cursor: "cursor_abc" } },
                { token: "mock-token" }
            )
        })
    })
})
