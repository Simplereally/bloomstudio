/**
 * @vitest-environment jsdom
 * 
 * Tests for image history hooks
 */
import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useImageHistory, usePublicFeed } from "./use-image-history"
import { usePaginatedQuery } from "convex/react"

vi.mock("convex/react", () => ({
    usePaginatedQuery: vi.fn(),
}))

describe("image history hooks", () => {
    it("useImageHistory calls getMyImages", () => {
        const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() }
        vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as unknown as ReturnType<typeof usePaginatedQuery>)

        const { result } = renderHook(() => useImageHistory())

        expect(usePaginatedQuery).toHaveBeenCalledWith(
            expect.anything(), // api.generatedImages.getMyImages
            {},
            { initialNumItems: 20 }
        )
        expect(result.current).toBe(mockResult)
    })

    it("usePublicFeed calls getPublicFeed", () => {
        const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() }
        vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as unknown as ReturnType<typeof usePaginatedQuery>)

        const { result } = renderHook(() => usePublicFeed())

        expect(usePaginatedQuery).toHaveBeenCalledWith(
            expect.anything(), // api.generatedImages.getPublicFeed
            {},
            { initialNumItems: 20 }
        )
        expect(result.current).toBe(mockResult)
    })
})
