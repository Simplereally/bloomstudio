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
})
