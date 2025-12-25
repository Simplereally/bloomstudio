/**
 * Model Constraints Tests
 *
 * Tests for the model constraints configuration and utility functions.
 */

import { describe, it, expect } from "vitest"
import {
    FLUX_CONSTRAINTS,
    DEFAULT_CONSTRAINTS,
    GPTIMAGE_CONSTRAINTS,
    GPTIMAGE_LARGE_CONSTRAINTS,
    NANOBANANA_CONSTRAINTS,
    SEEDREAM_CONSTRAINTS,
    TURBO_CONSTRAINTS,
    ZIMAGE_CONSTRAINTS,
    GPTIMAGE_SUPPORTED_SIZES,
    FLUX_ASPECT_RATIOS,
    GPTIMAGE_ASPECT_RATIOS,
    TURBO_ASPECT_RATIOS,
    getModelConstraints,
    getModelAspectRatios,
    hasPixelLimit,
    validateDimensions,
    alignToStep,
    calculateMaxWidth,
    calculateMaxHeight,
    isFluxModel,
    isGPTImageModel,
    isGPTImageLargeModel,
    isNanobananaModel,
    isSeedreamModel,
    isTurboModel,
    isZImageModel,
    validateGPTImageDimensions,
    validateGPTImageLargeDimensions,
    findNearestGPTImageSize,
    findNearestGPTImageLargeSize,
    SEEDREAM_ASPECT_RATIOS,
    ZIMAGE_ASPECT_RATIOS,
} from "./model-constraints"

describe("Model Constraints", () => {
    describe("FLUX_CONSTRAINTS", () => {
        it("should have a max pixel limit less than 1 megapixel", () => {
            expect(FLUX_CONSTRAINTS.maxPixels).toBe(1_048_575)
            expect(FLUX_CONSTRAINTS.maxPixels).toBeLessThan(1_048_576) // 2^20
        })

        it("should have 32-pixel step alignment", () => {
            expect(FLUX_CONSTRAINTS.step).toBe(32)
        })

        it("should have default dimensions under the pixel limit", () => {
            const { width, height } = FLUX_CONSTRAINTS.defaultDimensions
            const pixels = width * height
            expect(pixels).toBeLessThan(FLUX_CONSTRAINTS.maxPixels)
            // 1000 * 1000 = 1,000,000 < 1,048,575
            expect(pixels).toBe(1_000_000)
        })

        it("should have dimensions enabled", () => {
            expect(FLUX_CONSTRAINTS.dimensionsEnabled).toBe(true)
        })
    })

    describe("DEFAULT_CONSTRAINTS", () => {
        it("should have infinite max pixels", () => {
            expect(DEFAULT_CONSTRAINTS.maxPixels).toBe(Infinity)
        })

        it("should have 64-pixel step alignment", () => {
            expect(DEFAULT_CONSTRAINTS.step).toBe(64)
        })
    })

    describe("FLUX_ASPECT_RATIOS", () => {
        it("should have all presets under the 1MP limit", () => {
            for (const ratio of FLUX_ASPECT_RATIOS) {
                if (ratio.value !== "custom") {
                    const pixels = ratio.width * ratio.height
                    expect(pixels).toBeLessThan(FLUX_CONSTRAINTS.maxPixels)
                }
            }
        })

        it("should include all standard aspect ratios", () => {
            const values = FLUX_ASPECT_RATIOS.map((r) => r.value)
            expect(values).toContain("1:1")
            expect(values).toContain("16:9")
            expect(values).toContain("9:16")
            expect(values).toContain("4:3")
            expect(values).toContain("3:4")
            expect(values).toContain("custom")
        })

        it("should include extended aspect ratios for photographers", () => {
            const values = FLUX_ASPECT_RATIOS.map((r) => r.value)
            expect(values).toContain("3:2")
            expect(values).toContain("2:3")
            expect(values).toContain("4:5")
            expect(values).toContain("5:4")
        })

        it("should have category metadata for all ratios", () => {
            for (const ratio of FLUX_ASPECT_RATIOS) {
                expect(ratio.category).toBeDefined()
                expect(["square", "landscape", "portrait", "ultrawide"]).toContain(ratio.category)
            }
        })
    })

    describe("getModelConstraints", () => {
        it("should return FLUX_CONSTRAINTS for flux models", () => {
            expect(getModelConstraints("flux")).toEqual(FLUX_CONSTRAINTS)
            expect(getModelConstraints("flux-pro")).toEqual(FLUX_CONSTRAINTS)
            expect(getModelConstraints("flux-realism")).toEqual(FLUX_CONSTRAINTS)
        })

        it("should return TURBO_CONSTRAINTS for turbo model", () => {
            expect(getModelConstraints("turbo")).toEqual(TURBO_CONSTRAINTS)
        })

        it("should return NANOBANANA_CONSTRAINTS for nanobanana models", () => {
            expect(getModelConstraints("nanobanana")).toEqual(NANOBANANA_CONSTRAINTS)
            expect(getModelConstraints("nanobanana-pro")).toEqual(NANOBANANA_CONSTRAINTS)
        })

        it("should return SEEDREAM_CONSTRAINTS for seedream models", () => {
            expect(getModelConstraints("seedream")).toEqual(SEEDREAM_CONSTRAINTS)
            expect(getModelConstraints("seedream-pro")).toEqual(SEEDREAM_CONSTRAINTS)
        })

        it("should return ZIMAGE_CONSTRAINTS for zimage model", () => {
            expect(getModelConstraints("zimage")).toEqual(ZIMAGE_CONSTRAINTS)
        })

        it("should return DEFAULT_CONSTRAINTS for unknown models", () => {
            expect(getModelConstraints("unknown-model")).toEqual(DEFAULT_CONSTRAINTS)
            expect(getModelConstraints("some-other-model")).toEqual(DEFAULT_CONSTRAINTS)
        })

        it("should be case-insensitive for flux detection", () => {
            expect(getModelConstraints("FLUX")).toEqual(FLUX_CONSTRAINTS)
            expect(getModelConstraints("Flux-Anime")).toEqual(FLUX_CONSTRAINTS)
        })
    })

    describe("getModelAspectRatios", () => {
        it("should return FLUX_ASPECT_RATIOS for flux models", () => {
            const ratios = getModelAspectRatios("flux")
            expect(ratios).toEqual(FLUX_ASPECT_RATIOS)
        })

        it("should return TURBO_ASPECT_RATIOS for turbo model", () => {
            const ratios = getModelAspectRatios("turbo")
            expect(ratios).toEqual(TURBO_ASPECT_RATIOS)
        })

        it("should return FLUX_ASPECT_RATIOS for nanobanana", () => {
            expect(getModelAspectRatios("nanobanana")).toEqual(FLUX_ASPECT_RATIOS)
        })

        it("should return ZIMAGE_ASPECT_RATIOS for zimage", () => {
            expect(getModelAspectRatios("zimage")).toEqual(ZIMAGE_ASPECT_RATIOS)
        })

        it("should return SEEDREAM_ASPECT_RATIOS for seedream models", () => {
            expect(getModelAspectRatios("seedream")).toEqual(SEEDREAM_ASPECT_RATIOS)
            expect(getModelAspectRatios("seedream-pro")).toEqual(SEEDREAM_ASPECT_RATIOS)
        })
    })

    describe("hasPixelLimit", () => {
        it("should return true for flux models", () => {
            expect(hasPixelLimit("flux")).toBe(true)
            expect(hasPixelLimit("flux-realism")).toBe(true)
        })

        it("should return true for turbo model (has 589,824 pixel limit)", () => {
            expect(hasPixelLimit("turbo")).toBe(true)
        })

        it("should return true for nanobanana, seedream, and zimage models", () => {
            expect(hasPixelLimit("nanobanana")).toBe(true)
            expect(hasPixelLimit("seedream")).toBe(true)
            expect(hasPixelLimit("zimage")).toBe(true)
        })

        it("should return false for models without limits", () => {
            expect(hasPixelLimit("unknown-model")).toBe(false)
            expect(hasPixelLimit("gptimage")).toBe(false)
        })
    })

    describe("validateDimensions", () => {
        it("should report valid for dimensions under the limit", () => {
            const result = validateDimensions("flux", 1000, 1000)
            expect(result.isValid).toBe(true)
            expect(result.pixelCount).toBe(1_000_000)
            expect(result.percentOfLimit).toBeCloseTo(95.4, 0)
        })

        it("should report invalid for dimensions at or over the limit", () => {
            const result = validateDimensions("flux", 1024, 1024)
            expect(result.isValid).toBe(false)
            expect(result.pixelCount).toBe(1_048_576)
            expect(result.correctedWidth).toBe(FLUX_CONSTRAINTS.defaultDimensions.width)
            expect(result.correctedHeight).toBe(FLUX_CONSTRAINTS.defaultDimensions.height)
        })

        it("should report invalid for Seedream when under 3.6MP minimum", () => {
            const result = validateDimensions("seedream", 1024, 1024)
            expect(result.isValid).toBe(false)
            expect(result.pixelCount).toBe(1_048_576)
            expect(result.pixelCount).toBeLessThan(SEEDREAM_CONSTRAINTS.minPixels)
        })

        it("should report valid for Seedream when at the 3.6MP minimum", () => {
            // 2560 * 1440 = 3,686,400
            const result = validateDimensions("seedream", 2560, 1440)
            expect(result.isValid).toBe(true)
            expect(result.pixelCount).toBe(3_686_400)
        })

        it("should report invalid for turbo when exceeding 768px limit", () => {
            const result = validateDimensions("turbo", 1024, 768)
            expect(result.isValid).toBe(false)
            expect(result.pixelCount).toBe(786_432)
        })

        it("should report valid for turbo when within 768px limit", () => {
            const result = validateDimensions("turbo", 768, 768)
            expect(result.isValid).toBe(true)
            expect(result.percentOfLimit).toBeCloseTo(100, 0)
        })

        it("should always be valid for models without limits", () => {
            const result = validateDimensions("unknown-model", 2048, 2048)
            expect(result.isValid).toBe(true)
            expect(result.percentOfLimit).toBeNull()
        })
    })

    describe("alignToStep", () => {
        it("should align values to the nearest step", () => {
            expect(alignToStep(1000, 32)).toBe(992) // rounds to nearest
            expect(alignToStep(1008, 32)).toBe(1024) // rounds up
            expect(alignToStep(1024, 32)).toBe(1024) // already aligned
        })

        it("should work with different step sizes", () => {
            expect(alignToStep(1000, 64)).toBe(1024)
            expect(alignToStep(100, 64)).toBe(128)
        })
    })

    describe("calculateMaxWidth", () => {
        it("should calculate dynamic max width for flux models", () => {
            const maxWidth = calculateMaxWidth(1000, FLUX_CONSTRAINTS)
            // maxPixels / height = 1,048,575 / 1000 = 1048.575 → floor = 1048
            expect(maxWidth).toBe(1048)
        })

        it("should cap at maxDimension", () => {
            const maxWidth = calculateMaxWidth(100, FLUX_CONSTRAINTS)
            // maxPixels / height = 1,048,575 / 100 = 10485.75, but capped at 2048
            expect(maxWidth).toBe(FLUX_CONSTRAINTS.maxDimension)
        })

        it("should return maxDimension for unlimited models", () => {
            const maxWidth = calculateMaxWidth(1000, DEFAULT_CONSTRAINTS)
            expect(maxWidth).toBe(DEFAULT_CONSTRAINTS.maxDimension)
        })
    })

    describe("calculateMaxHeight", () => {
        it("should calculate dynamic max height for flux models", () => {
            const maxHeight = calculateMaxHeight(1000, FLUX_CONSTRAINTS)
            expect(maxHeight).toBe(1048)
        })

        it("should be symmetric with calculateMaxWidth", () => {
            const width = 800
            const height = 800
            const maxW = calculateMaxWidth(height, FLUX_CONSTRAINTS)
            const maxH = calculateMaxHeight(width, FLUX_CONSTRAINTS)
            expect(maxW).toBe(maxH) // Same because width === height
        })
    })
})

describe("Flux Preset Pixel Counts", () => {
    it("should verify all preset pixel counts from the story", () => {
        const expectedPixelCounts: Record<string, number> = {
            "1:1": 1_000_000,       // 1000×1000
            "16:9": 1_044_480,      // 1360×768
            "9:16": 1_044_480,      // 768×1360
            "4:3": 995_328,         // 1152×864
            "3:4": 995_328,         // 864×1152
            "3:2": 1_038_336,       // 1248×832
            "2:3": 1_038_336,       // 832×1248
            "4:5": 1_003_520,       // 896×1120
            "5:4": 1_003_520,       // 1120×896
            "21:9": 983_040,        // 1536×640
            "9:21": 983_040,        // 640×1536
        }

        for (const ratio of FLUX_ASPECT_RATIOS) {
            if (ratio.value !== "custom" && expectedPixelCounts[ratio.value]) {
                const actualPixels = ratio.width * ratio.height
                expect(actualPixels).toBe(expectedPixelCounts[ratio.value])
                expect(actualPixels).toBeLessThan(FLUX_CONSTRAINTS.maxPixels)
            }
        }
    })
})

describe("Seedream Preset Pixel Counts", () => {
    it("should verify all preset pixel counts match requirements", () => {
        const expectedPixelCounts: Record<string, number> = {
            "1:1": 16_777_216,      // 4096×4096
            "16:9": 14_745_600,     // 5120×2880
            "9:16": 14_745_600,     // 2880×5120
            "4:3": 15_925_248,      // 4608×3456
            "3:4": 15_925_248,      // 3456×4608
            "3:2": 16_613_376,      // 4992×3328
            "2:3": 16_613_376,      // 3328×4992
            "21:9": 15_676_416,     // 6048×2592
        }

        for (const ratio of SEEDREAM_ASPECT_RATIOS) {
            if (ratio.value !== "custom" && expectedPixelCounts[ratio.value]) {
                const actualPixels = ratio.width * ratio.height
                expect(actualPixels).toBe(expectedPixelCounts[ratio.value])
                expect(actualPixels).toBeLessThanOrEqual(SEEDREAM_CONSTRAINTS.maxPixels)
                expect(actualPixels).toBeGreaterThanOrEqual(SEEDREAM_CONSTRAINTS.minPixels)
            }
        }
    })
})

describe("GPT Image Model Constraints", () => {
    describe("GPTIMAGE_CONSTRAINTS", () => {
        it("should have dimensions disabled", () => {
            expect(GPTIMAGE_CONSTRAINTS.dimensionsEnabled).toBe(false)
        })

        it("should have infinite max pixels (fixed sizes, not pixel-based)", () => {
            expect(GPTIMAGE_CONSTRAINTS.maxPixels).toBe(Infinity)
        })

        it("should have correct default dimensions (1024x1024)", () => {
            expect(GPTIMAGE_CONSTRAINTS.defaultDimensions.width).toBe(1024)
            expect(GPTIMAGE_CONSTRAINTS.defaultDimensions.height).toBe(1024)
        })

        it("should have correct min/max dimensions", () => {
            expect(GPTIMAGE_CONSTRAINTS.minDimension).toBe(1024)
            expect(GPTIMAGE_CONSTRAINTS.maxDimension).toBe(1792)
        })
    })

    describe("GPTIMAGE_SUPPORTED_SIZES", () => {
        it("should have exactly 3 supported sizes", () => {
            expect(GPTIMAGE_SUPPORTED_SIZES).toHaveLength(3)
        })

        it("should include 1024x1024 (1:1)", () => {
            const square = GPTIMAGE_SUPPORTED_SIZES.find((s) => s.ratio === "1:1")
            expect(square).toBeDefined()
            expect(square?.width).toBe(1024)
            expect(square?.height).toBe(1024)
        })

        it("should include 1536x1024 (16:9)", () => {
            const landscape = GPTIMAGE_SUPPORTED_SIZES.find((s) => s.ratio === "16:9")
            expect(landscape).toBeDefined()
            expect(landscape?.width).toBe(1536)
            expect(landscape?.height).toBe(1024)
        })

        it("should include 1024x1536 (9:16)", () => {
            const portrait = GPTIMAGE_SUPPORTED_SIZES.find((s) => s.ratio === "9:16")
            expect(portrait).toBeDefined()
            expect(portrait?.width).toBe(1024)
            expect(portrait?.height).toBe(1536)
        })
    })

    describe("isGPTImageModel", () => {
        it("should return true for 'gptimage'", () => {
            expect(isGPTImageModel("gptimage")).toBe(true)
        })

        it("should return true for 'gpt-image'", () => {
            expect(isGPTImageModel("gpt-image")).toBe(true)
        })

        it("should be case-insensitive", () => {
            expect(isGPTImageModel("GPTImage")).toBe(true)
            expect(isGPTImageModel("GPT-Image")).toBe(true)
            expect(isGPTImageModel("GPTIMAGE")).toBe(true)
        })

        it("should return false for other models", () => {
            expect(isGPTImageModel("flux")).toBe(false)
            expect(isGPTImageModel("turbo")).toBe(false)
            expect(isGPTImageModel("dalle")).toBe(false) // Similar but not exact
        })
    })

    describe("isFluxModel", () => {
        it("should return true for flux models", () => {
            expect(isFluxModel("flux")).toBe(true)
            expect(isFluxModel("flux-pro")).toBe(true)
            expect(isFluxModel("flux-realism")).toBe(true)
        })

        it("should return false for non-flux models", () => {
            expect(isFluxModel("gptimage")).toBe(false)
            expect(isFluxModel("turbo")).toBe(false)
        })
    })

    describe("getModelConstraints for GPT Image", () => {
        it("should return GPTIMAGE_CONSTRAINTS for gptimage", () => {
            expect(getModelConstraints("gptimage")).toEqual(GPTIMAGE_CONSTRAINTS)
        })

        it("should return GPTIMAGE_CONSTRAINTS for gpt-image", () => {
            expect(getModelConstraints("gpt-image")).toEqual(GPTIMAGE_CONSTRAINTS)
        })
    })

    describe("getModelAspectRatios for GPT Image", () => {
        it("should return GPTIMAGE_ASPECT_RATIOS for gptimage", () => {
            const ratios = getModelAspectRatios("gptimage")
            expect(ratios).toEqual(GPTIMAGE_ASPECT_RATIOS)
        })

        it("should have exactly 3 aspect ratio options (no custom)", () => {
            expect(GPTIMAGE_ASPECT_RATIOS).toHaveLength(3)
        })

        it("should NOT include custom option", () => {
            const values = GPTIMAGE_ASPECT_RATIOS.map((r) => r.value)
            expect(values).not.toContain("custom")
        })

        it("should only include 1:1, 16:9, and 9:16", () => {
            const values = GPTIMAGE_ASPECT_RATIOS.map((r) => r.value)
            expect(values).toContain("1:1")
            expect(values).toContain("16:9")
            expect(values).toContain("9:16")
            expect(values).toHaveLength(3)
        })
    })

    describe("hasPixelLimit for GPT Image", () => {
        it("should return false for gptimage (fixed sizes, not pixel-based)", () => {
            expect(hasPixelLimit("gptimage")).toBe(false)
        })
    })

    describe("validateGPTImageDimensions", () => {
        it("should return valid for 1024x1024", () => {
            const result = validateGPTImageDimensions(1024, 1024)
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should return valid for 1536x1024", () => {
            const result = validateGPTImageDimensions(1536, 1024)
            expect(result.valid).toBe(true)
        })

        it("should return valid for 1024x1536", () => {
            const result = validateGPTImageDimensions(1024, 1536)
            expect(result.valid).toBe(true)
        })

        it("should return invalid for unsupported dimensions", () => {
            const result = validateGPTImageDimensions(1000, 1000)
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
            expect(result.suggestedDimensions).toBeDefined()
        })

        it("should suggest 1024x1024 as default for invalid dimensions", () => {
            const result = validateGPTImageDimensions(500, 500)
            expect(result.suggestedDimensions?.width).toBe(1024)
            expect(result.suggestedDimensions?.height).toBe(1024)
            expect(result.suggestedDimensions?.ratio).toBe("1:1")
        })

        it("should return invalid for swapped dimensions (order matters)", () => {
            // 1024x1792 is valid, but 1792x1792 is not
            const result = validateGPTImageDimensions(1792, 1792)
            expect(result.valid).toBe(false)
        })
    })

    describe("findNearestGPTImageSize", () => {
        it("should return exact match for supported ratios", () => {
            expect(findNearestGPTImageSize("1:1", 1024, 1024)).toEqual({
                width: 1024,
                height: 1024,
                ratio: "1:1",
            })
            expect(findNearestGPTImageSize("16:9", 1536, 1024)).toEqual({
                width: 1536,
                height: 1024,
                ratio: "16:9",
            })
            expect(findNearestGPTImageSize("9:16", 1024, 1536)).toEqual({
                width: 1024,
                height: 1536,
                ratio: "9:16",
            })
        })

        it("should map wide ratios to 16:9", () => {
            // 21:9 (ultrawide) should map to 16:9
            const result = findNearestGPTImageSize("21:9", 1536, 640)
            expect(result.ratio).toBe("16:9")
            expect(result.width).toBe(1536)
            expect(result.height).toBe(1024)
        })

        it("should map tall ratios to 9:16", () => {
            // 9:21 (ultra tall) should map to 9:16
            const result = findNearestGPTImageSize("9:21", 640, 1536)
            expect(result.ratio).toBe("9:16")
            expect(result.width).toBe(1024)
            expect(result.height).toBe(1536)
        })

        it("should map square-ish ratios to 1:1", () => {
            // 4:3 should map to 1:1 (not wide enough for 16:9)
            const result = findNearestGPTImageSize("4:3", 1152, 864)
            expect(result.ratio).toBe("1:1")

            // 3:4 should also map to 1:1
            const result2 = findNearestGPTImageSize("3:4", 864, 1152)
            expect(result2.ratio).toBe("1:1")
        })

        it("should map custom ratio based on dimensions", () => {
            // Very wide custom ratio
            const wide = findNearestGPTImageSize("custom", 2000, 1000)
            expect(wide.ratio).toBe("16:9")

            // Very tall custom ratio
            const tall = findNearestGPTImageSize("custom", 1000, 2000)
            expect(tall.ratio).toBe("9:16")

            // Square-ish custom ratio
            const square = findNearestGPTImageSize("custom", 1000, 1000)
            expect(square.ratio).toBe("1:1")
        })
    })
})

describe("GPT Image Preset Dimensions", () => {
    it("should verify all GPT Image preset dimensions match DALL-E requirements", () => {
        const expectedSizes = [
            { width: 1024, height: 1024, ratio: "1:1" },
            { width: 1536, height: 1024, ratio: "16:9" },
            { width: 1024, height: 1536, ratio: "9:16" },
        ]

        for (const expected of expectedSizes) {
            const ratio = GPTIMAGE_ASPECT_RATIOS.find((r) => r.value === expected.ratio)
            expect(ratio).toBeDefined()
            expect(ratio?.width).toBe(expected.width)
            expect(ratio?.height).toBe(expected.height)
        }
    })
})

describe("GPT Image Large Model Constraints", () => {
    describe("GPTIMAGE_LARGE_CONSTRAINTS", () => {
        it("should have dimensions disabled", () => {
            expect(GPTIMAGE_LARGE_CONSTRAINTS.dimensionsEnabled).toBe(false)
        })

        it("should have infinite max pixels (fixed sizes, not pixel-based)", () => {
            expect(GPTIMAGE_LARGE_CONSTRAINTS.maxPixels).toBe(Infinity)
        })

        it("should have correct default dimensions (1024x1024)", () => {
            expect(GPTIMAGE_LARGE_CONSTRAINTS.defaultDimensions.width).toBe(1024)
            expect(GPTIMAGE_LARGE_CONSTRAINTS.defaultDimensions.height).toBe(1024)
        })

        it("should have correct min/max dimensions", () => {
            expect(GPTIMAGE_LARGE_CONSTRAINTS.minDimension).toBe(1024)
            expect(GPTIMAGE_LARGE_CONSTRAINTS.maxDimension).toBe(1792)
        })

        it("should have same values as GPTIMAGE_CONSTRAINTS (HD variant)", () => {
            // GPT Image Large uses the same fixed sizes, just higher quality
            expect(GPTIMAGE_LARGE_CONSTRAINTS.minDimension).toBe(GPTIMAGE_CONSTRAINTS.minDimension)
            expect(GPTIMAGE_LARGE_CONSTRAINTS.maxDimension).toBe(GPTIMAGE_CONSTRAINTS.maxDimension)
            expect(GPTIMAGE_LARGE_CONSTRAINTS.defaultDimensions).toEqual(GPTIMAGE_CONSTRAINTS.defaultDimensions)
            expect(GPTIMAGE_LARGE_CONSTRAINTS.dimensionsEnabled).toBe(GPTIMAGE_CONSTRAINTS.dimensionsEnabled)
        })
    })

    describe("isGPTImageLargeModel", () => {
        it("should return true for 'gptimage-large'", () => {
            expect(isGPTImageLargeModel("gptimage-large")).toBe(true)
        })

        it("should return true for 'gpt-image-large'", () => {
            expect(isGPTImageLargeModel("gpt-image-large")).toBe(true)
        })

        it("should return true for 'gptimagelarge'", () => {
            expect(isGPTImageLargeModel("gptimagelarge")).toBe(true)
        })

        it("should be case-insensitive", () => {
            expect(isGPTImageLargeModel("GPTImage-Large")).toBe(true)
            expect(isGPTImageLargeModel("GPT-Image-Large")).toBe(true)
            expect(isGPTImageLargeModel("GPTIMAGELARGE")).toBe(true)
        })

        it("should return false for regular gptimage (not large)", () => {
            expect(isGPTImageLargeModel("gptimage")).toBe(false)
            expect(isGPTImageLargeModel("gpt-image")).toBe(false)
        })

        it("should return false for other models", () => {
            expect(isGPTImageLargeModel("flux")).toBe(false)
            expect(isGPTImageLargeModel("turbo")).toBe(false)
            expect(isGPTImageLargeModel("dalle")).toBe(false)
        })
    })

    describe("getModelConstraints for GPT Image Large", () => {
        it("should return GPTIMAGE_LARGE_CONSTRAINTS for gptimage-large", () => {
            expect(getModelConstraints("gptimage-large")).toEqual(GPTIMAGE_LARGE_CONSTRAINTS)
        })

        it("should return GPTIMAGE_LARGE_CONSTRAINTS for gpt-image-large", () => {
            expect(getModelConstraints("gpt-image-large")).toEqual(GPTIMAGE_LARGE_CONSTRAINTS)
        })

        it("should return GPTIMAGE_LARGE_CONSTRAINTS for gptimagelarge", () => {
            expect(getModelConstraints("gptimagelarge")).toEqual(GPTIMAGE_LARGE_CONSTRAINTS)
        })
    })

    describe("getModelAspectRatios for GPT Image Large", () => {
        it("should return GPTIMAGE_ASPECT_RATIOS for gptimage-large", () => {
            const ratios = getModelAspectRatios("gptimage-large")
            expect(ratios).toEqual(GPTIMAGE_ASPECT_RATIOS)
        })

        it("should have exactly 3 aspect ratio options (same as GPT Image)", () => {
            const ratios = getModelAspectRatios("gptimage-large")
            expect(ratios).toHaveLength(3)
        })

        it("should NOT include custom option", () => {
            const ratios = getModelAspectRatios("gptimage-large")
            const values = ratios.map((r) => r.value)
            expect(values).not.toContain("custom")
        })
    })

    describe("hasPixelLimit for GPT Image Large", () => {
        it("should return false for gptimage-large (fixed sizes, not pixel-based)", () => {
            expect(hasPixelLimit("gptimage-large")).toBe(false)
        })
    })

    describe("validateGPTImageLargeDimensions", () => {
        it("should return valid for 1024x1024", () => {
            const result = validateGPTImageLargeDimensions(1024, 1024)
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should return valid for 1792x1024", () => {
            const result = validateGPTImageLargeDimensions(1792, 1024)
            expect(result.valid).toBe(true)
        })

        it("should return valid for 1024x1792", () => {
            const result = validateGPTImageLargeDimensions(1024, 1792)
            expect(result.valid).toBe(true)
        })

        it("should return invalid for unsupported dimensions", () => {
            const result = validateGPTImageLargeDimensions(1000, 1000)
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
            expect(result.suggestedDimensions).toBeDefined()
        })

        it("should suggest 1024x1024 as default for invalid dimensions", () => {
            const result = validateGPTImageLargeDimensions(500, 500)
            expect(result.suggestedDimensions?.width).toBe(1024)
            expect(result.suggestedDimensions?.height).toBe(1024)
            expect(result.suggestedDimensions?.ratio).toBe("1:1")
        })

        it("should have error message mentioning 'GPT Image Large'", () => {
            const result = validateGPTImageLargeDimensions(500, 500)
            expect(result.error).toContain("GPT Image Large")
        })
    })

    describe("findNearestGPTImageLargeSize", () => {
        it("should return exact match for supported ratios", () => {
            expect(findNearestGPTImageLargeSize("1:1", 1024, 1024)).toEqual({
                width: 1024,
                height: 1024,
                ratio: "1:1",
            })
            expect(findNearestGPTImageLargeSize("16:9", 1792, 1024)).toEqual({
                width: 1792,
                height: 1024,
                ratio: "16:9",
            })
            expect(findNearestGPTImageLargeSize("9:16", 1024, 1792)).toEqual({
                width: 1024,
                height: 1792,
                ratio: "9:16",
            })
        })

        it("should map wide ratios to 16:9", () => {
            const result = findNearestGPTImageLargeSize("21:9", 1536, 640)
            expect(result.ratio).toBe("16:9")
            expect(result.width).toBe(1792)
            expect(result.height).toBe(1024)
        })

        it("should map tall ratios to 9:16", () => {
            const result = findNearestGPTImageLargeSize("9:21", 640, 1536)
            expect(result.ratio).toBe("9:16")
            expect(result.width).toBe(1024)
            expect(result.height).toBe(1792)
        })

        it("should map square-ish ratios to 1:1", () => {
            const result = findNearestGPTImageLargeSize("4:3", 1152, 864)
            expect(result.ratio).toBe("1:1")
        })
    })
})

describe("New Model Constraints", () => {
    describe("NANOBANANA_CONSTRAINTS", () => {
        it("should have standard 1MP limit", () => {
            expect(NANOBANANA_CONSTRAINTS.maxPixels).toBe(1_048_576)
        })

        it("should have 32-pixel step alignment", () => {
            expect(NANOBANANA_CONSTRAINTS.step).toBe(32)
        })

        it("should have dimensions enabled", () => {
            expect(NANOBANANA_CONSTRAINTS.dimensionsEnabled).toBe(true)
        })

        it("should have correct default dimensions", () => {
            expect(NANOBANANA_CONSTRAINTS.defaultDimensions.width).toBe(1024)
            expect(NANOBANANA_CONSTRAINTS.defaultDimensions.height).toBe(1024)
        })
    })

    describe("SEEDREAM_CONSTRAINTS", () => {
        it("should have 16MP maximum limit", () => {
            expect(SEEDREAM_CONSTRAINTS.maxPixels).toBe(16_777_216)
        })

        it("should have 3.6MB minimum limit", () => {
            expect(SEEDREAM_CONSTRAINTS.minPixels).toBe(3_686_400)
        })

        it("should have 64-pixel step alignment", () => {
            expect(SEEDREAM_CONSTRAINTS.step).toBe(64)
        })

        it("should have dimensions enabled", () => {
            expect(SEEDREAM_CONSTRAINTS.dimensionsEnabled).toBe(true)
        })

        it("should have correct default dimensions (4096x4096)", () => {
            expect(SEEDREAM_CONSTRAINTS.defaultDimensions.width).toBe(4096)
            expect(SEEDREAM_CONSTRAINTS.defaultDimensions.height).toBe(4096)
        })
    })

    describe("TURBO_CONSTRAINTS", () => {
        it("should have strict 768x768 pixel limit", () => {
            expect(TURBO_CONSTRAINTS.maxPixels).toBe(589_825)
            expect(768 * 768).toBe(589_824) // Verify 768x768 is under the limit
        })

        it("should have strict 768px max dimension", () => {
            expect(TURBO_CONSTRAINTS.maxDimension).toBe(768)
        })

        it("should have 64-pixel step alignment", () => {
            expect(TURBO_CONSTRAINTS.step).toBe(64)
        })

        it("should have dimensions enabled", () => {
            expect(TURBO_CONSTRAINTS.dimensionsEnabled).toBe(true)
        })

        it("should have correct default dimensions (768x768)", () => {
            expect(TURBO_CONSTRAINTS.defaultDimensions.width).toBe(768)
            expect(TURBO_CONSTRAINTS.defaultDimensions.height).toBe(768)
        })
    })

    describe("ZIMAGE_CONSTRAINTS", () => {
        it("should have 4MP limit", () => {
            expect(ZIMAGE_CONSTRAINTS.maxPixels).toBe(4_194_304)
        })

        it("should have 32-pixel step alignment", () => {
            expect(ZIMAGE_CONSTRAINTS.step).toBe(32)
        })

        it("should have dimensions enabled", () => {
            expect(ZIMAGE_CONSTRAINTS.dimensionsEnabled).toBe(true)
        })

        it("should have correct default dimensions", () => {
            expect(ZIMAGE_CONSTRAINTS.defaultDimensions.width).toBe(2048)
            expect(ZIMAGE_CONSTRAINTS.defaultDimensions.height).toBe(2048)
        })
    })

    describe("TURBO_ASPECT_RATIOS", () => {
        it("should have all presets within 768px max dimension", () => {
            for (const ratio of TURBO_ASPECT_RATIOS) {
                expect(ratio.width).toBeLessThanOrEqual(768)
                expect(ratio.height).toBeLessThanOrEqual(768)
            }
        })

        it("should include custom option", () => {
            const values = TURBO_ASPECT_RATIOS.map((r) => r.value)
            expect(values).toContain("custom")
        })
    })

    describe("isNanobananaModel", () => {
        it("should return true for 'nanobanana'", () => {
            expect(isNanobananaModel("nanobanana")).toBe(true)
        })

        it("should return true for 'nanobanana-pro'", () => {
            expect(isNanobananaModel("nanobanana-pro")).toBe(true)
        })

        it("should be case-insensitive", () => {
            expect(isNanobananaModel("NANOBANANA")).toBe(true)
            expect(isNanobananaModel("Nanobanana-Pro")).toBe(true)
        })

        it("should return false for other models", () => {
            expect(isNanobananaModel("flux")).toBe(false)
            expect(isNanobananaModel("turbo")).toBe(false)
        })
    })

    describe("isSeedreamModel", () => {
        it("should return true for 'seedream'", () => {
            expect(isSeedreamModel("seedream")).toBe(true)
        })

        it("should return true for 'seedream-pro'", () => {
            expect(isSeedreamModel("seedream-pro")).toBe(true)
        })

        it("should be case-insensitive", () => {
            expect(isSeedreamModel("SEEDREAM")).toBe(true)
            expect(isSeedreamModel("Seedream-Pro")).toBe(true)
        })

        it("should return false for other models", () => {
            expect(isSeedreamModel("flux")).toBe(false)
            expect(isSeedreamModel("nanobanana")).toBe(false)
        })
    })

    describe("isTurboModel", () => {
        it("should return true for 'turbo'", () => {
            expect(isTurboModel("turbo")).toBe(true)
        })

        it("should be case-insensitive", () => {
            expect(isTurboModel("TURBO")).toBe(true)
            expect(isTurboModel("Turbo")).toBe(true)
        })

        it("should return false for turbo variants", () => {
            // Turbo is exact match only
            expect(isTurboModel("turbo-pro")).toBe(false)
            expect(isTurboModel("turbo-fast")).toBe(false)
        })

        it("should return false for other models", () => {
            expect(isTurboModel("flux")).toBe(false)
            expect(isTurboModel("nanobanana")).toBe(false)
        })
    })

    describe("isZImageModel", () => {
        it("should return true for 'zimage'", () => {
            expect(isZImageModel("zimage")).toBe(true)
        })

        it("should be case-insensitive", () => {
            expect(isZImageModel("ZIMAGE")).toBe(true)
            expect(isZImageModel("ZImage")).toBe(true)
        })

        it("should return false for other models", () => {
            expect(isZImageModel("flux")).toBe(false)
            expect(isZImageModel("turbo")).toBe(false)
        })
    })
})
