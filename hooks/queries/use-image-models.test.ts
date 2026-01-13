// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useImageModels } from "./use-image-models"
import { MODEL_REGISTRY } from "@/lib/config/models"

describe("useImageModels", () => {
    // Sort function matching the hook's implementation
    const sortModels = (a: { type: string; displayName: string }, b: { type: string; displayName: string }) => {
        const typeOrder: Record<string, number> = { image: 0, video: 1 }
        const typeComparison = typeOrder[a.type] - typeOrder[b.type]
        if (typeComparison !== 0) return typeComparison
        return a.displayName.localeCompare(b.displayName)
    }

    const expectedImageModels = Object.values(MODEL_REGISTRY)
        .filter(m => m.type === "image")
        .sort(sortModels)
    const expectedVideoModels = Object.values(MODEL_REGISTRY)
        .filter(m => m.type === "video")
        .sort(sortModels)
    const expectedAllModels = [...Object.values(MODEL_REGISTRY)].sort(sortModels)

    beforeEach(() => {
        // No mocks needed - using static data
    })

    it("returns image models sorted alphabetically by default", () => {
        const { result } = renderHook(() => useImageModels())

        expect(result.current.models).toEqual(expectedImageModels)
        expect(result.current.models.every(m => m.type === "image")).toBe(true)
        
        // Verify alphabetical ordering
        const displayNames = result.current.models.map(m => m.displayName)
        expect(displayNames).toEqual([...displayNames].sort((a, b) => a.localeCompare(b)))
    })

    it("returns isLoading as false (static data)", () => {
        const { result } = renderHook(() => useImageModels())

        expect(result.current.isLoading).toBe(false)
    })

    it("returns isError as false (static data)", () => {
        const { result } = renderHook(() => useImageModels())

        expect(result.current.isError).toBe(false)
    })

    it("returns error as null (static data)", () => {
        const { result } = renderHook(() => useImageModels())

        expect(result.current.error).toBeNull()
    })

    it("finds model by ID", () => {
        const { result } = renderHook(() => useImageModels())

        const zimage = result.current.getModel("zimage")
        expect(zimage).toBeDefined()
        expect(zimage?.id).toBe("zimage")
        expect(zimage?.displayName).toBe("Z-Image-Turbo")
    })

    it("finds model by ID (case insensitive)", () => {
        const { result } = renderHook(() => useImageModels())

        const zimage = result.current.getModel("ZIMAGE")
        expect(zimage).toBeDefined()
        expect(zimage?.id).toBe("zimage")
    })

    it("returns undefined for unknown model", () => {
        const { result } = renderHook(() => useImageModels())

        expect(result.current.getModel("unknown-model")).toBeUndefined()
    })

    it("filters by type: video (sorted alphabetically)", () => {
        const { result } = renderHook(() => useImageModels({ type: "video" }))

        expect(result.current.models).toEqual(expectedVideoModels)
        expect(result.current.models.every(m => m.type === "video")).toBe(true)
        
        // Verify alphabetical ordering
        const displayNames = result.current.models.map(m => m.displayName)
        expect(displayNames).toEqual([...displayNames].sort((a, b) => a.localeCompare(b)))
    })

    it("filters by type: all (images first, then videos, both sorted alphabetically)", () => {
        const { result } = renderHook(() => useImageModels({ type: "all" }))

        expect(result.current.models).toEqual(expectedAllModels)
        
        // Verify images come before videos
        const imageIndexes = result.current.models
            .map((m, i) => m.type === "image" ? i : -1)
            .filter(i => i !== -1)
        const videoIndexes = result.current.models
            .map((m, i) => m.type === "video" ? i : -1)
            .filter(i => i !== -1)
        
        if (imageIndexes.length > 0 && videoIndexes.length > 0) {
            expect(Math.max(...imageIndexes)).toBeLessThan(Math.min(...videoIndexes))
        }
    })

    it("provides a no-op refetch function", async () => {
        const { result } = renderHook(() => useImageModels())

        // Should not throw
        await expect(result.current.refetch()).resolves.toBeUndefined()
    })

    it("includes SDXL Turbo with correct display name", () => {
        const { result } = renderHook(() => useImageModels())

        const turbo = result.current.getModel("turbo")
        expect(turbo).toBeDefined()
        expect(turbo?.displayName).toBe("SDXL Turbo")
    })

    it("includes Flux Schnell with correct display name", () => {
        const { result } = renderHook(() => useImageModels())

        const flux = result.current.getModel("flux")
        expect(flux).toBeDefined()
        expect(flux?.displayName).toBe("Flux Schnell")
        expect(flux?.supportsNegativePrompt).toBe(true)
    })

    it("includes all expected image models", () => {
        const { result } = renderHook(() => useImageModels())

        const modelIds = result.current.models.map(m => m.id)
        expect(modelIds).toContain("zimage")
        expect(modelIds).toContain("turbo")
        expect(modelIds).toContain("kontext")
        expect(modelIds).toContain("flux")
        expect(modelIds).toContain("gptimage")
        expect(modelIds).toContain("gptimage-large")
        expect(modelIds).toContain("seedream")
        expect(modelIds).toContain("seedream-pro")
    })
})
