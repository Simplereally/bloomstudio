/**
 * @vitest-environment jsdom
 * 
 * Tests for favorites hooks
 */
import { renderHook } from "@testing-library/react"
import { usePaginatedQuery, useQuery } from "convex/react"
import { describe, expect, it, vi } from "vitest"
import { useBatchIsFavorited, useFavorites, useIsFavorited } from "./use-favorites"

vi.mock("convex/react", () => ({
    usePaginatedQuery: vi.fn(),
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn()),
}))

describe("favorites hooks", () => {
    it("useFavorites calls favorites.list with pagination", () => {
        const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() }
        vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as any)

        const { result } = renderHook(() => useFavorites())

        expect(usePaginatedQuery).toHaveBeenCalledWith(
            expect.anything(), // api.favorites.list
            {},
            { initialNumItems: 20 }
        )
        expect(result.current).toBe(mockResult)
    })

    it("useIsFavorited calls favorites.isFavorited with imageId", () => {
        vi.mocked(useQuery).mockReturnValue(true)

        const mockImageId = "test-image-id" as any
        const { result } = renderHook(() => useIsFavorited(mockImageId))

        expect(useQuery).toHaveBeenCalledWith(
            expect.anything(), // api.favorites.isFavorited
            { imageId: mockImageId }
        )
        expect(result.current).toBe(true)
    })

    it("useBatchIsFavorited calls favorites.batchIsFavorited with imageIds", () => {
        const mockResult = { "id1": true, "id2": false }
        vi.mocked(useQuery).mockReturnValue(mockResult)

        const mockImageIds = ["id1", "id2"] as any[]
        const { result } = renderHook(() => useBatchIsFavorited(mockImageIds))

        expect(useQuery).toHaveBeenCalledWith(
            expect.anything(), // api.favorites.batchIsFavorited
            { imageIds: mockImageIds }
        )
        expect(result.current).toBe(mockResult)
    })

    it("useBatchIsFavorited skips query when imageIds is empty", () => {
        vi.mocked(useQuery).mockReturnValue(undefined)

        renderHook(() => useBatchIsFavorited([]))

        expect(useQuery).toHaveBeenCalledWith(
            expect.anything(),
            "skip"
        )
    })
})
