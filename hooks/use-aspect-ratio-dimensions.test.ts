/**
 * useAspectRatioDimensions Hook Tests
 *
 * Tests for the aspect ratio dimensions hook that provides
 * standard resolution calculations with model constraint support.
 */

import { describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/react"
import { useAspectRatioDimensions } from "./use-aspect-ratio-dimensions"
import type { ModelConstraints, AspectRatioOption } from "@/types/pollinations"

// Test constraints that match real model configs
const HD_MODEL_CONSTRAINTS: ModelConstraints = {
    maxPixels: 2_073_600, // ~2MP (1920x1080)
    minPixels: 0,
    minDimension: 64,
    maxDimension: 2048,
    step: 8,
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: true,
    supportedTiers: ["sd", "hd"],
}

const SEEDREAM_CONSTRAINTS: ModelConstraints = {
    maxPixels: 16_777_216, // 16MP
    minPixels: 262_144,
    minDimension: 512,
    maxDimension: 16384,
    step: 1,
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: true,
    supportedTiers: ["sd", "hd", "2k", "4k"],
}

const LOW_RES_MODEL_CONSTRAINTS: ModelConstraints = {
    maxPixels: 589_824, // ~0.6MP (768x768)
    minPixels: 0,
    minDimension: 64,
    maxDimension: 768,
    step: 64,
    defaultDimensions: { width: 768, height: 768 },
    dimensionsEnabled: true,
    supportedTiers: ["sd"],
}

const mockRatios: AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square" },
    { label: "Landscape", value: "16:9", width: 1920, height: 1080, icon: "rectangle-horizontal" },
    { label: "Portrait", value: "9:16", width: 1080, height: 1920, icon: "rectangle-vertical" },
    { label: "Custom", value: "custom", width: 1024, height: 1024, icon: "sliders" },
]

describe("useAspectRatioDimensions", () => {
    describe("getDimensionsForRatio", () => {
        it("should return standard HD 16:9 dimensions (1920x1080) for capable models", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: SEEDREAM_CONSTRAINTS,
                    availableRatios: mockRatios,
                })
            )

            const dims = result.current.getDimensionsForRatio("16:9")
            expect(dims.width).toBe(1920)
            expect(dims.height).toBe(1080)
        })

        it("should return standard 4K 16:9 dimensions (3840x2160) for 4K tier", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "4k",
                    constraints: SEEDREAM_CONSTRAINTS,
                    availableRatios: mockRatios,
                })
            )

            const dims = result.current.getDimensionsForRatio("16:9")
            expect(dims.width).toBe(3840)
            expect(dims.height).toBe(2160)
        })

        it("should return constrained dimensions for models that cannot achieve standard resolution", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: LOW_RES_MODEL_CONSTRAINTS,
                    availableRatios: mockRatios,
                })
            )

            const dims = result.current.getDimensionsForRatio("16:9")
            // Should be constrained to model limits (768 max dimension)
            expect(dims.width).toBeLessThanOrEqual(768)
            expect(dims.height).toBeLessThanOrEqual(768)
            // Should still maintain aspect ratio
            expect(Math.abs((dims.width / dims.height) - (16 / 9))).toBeLessThan(0.1)
        })

        it("should return standard dimensions for SD tier", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "sd",
                    constraints: HD_MODEL_CONSTRAINTS,
                    availableRatios: mockRatios,
                })
            )

            const dims = result.current.getDimensionsForRatio("16:9")
            expect(dims.width).toBe(1280)
            expect(dims.height).toBe(720)
        })

        it("should return default dimensions for custom ratio", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: HD_MODEL_CONSTRAINTS,
                    availableRatios: mockRatios,
                })
            )

            const dims = result.current.getDimensionsForRatio("custom")
            expect(dims.width).toBe(1024)
            expect(dims.height).toBe(1024)
        })
    })

    describe("aspectRatioOptions", () => {
        it("should return options with correct standard dimensions", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: SEEDREAM_CONSTRAINTS,
                    availableRatios: mockRatios,
                })
            )

            const options = result.current.aspectRatioOptions
            const landscape = options.find(o => o.value === "16:9")

            expect(landscape).toBeDefined()
            expect(landscape?.width).toBe(1920)
            expect(landscape?.height).toBe(1080)
        })

        it("should return correct Z-Image dimensions for HD tier (1920x1080 16:9, 1536x1536 1:1)", () => {
            const zimageConstraints: ModelConstraints = {
                maxPixels: 2_359_296,
                minPixels: 0,
                minDimension: 64,
                maxDimension: 2048,
                step: 8,
                defaultDimensions: { width: 1536, height: 1536 },
                dimensionsEnabled: true,
                supportedTiers: ["sd", "hd"],
            }

            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: zimageConstraints,
                })
            )

            const options = result.current.aspectRatioOptions

            const landscape = options.find(o => o.value === "16:9")
            expect(landscape?.width).toBe(1920)
            expect(landscape?.height).toBe(1080)

            const square = options.find(o => o.value === "1:1")
            expect(square?.width).toBe(1536)
            expect(square?.height).toBe(1536)
        })

        it("should maintain original labels and icons from available ratios", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: HD_MODEL_CONSTRAINTS,
                    availableRatios: mockRatios,
                })
            )

            const options = result.current.aspectRatioOptions
            expect(options.length).toBe(mockRatios.length)

            const landscape = options.find(o => o.value === "16:9")
            expect(landscape?.label).toBe("Landscape")
            expect(landscape?.icon).toBe("rectangle-horizontal")
        })
    })

    describe("isRatioAchievable", () => {
        it("should return true for ratios within model constraints", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: SEEDREAM_CONSTRAINTS,
                    availableRatios: mockRatios,
                })
            )

            expect(result.current.isRatioAchievable("16:9")).toBe(true)
            expect(result.current.isRatioAchievable("1:1")).toBe(true)
        })

        it("should return true for custom ratio", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: HD_MODEL_CONSTRAINTS,
                    availableRatios: mockRatios,
                })
            )

            expect(result.current.isRatioAchievable("custom")).toBe(true)
        })
    })

    describe("without constraints", () => {
        it("should return exact standard dimensions when no constraints provided", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    availableRatios: mockRatios,
                })
            )

            const dims = result.current.getDimensionsForRatio("16:9")
            expect(dims.width).toBe(1920)
            expect(dims.height).toBe(1080)
        })
    })

    describe("models with fixed output dimensions (e.g., Nano Banana)", () => {
        // These tests use the exact Nano Banana spec dimensions
        const NANOBANANA_RATIOS: AspectRatioOption[] = [
            { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
            { label: "Landscape", value: "16:9", width: 1344, height: 768, icon: "rectangle-horizontal", category: "landscape" },
            { label: "Portrait", value: "9:16", width: 768, height: 1344, icon: "rectangle-vertical", category: "portrait" },
            { label: "Photo", value: "4:3", width: 1184, height: 864, icon: "image", category: "landscape" },
            { label: "Portrait Photo", value: "3:4", width: 864, height: 1184, icon: "frame", category: "portrait" },
            { label: "Photo Wide", value: "3:2", width: 1248, height: 832, icon: "image", category: "landscape" },
            { label: "Photo Tall", value: "2:3", width: 832, height: 1248, icon: "frame", category: "portrait" },
            { label: "Social", value: "4:5", width: 896, height: 1152, icon: "smartphone", category: "portrait" },
            { label: "Social Wide", value: "5:4", width: 1152, height: 896, icon: "monitor", category: "landscape" },
            { label: "Ultrawide", value: "21:9", width: 1536, height: 672, icon: "monitor", category: "ultrawide" },
        ]

        const NANOBANANA_CONSTRAINTS: ModelConstraints = {
            maxPixels: 1_048_576, // ~1.05 MP
            minPixels: 0,
            minDimension: 672,
            maxDimension: 1536,
            step: 16,
            defaultDimensions: { width: 1024, height: 1024 },
            dimensionsEnabled: false, // Fixed output dimensions - no custom allowed
            supportedTiers: ["hd"],
            outputCertainty: "exact",
        }

        it("should return exact 1:1 dimensions from availableRatios (1024×1024), NOT recalculated", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: NANOBANANA_CONSTRAINTS,
                    availableRatios: NANOBANANA_RATIOS,
                })
            )

            const dims = result.current.getDimensionsForRatio("1:1")
            // Should be exactly 1024×1024, NOT 1008×1008 (which would result from recalculation)
            expect(dims.width).toBe(1024)
            expect(dims.height).toBe(1024)
        })

        it("should return exact 9:16 dimensions from availableRatios (768×1344), NOT recalculated", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: NANOBANANA_CONSTRAINTS,
                    availableRatios: NANOBANANA_RATIOS,
                })
            )

            const dims = result.current.getDimensionsForRatio("9:16")
            // Should be exactly 768×1344, NOT 752×1328 (which would result from recalculation)
            expect(dims.width).toBe(768)
            expect(dims.height).toBe(1344)
        })

        it("should return exact 16:9 dimensions from availableRatios (1344×768), NOT recalculated", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: NANOBANANA_CONSTRAINTS,
                    availableRatios: NANOBANANA_RATIOS,
                })
            )

            const dims = result.current.getDimensionsForRatio("16:9")
            // Should be exactly 1344×768, NOT 1328×752 (which would result from recalculation)
            expect(dims.width).toBe(1344)
            expect(dims.height).toBe(768)
        })

        it("should return exact 4:3 dimensions from availableRatios (1184×864)", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: NANOBANANA_CONSTRAINTS,
                    availableRatios: NANOBANANA_RATIOS,
                })
            )

            const dims = result.current.getDimensionsForRatio("4:3")
            expect(dims.width).toBe(1184)
            expect(dims.height).toBe(864)
        })

        it("should return exact 21:9 ultrawide dimensions from availableRatios (1536×672)", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: NANOBANANA_CONSTRAINTS,
                    availableRatios: NANOBANANA_RATIOS,
                })
            )

            const dims = result.current.getDimensionsForRatio("21:9")
            expect(dims.width).toBe(1536)
            expect(dims.height).toBe(672)
        })

        it("aspectRatioOptions should preserve exact dimensions from availableRatios", () => {
            const { result } = renderHook(() =>
                useAspectRatioDimensions({
                    tier: "hd",
                    constraints: NANOBANANA_CONSTRAINTS,
                    availableRatios: NANOBANANA_RATIOS,
                })
            )

            const options = result.current.aspectRatioOptions

            const square = options.find(o => o.value === "1:1")
            expect(square?.width).toBe(1024)
            expect(square?.height).toBe(1024)

            const landscape = options.find(o => o.value === "16:9")
            expect(landscape?.width).toBe(1344)
            expect(landscape?.height).toBe(768)

            const portrait = options.find(o => o.value === "9:16")
            expect(portrait?.width).toBe(768)
            expect(portrait?.height).toBe(1344)
        })
    })

    describe("Nano Banana Pro tiered dimensions", () => {
        /**
         * Nano Banana Pro has 3 output tiers with specific dimensions per aspect ratio.
         * Dimensions scale 2× between tiers:
         * - HD (1K tier): Base dimensions
         * - 2K tier: 2× HD dimensions
         * - 4K tier: 4× HD dimensions (2× 2K)
         *
         * This tests all 10 aspect ratios × 3 tiers = 30 dimension checks
         */

        // Expected dimensions per tier from the API spec
        // HD maps to 1K, 2K maps to 2K, 4K maps to 4K
        const NANOBANANA_PRO_DIMENSIONS = {
            hd: { // 1K tier
                "1:1": { width: 1024, height: 1024 },
                "16:9": { width: 1376, height: 768 },
                "9:16": { width: 768, height: 1376 },
                "4:3": { width: 1200, height: 896 },
                "3:4": { width: 896, height: 1200 },
                "3:2": { width: 1264, height: 848 },
                "2:3": { width: 848, height: 1264 },
                "4:5": { width: 928, height: 1152 },
                "5:4": { width: 1152, height: 928 },
                "21:9": { width: 1584, height: 672 },
            },
            "2k": { // 2K tier (2× HD)
                "1:1": { width: 2048, height: 2048 },
                "16:9": { width: 2752, height: 1536 },
                "9:16": { width: 1536, height: 2752 },
                "4:3": { width: 2400, height: 1792 },
                "3:4": { width: 1792, height: 2400 },
                "3:2": { width: 2528, height: 1696 },
                "2:3": { width: 1696, height: 2528 },
                "4:5": { width: 1856, height: 2304 },
                "5:4": { width: 2304, height: 1856 },
                "21:9": { width: 3168, height: 1344 },
            },
            "4k": { // 4K tier (4× HD)
                "1:1": { width: 4096, height: 4096 },
                "16:9": { width: 5504, height: 3072 },
                "9:16": { width: 3072, height: 5504 },
                "4:3": { width: 4800, height: 3584 },
                "3:4": { width: 3584, height: 4800 },
                "3:2": { width: 5056, height: 3392 },
                "2:3": { width: 3392, height: 5056 },
                "4:5": { width: 3712, height: 4608 },
                "5:4": { width: 4608, height: 3712 },
                "21:9": { width: 6336, height: 2688 },
            },
        } as const

        // Nano Banana Pro aspect ratios (1K tier default dimensions)
        const NANOBANANA_PRO_RATIOS: AspectRatioOption[] = [
            { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
            { label: "Landscape", value: "16:9", width: 1376, height: 768, icon: "rectangle-horizontal", category: "landscape" },
            { label: "Portrait", value: "9:16", width: 768, height: 1376, icon: "rectangle-vertical", category: "portrait" },
            { label: "Photo", value: "4:3", width: 1200, height: 896, icon: "image", category: "landscape" },
            { label: "Portrait Photo", value: "3:4", width: 896, height: 1200, icon: "frame", category: "portrait" },
            { label: "Photo Wide", value: "3:2", width: 1264, height: 848, icon: "image", category: "landscape" },
            { label: "Photo Tall", value: "2:3", width: 848, height: 1264, icon: "frame", category: "portrait" },
            { label: "Social", value: "4:5", width: 928, height: 1152, icon: "smartphone", category: "portrait" },
            { label: "Social Wide", value: "5:4", width: 1152, height: 928, icon: "monitor", category: "landscape" },
            { label: "Ultrawide", value: "21:9", width: 1584, height: 672, icon: "monitor", category: "ultrawide" },
        ]

        const NANOBANANA_PRO_CONSTRAINTS: ModelConstraints = {
            maxPixels: 17_203_200,
            minPixels: 0,
            minDimension: 672,
            maxDimension: 6336,
            step: 16,
            defaultDimensions: { width: 1024, height: 1024 },
            dimensionsEnabled: false,
            supportedTiers: ["hd", "2k", "4k"],
            outputCertainty: "likely",
        }

        const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "4:5", "5:4", "21:9"] as const

        describe("HD (1K) tier dimensions", () => {
            aspectRatios.forEach(ratio => {
                it(`should return correct HD dimensions for ${ratio}`, () => {
                    const { result } = renderHook(() =>
                        useAspectRatioDimensions({
                            tier: "hd",
                            constraints: NANOBANANA_PRO_CONSTRAINTS,
                            availableRatios: NANOBANANA_PRO_RATIOS,
                        })
                    )

                    const dims = result.current.getDimensionsForRatio(ratio)
                    const expected = NANOBANANA_PRO_DIMENSIONS.hd[ratio]
                    expect(dims.width).toBe(expected.width)
                    expect(dims.height).toBe(expected.height)
                })
            })
        })

        describe("2K tier dimensions", () => {
            aspectRatios.forEach(ratio => {
                it(`should return correct 2K dimensions for ${ratio}`, () => {
                    const { result } = renderHook(() =>
                        useAspectRatioDimensions({
                            tier: "2k",
                            constraints: NANOBANANA_PRO_CONSTRAINTS,
                            availableRatios: NANOBANANA_PRO_RATIOS,
                        })
                    )

                    const dims = result.current.getDimensionsForRatio(ratio)
                    const expected = NANOBANANA_PRO_DIMENSIONS["2k"][ratio]
                    expect(dims.width).toBe(expected.width)
                    expect(dims.height).toBe(expected.height)
                })
            })
        })

        describe("4K tier dimensions", () => {
            aspectRatios.forEach(ratio => {
                it(`should return correct 4K dimensions for ${ratio}`, () => {
                    const { result } = renderHook(() =>
                        useAspectRatioDimensions({
                            tier: "4k",
                            constraints: NANOBANANA_PRO_CONSTRAINTS,
                            availableRatios: NANOBANANA_PRO_RATIOS,
                        })
                    )

                    const dims = result.current.getDimensionsForRatio(ratio)
                    const expected = NANOBANANA_PRO_DIMENSIONS["4k"][ratio]
                    expect(dims.width).toBe(expected.width)
                    expect(dims.height).toBe(expected.height)
                })
            })
        })
    })
})
