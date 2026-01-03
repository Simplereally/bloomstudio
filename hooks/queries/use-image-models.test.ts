// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useImageModels } from "./use-image-models"
import { MODEL_REGISTRY } from "@/lib/config/models"

describe("useImageModels", () => {
    const expectedImageModels = Object.values(MODEL_REGISTRY).filter(m => m.type === "image")
    const expectedVideoModels = Object.values(MODEL_REGISTRY).filter(m => m.type === "video")
    const expectedAllModels = Object.values(MODEL_REGISTRY)

    beforeEach(() => {
        // No mocks needed - using static data
    })

    it("returns image models by default", () => {
        const { result } = renderHook(() => useImageModels())

        expect(result.current.models).toEqual(expectedImageModels)
        expect(result.current.models.every(m => m.type === "image")).toBe(true)
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

    it("filters by type: video", () => {
        const { result } = renderHook(() => useImageModels({ type: "video" }))

        expect(result.current.models).toEqual(expectedVideoModels)
        expect(result.current.models.every(m => m.type === "video")).toBe(true)
    })

    it("filters by type: all", () => {
        const { result } = renderHook(() => useImageModels({ type: "all" }))

        expect(result.current.models).toEqual(expectedAllModels)
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

    it("includes all expected image models", () => {
        const { result } = renderHook(() => useImageModels())

        const modelIds = result.current.models.map(m => m.id)
        expect(modelIds).toContain("zimage")
        expect(modelIds).toContain("turbo")
        expect(modelIds).toContain("kontext")
        expect(modelIds).toContain("gptimage")
        expect(modelIds).toContain("gptimage-large")
        expect(modelIds).toContain("seedream")
        expect(modelIds).toContain("seedream-pro")
    })
})
