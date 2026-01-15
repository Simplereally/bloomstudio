/**
 * @vitest-environment jsdom
 * 
 * Tests for image history hooks
 */
import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useImageHistory, usePublicFeed } from "./use-image-history"
import { usePaginatedQuery, useQuery } from "convex/react"

vi.mock(import("convex/react"), () => ({
    usePaginatedQuery: vi.fn(),
    useQuery: vi.fn(),
}))

describe("image history hooks", () => {
    it("useImageHistory calls getMyImages", () => {
        const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() };
        (usePaginatedQuery as any).mockReturnValue(mockResult)

        const { result } = renderHook(() => useImageHistory())

        expect(usePaginatedQuery).toHaveBeenCalledWith(
            expect.anything(), // api.generatedImages.getMyImages
            {},
            { initialNumItems: 20 }
        )
        expect(result.current).toBe(mockResult)
    })

    it("usePublicFeed calls getPublicFeed", () => {
        const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() };
        (usePaginatedQuery as any).mockReturnValue(mockResult)

        const { result } = renderHook(() => usePublicFeed())

        expect(usePaginatedQuery).toHaveBeenCalledWith(
            expect.anything(), // api.generatedImages.getPublicFeed
            { filterPreference: undefined },
            { initialNumItems: 20 }
        )
        expect(result.current).toBe(mockResult)
    })
})
