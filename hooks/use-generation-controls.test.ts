// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useGenerationControls } from "./use-generation-controls"
import { ASPECT_RATIOS } from "@/lib/image-models"

describe("useGenerationControls", () => {
    const onGenerate = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("initializes with default values", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        expect(result.current.prompt).toBe("")
        expect(result.current.model).toBe("flux")
        expect(result.current.aspectRatio).toBe("1:1")
        expect(result.current.width).toBe(1024)
        expect(result.current.height).toBe(1024)
        expect(result.current.seed).toBe(-1)
        expect(result.current.enhance).toBe(false)
        expect(result.current.privateGen).toBe(false)
        expect(result.current.safe).toBe(false)
    })

    it("updates prompt", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setPrompt("A beautiful landscape")
        })

        expect(result.current.prompt).toBe("A beautiful landscape")
    })

    it("updates aspect ratio and dimensions", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        const sixteenNine = ASPECT_RATIOS.find((r) => r.value === "16:9")!

        act(() => {
            result.current.handleAspectRatioChange("16:9")
        })

        expect(result.current.aspectRatio).toBe("16:9")
        expect(result.current.width).toBe(sixteenNine.width)
        expect(result.current.height).toBe(sixteenNine.height)
    })

    it("updates dimensions and sets aspect ratio to custom", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.handleWidthChange([512])
        })

        expect(result.current.width).toBe(512)
        expect(result.current.aspectRatio).toBe("custom")

        act(() => {
            result.current.handleHeightChange([768])
        })

        expect(result.current.height).toBe(768)
        expect(result.current.aspectRatio).toBe("custom")
    })

    it("generates random seed", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.handleRandomSeed()
        })

        expect(result.current.seed).toBeGreaterThan(-1)
    })

    it("calls onGenerate with correct parameters", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setPrompt("A space odyssey")
            result.current.setModel("turbo")
            result.current.setEnhance(true)
        })

        act(() => {
            result.current.handleGenerate()
        })

        expect(onGenerate).toHaveBeenCalledWith({
            prompt: "A space odyssey",
            model: "turbo",
            width: 1024,
            height: 1024,
            seed: undefined,
            enhance: true,
            private: false,
            safe: false,
        })
    })

    it("does not call onGenerate if prompt is empty", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.handleGenerate()
        })

        expect(onGenerate).not.toHaveBeenCalled()
    })

    it("includes seed in onGenerate if not -1", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setPrompt("A space odyssey")
            result.current.setSeed(12345)
        })

        act(() => {
            result.current.handleGenerate()
        })

        expect(onGenerate).toHaveBeenCalledWith(
            expect.objectContaining({
                seed: 12345,
            })
        )
    })
})
