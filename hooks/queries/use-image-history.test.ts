/**
 * @vitest-environment jsdom
 * 
 * Tests for image history hooks
 */
import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useImageHistory, usePublicFeed, useProfileImages } from "./use-image-history"
import { usePaginatedQuery, useQuery } from "convex/react"

vi.mock("convex/react", () => ({
    usePaginatedQuery: vi.fn(),
    useQuery: vi.fn(),
}))

describe("image history hooks", () => {
    it("useImageHistory calls getMyImages", () => {
        const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() }
        vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as never)

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
        vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as never)

        const { result } = renderHook(() => usePublicFeed())

        expect(usePaginatedQuery).toHaveBeenCalledWith(
            expect.anything(), // api.generatedImages.getPublicFeed
            { filterPreference: undefined },
            { initialNumItems: 20 }
        )
        expect(result.current).toBe(mockResult)
    })

    describe("useProfileImages", () => {
        it("calls getImagesByUsername with username and filterPreference", () => {
            const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() }
            vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as never)
            vi.mocked(useQuery).mockReturnValue("blur" as never)

            const { result } = renderHook(() => useProfileImages("testuser"))

            expect(usePaginatedQuery).toHaveBeenCalledWith(
                expect.anything(), // api.generatedImages.getImagesByUsername
                { username: "testuser", filterPreference: "blur" },
                { initialNumItems: 20 }
            )
            expect(result.current).toBe(mockResult)
        })

        it("passes allow preference when user has allow setting", () => {
            const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() }
            vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as never)
            vi.mocked(useQuery).mockReturnValue("allow" as never)

            renderHook(() => useProfileImages("testuser"))

            expect(usePaginatedQuery).toHaveBeenCalledWith(
                expect.anything(),
                { username: "testuser", filterPreference: "allow" },
                { initialNumItems: 20 }
            )
        })

        it("passes block preference when user has block setting", () => {
            const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() }
            vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as never)
            vi.mocked(useQuery).mockReturnValue("block" as never)

            renderHook(() => useProfileImages("testuser"))

            expect(usePaginatedQuery).toHaveBeenCalledWith(
                expect.anything(),
                { username: "testuser", filterPreference: "block" },
                { initialNumItems: 20 }
            )
        })

        it("passes undefined preference for unauthenticated users", () => {
            const mockResult = { results: [], status: "LoadingFirstPage", loadMore: vi.fn() }
            vi.mocked(usePaginatedQuery).mockReturnValue(mockResult as never)
            vi.mocked(useQuery).mockReturnValue(undefined as never)

            renderHook(() => useProfileImages("testuser"))

            expect(usePaginatedQuery).toHaveBeenCalledWith(
                expect.anything(),
                { username: "testuser", filterPreference: undefined },
                { initialNumItems: 20 }
            )
        })
    })
})
