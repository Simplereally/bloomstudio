/**
 * @vitest-environment jsdom
 * 
 * Tests for favorites hooks
 */
import { renderHook } from "@testing-library/react"
import { usePaginatedQuery, useQuery } from "convex/react"
import { describe, expect, it, vi } from "vitest"
import { useBatchIsFavorited, useFavorites, useIsFavorited } from "./use-favorites"
import type { Id } from "@/convex/_generated/dataModel"

// Mock server actions to avoid server-only import error
vi.mock("@/app/_server/actions/invalidation", () => ({
    invalidateUserFavoritesCache: vi.fn(),
    invalidateUserHistoryCache: vi.fn(),
    invalidatePublicFeedCache: vi.fn(),
    invalidateVisibilityChange: vi.fn(),
    invalidateImageDeletion: vi.fn(),
    invalidateFollowChange: vi.fn(),
    invalidateUserFollowingFeedCache: vi.fn(),
}))

vi.mock("convex/react", () => ({
    usePaginatedQuery: vi.fn(),
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn()),
}))

describe("favorites hooks", () => {
    it("useFavorites calls favorites.list with pagination", () => {
        const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() }
        vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as never)

        const { result } = renderHook(() => useFavorites())

        expect(usePaginatedQuery).toHaveBeenCalledWith(
            expect.anything(), // api.favorites.list
            {},
            { initialNumItems: 20 }
        )
        expect(result.current).toBe(mockResult)
    })

    it("useIsFavorited calls favorites.isFavorited with imageId", () => {
        vi.mocked(useQuery).mockReturnValue(true as never)

        const mockImageId = "test-image-id"
        const { result } = renderHook(() => useIsFavorited(mockImageId))

        expect(useQuery).toHaveBeenCalledWith(
            expect.anything(), // api.favorites.isFavorited
            { imageId: mockImageId }
        )
        expect(result.current).toBe(true)
    })

    it("useIsFavorited skips query for invalid/temp imageId", () => {
        vi.mocked(useQuery).mockReturnValue(undefined as never)

        const invalidId = "img_123456"
        renderHook(() => useIsFavorited(invalidId))

        expect(useQuery).toHaveBeenCalledWith(
            expect.anything(),
            "skip"
        )
    })

    it("useBatchIsFavorited calls favorites.batchIsFavorited with imageIds", () => {
        const mockResult = { "id1": true, "id2": false }
        vi.mocked(useQuery).mockReturnValue(mockResult as never)

        const mockImageIds = ["id1", "id2"] as unknown as Id<"generatedImages">[]
        const { result } = renderHook(() => useBatchIsFavorited(mockImageIds))

        expect(useQuery).toHaveBeenCalledWith(
            expect.anything(), // api.favorites.batchIsFavorited
            { imageIds: mockImageIds }
        )
        expect(result.current).toBe(mockResult)
    })

    it("useBatchIsFavorited skips query when imageIds is empty", () => {
        vi.mocked(useQuery).mockReturnValue(undefined as never)

        renderHook(() => useBatchIsFavorited([]))

        expect(useQuery).toHaveBeenCalledWith(
            expect.anything(),
            "skip"
        )
    })
})
