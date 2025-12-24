/**
 * Model Constraints Tests
 *
 * Tests for the model constraints configuration and utility functions.
 */

import { describe, it, expect } from "vitest"
import {
    FLUX_CONSTRAINTS,
    DEFAULT_CONSTRAINTS,
    FLUX_ASPECT_RATIOS,
    getModelConstraints,
    getModelAspectRatios,
    hasPixelLimit,
    validateDimensions,
    alignToStep,
    calculateMaxWidth,
    calculateMaxHeight,
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

        it("should return DEFAULT_CONSTRAINTS for non-flux models", () => {
            expect(getModelConstraints("turbo")).toEqual(DEFAULT_CONSTRAINTS)
            expect(getModelConstraints("gptimage")).toEqual(DEFAULT_CONSTRAINTS)
            expect(getModelConstraints("unknown-model")).toEqual(DEFAULT_CONSTRAINTS)
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

        it("should return default ASPECT_RATIOS for non-flux models", () => {
            const ratios = getModelAspectRatios("turbo")
            expect(ratios).not.toEqual(FLUX_ASPECT_RATIOS)
        })
    })

    describe("hasPixelLimit", () => {
        it("should return true for flux models", () => {
            expect(hasPixelLimit("flux")).toBe(true)
            expect(hasPixelLimit("flux-realism")).toBe(true)
        })

        it("should return false for models without limits", () => {
            expect(hasPixelLimit("turbo")).toBe(false)
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

        it("should always be valid for models without limits", () => {
            const result = validateDimensions("turbo", 2048, 2048)
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
