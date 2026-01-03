/**
 * @vitest-environment jsdom
 * 
 * Tests for useReferenceImages Hook
 */
import { renderHook } from "@testing-library/react"
import { useQuery } from "convex/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useReferenceImages } from "./use-reference-images"

// Mock Convex
vi.mock("convex/react", () => ({
    useQuery: vi.fn(),
}))

// Mock Convex API
vi.mock("@/convex/_generated/api", () => ({
    api: {
        referenceImages: {
            getRecent: "referenceImages.getRecent",
        },
    },
}))

describe("useReferenceImages", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns data from Convex query", () => {
        const mockData = [
            { _id: "1", url: "https://example.com/1.jpg" },
            { _id: "2", url: "https://example.com/2.jpg" },
        ]
        vi.mocked(useQuery).mockReturnValue(mockData)

        const { result } = renderHook(() => useReferenceImages())

        expect(useQuery).toHaveBeenCalledWith("referenceImages.getRecent")
        expect(result.current).toEqual(mockData)
    })

    it("returns undefined while loading", () => {
        vi.mocked(useQuery).mockReturnValue(undefined)

        const { result } = renderHook(() => useReferenceImages())

        expect(result.current).toBeUndefined()
    })
})
