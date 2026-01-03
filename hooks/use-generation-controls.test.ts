// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useGenerationControls } from "./use-generation-controls"
import { ASPECT_RATIOS } from "@/lib/image-models"
import { API_DEFAULTS } from "@/lib/config/api.config"

describe("useGenerationControls", () => {
    const onGenerate = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("initializes with default values from API_DEFAULTS", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        expect(result.current.prompt).toBe("")
        expect(result.current.negativePrompt).toBe("")
        expect(result.current.model).toBe(API_DEFAULTS.model)
        expect(result.current.aspectRatio).toBe("1:1")
        expect(result.current.width).toBe(API_DEFAULTS.width)
        expect(result.current.height).toBe(API_DEFAULTS.height)
        expect(result.current.seed).toBe(-1)
        expect(result.current.quality).toBe(API_DEFAULTS.quality)
        expect(result.current.enhance).toBe(API_DEFAULTS.enhance)
        expect(result.current.transparent).toBe(API_DEFAULTS.transparent)
        expect(result.current.guidanceScale).toBeUndefined()
        expect(result.current.nologo).toBe(API_DEFAULTS.nologo)
        expect(result.current.privateGen).toBe(API_DEFAULTS.private)
        expect(result.current.safe).toBe(API_DEFAULTS.safe)
        expect(result.current.showAdvanced).toBe(false)
    })

    it("updates prompt", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setPrompt("A beautiful landscape")
        })

        expect(result.current.prompt).toBe("A beautiful landscape")
    })

    it("updates negative prompt", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setNegativePrompt("blurry, low quality")
        })

        expect(result.current.negativePrompt).toBe("blurry, low quality")
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

    it("updates quality setting", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setQuality("hd")
        })

        expect(result.current.quality).toBe("hd")
    })

    it("updates transparent setting", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setTransparent(true)
        })

        expect(result.current.transparent).toBe(true)
    })

    it("updates guidance scale", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.handleGuidanceScaleChange([15])
        })

        expect(result.current.guidanceScale).toBe(15)
    })

    it("updates nologo setting", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setNologo(true)
        })

        expect(result.current.nologo).toBe(true)
    })

    it("toggles advanced settings visibility", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        expect(result.current.showAdvanced).toBe(false)

        act(() => {
            result.current.setShowAdvanced(true)
        })

        expect(result.current.showAdvanced).toBe(true)
    })

    it("calls onGenerate with all parameters including new ones", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setPrompt("A space odyssey")
            result.current.setNegativePrompt("blurry")
            result.current.setModel("turbo")
            result.current.setQuality("hd")
            result.current.setEnhance(true)
            result.current.setTransparent(true)
            result.current.handleGuidanceScaleChange([12])
            result.current.setNologo(true)
        })

        act(() => {
            result.current.handleGenerate()
        })

        expect(onGenerate).toHaveBeenCalledWith({
            prompt: "A space odyssey",
            negativePrompt: "blurry",
            model: "turbo",
            width: API_DEFAULTS.width,
            height: API_DEFAULTS.height,
            seed: undefined,
            quality: "hd",
            enhance: true,
            transparent: true,
            guidance_scale: 12,
            nologo: true,
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

    it("excludes empty negativePrompt from onGenerate params", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        act(() => {
            result.current.setPrompt("A sunset")
            result.current.setNegativePrompt("   ") // whitespace only
        })

        act(() => {
            result.current.handleGenerate()
        })

        expect(onGenerate).toHaveBeenCalledWith(
            expect.objectContaining({
                negativePrompt: undefined,
            })
        )
    })

    it("resets all values to defaults", () => {
        const { result } = renderHook(() => useGenerationControls({ onGenerate }))

        // Change various values
        act(() => {
            result.current.setPrompt("Some prompt")
            result.current.setNegativePrompt("Some negative")
            result.current.setModel("turbo")
            result.current.setQuality("hd")
            result.current.setEnhance(true)
            result.current.setTransparent(true)
            result.current.handleGuidanceScaleChange([15])
            result.current.setNologo(true)
            result.current.setPrivateGen(true)
            result.current.setSafe(true)
            result.current.handleWidthChange([512])
            result.current.handleHeightChange([768])
            result.current.setSeed(12345)
        })

        // Reset
        act(() => {
            result.current.resetToDefaults()
        })

        // Verify all values are back to defaults
        expect(result.current.prompt).toBe("")
        expect(result.current.negativePrompt).toBe("")
        expect(result.current.model).toBe(API_DEFAULTS.model)
        expect(result.current.aspectRatio).toBe("1:1")
        expect(result.current.width).toBe(API_DEFAULTS.width)
        expect(result.current.height).toBe(API_DEFAULTS.height)
        expect(result.current.seed).toBe(-1)
        expect(result.current.quality).toBe(API_DEFAULTS.quality)
        expect(result.current.enhance).toBe(API_DEFAULTS.enhance)
        expect(result.current.transparent).toBe(API_DEFAULTS.transparent)
        expect(result.current.guidanceScale).toBeUndefined()
        expect(result.current.nologo).toBe(API_DEFAULTS.nologo)
        expect(result.current.privateGen).toBe(API_DEFAULTS.private)
        expect(result.current.safe).toBe(API_DEFAULTS.safe)
    })
})
