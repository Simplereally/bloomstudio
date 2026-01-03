// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useGenerationSettings } from "./use-generation-settings"

// Mock useRandomSeed
vi.mock("@/hooks/use-random-seed", () => ({
    useRandomSeed: vi.fn(() => ({
        generateSeed: vi.fn(() => 12345),
        isRandomMode: vi.fn((seed: number) => seed === -1),
    })),
}))

describe("useGenerationSettings", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("initializes with default values", () => {
        const { result } = renderHook(() => useGenerationSettings())

        expect(result.current.model).toBe("zimage")
        expect(result.current.aspectRatio).toBe("1:1")
        expect(result.current.width).toBe(2048)
        expect(result.current.height).toBe(2048)
        expect(result.current.seed).toBe(-1)
        expect(result.current.seedLocked).toBe(false)
        expect(result.current.dimensionsLinked).toBe(false)
        expect(result.current.options).toEqual({
            enhance: false,
            private: false,
            safe: false,
        })
        expect(result.current.referenceImage).toBeUndefined()
    })

    it("updates model", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.setModel("turbo")
        })

        expect(result.current.model).toBe("turbo")
    })

    it("updates aspect ratio and dimensions together", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.handleAspectRatioChange("16:9", { width: 1536, height: 864 })
        })

        expect(result.current.aspectRatio).toBe("16:9")
        expect(result.current.width).toBe(1536)
        expect(result.current.height).toBe(864)
    })

    it("updates width and sets aspect ratio to custom", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.handleWidthChange(512)
        })

        expect(result.current.width).toBe(512)
        expect(result.current.aspectRatio).toBe("custom")
    })

    it("updates height and sets aspect ratio to custom", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.handleHeightChange(768)
        })

        expect(result.current.height).toBe(768)
        expect(result.current.aspectRatio).toBe("custom")
    })

    it("updates seed", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.setSeed(54321)
        })

        expect(result.current.seed).toBe(54321)
    })

    it("updates seed locked state", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.setSeedLocked(true)
        })

        expect(result.current.seedLocked).toBe(true)
    })

    it("updates dimensions linked state", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.setDimensionsLinked(true)
        })

        expect(result.current.dimensionsLinked).toBe(true)
    })

    it("updates options", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.setOptions({
                enhance: true,
                private: true,
                safe: false,
            })
        })

        expect(result.current.options).toEqual({
            enhance: true,
            private: true,
            safe: false,
        })
    })

    it("updates reference image", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.setReferenceImage("https://example.com/image.jpg")
        })

        expect(result.current.referenceImage).toBe("https://example.com/image.jpg")
    })

    it("clears reference image", () => {
        const { result } = renderHook(() => useGenerationSettings())

        act(() => {
            result.current.setReferenceImage("https://example.com/image.jpg")
        })

        expect(result.current.referenceImage).toBe("https://example.com/image.jpg")

        act(() => {
            result.current.setReferenceImage(undefined)
        })

        expect(result.current.referenceImage).toBeUndefined()
    })

    it("provides generateSeed function", () => {
        const { result } = renderHook(() => useGenerationSettings())

        expect(typeof result.current.generateSeed).toBe("function")
        expect(result.current.generateSeed()).toBe(12345) // From mock
    })

    it("provides isRandomMode function", () => {
        const { result } = renderHook(() => useGenerationSettings())

        expect(typeof result.current.isRandomMode).toBe("function")
        expect(result.current.isRandomMode(-1)).toBe(true) // From mock
        expect(result.current.isRandomMode(100)).toBe(false) // From mock
    })

    it("handles model change with constraint checks", () => {
        const { result } = renderHook(() => useGenerationSettings())

        // Change model
        act(() => {
            result.current.handleModelChange("flux-realism")
        })

        expect(result.current.model).toBe("flux-realism")
    })

    it("provides aspectRatios based on model", () => {
        const { result } = renderHook(() => useGenerationSettings())

        expect(Array.isArray(result.current.aspectRatios)).toBe(true)
    })

    it("refreshSeedIfNeeded does not change seed when locked", () => {
        const { result } = renderHook(() => useGenerationSettings())

        // Set a specific seed and lock it
        act(() => {
            result.current.setSeed(99999)
            result.current.setSeedLocked(true)
        })

        const seedBefore = result.current.seed

        act(() => {
            result.current.refreshSeedIfNeeded()
        })

        expect(result.current.seed).toBe(seedBefore)
    })
})
