/**
 * Resolution Tier Configuration Tests
 *
 * Tests for the resolution tier utilities and calculations.
 */

import { describe, expect, it } from "vitest"
import {
    RESOLUTION_TIERS,
    RESOLUTION_TIER_ORDER,
    parseAspectRatio,
    calculateDimensionsForTier,
    getTierForPixelCount,
    getSupportedTiersForModel,
    isTierSupportedByModel,
    getMaxTierForModel,
    getDefaultTierForModel,
    formatMegapixels,
    formatDimensions,
    calculatePixelBudgetPercent,
    type AspectRatioParts,
} from "./resolution-tiers"
import type { ModelConstraints, ResolutionTier } from "@/types/pollinations"

// Test constraint configurations
const KONTEXT_CONSTRAINTS: ModelConstraints = {
    maxPixels: 1_048_576,
    minPixels: 0,
    minDimension: 64,
    maxDimension: 2048,
    step: 32,
    defaultDimensions: { width: 1000, height: 1000 },
    dimensionsEnabled: true,
    supportedTiers: ["sd", "hd"],
}

const SEEDREAM_CONSTRAINTS: ModelConstraints = {
    maxPixels: 16_777_216,
    minPixels: 262_144,
    minDimension: 512,
    maxDimension: 16384,
    step: 1,
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: true,
    supportedTiers: ["sd", "hd", "2k", "4k"],
    maxAspectRatio: 16,
}

const TURBO_CONSTRAINTS: ModelConstraints = {
    maxPixels: 589_825,
    minPixels: 0,
    minDimension: 64,
    maxDimension: 768,
    step: 64,
    defaultDimensions: { width: 768, height: 768 },
    dimensionsEnabled: true,
    supportedTiers: ["sd"],
}

const KLEIN_9B_CONSTRAINTS: ModelConstraints = {
    maxPixels: 1_048_576, // 1MP - slightly above HD tier target (1.0MP = 1,000,000)
    minPixels: 65_536,
    minDimension: 256,
    maxDimension: 1600,
    step: 16,
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: true,
    supportedTiers: ["sd", "hd"],
}

const FLUX_2_DEV_CONSTRAINTS: ModelConstraints = {
    maxPixels: 1_048_576, // 1MP - same as Klein 9B / Flux Schnell
    minPixels: 65_536,
    minDimension: 256,
    maxDimension: 1600,
    step: 16,
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: true,
    supportedTiers: ["sd", "hd"],
}

describe("Resolution Tier Configuration", () => {
    describe("RESOLUTION_TIERS", () => {
        it("should have all expected tiers", () => {
            expect(RESOLUTION_TIERS).toHaveProperty("sd")
            expect(RESOLUTION_TIERS).toHaveProperty("hd")
            expect(RESOLUTION_TIERS).toHaveProperty("2k")
            expect(RESOLUTION_TIERS).toHaveProperty("4k")
        })

        it("should have correct megapixel targets", () => {
            expect(RESOLUTION_TIERS.sd.targetMegapixels).toBe(0.5)
            expect(RESOLUTION_TIERS.hd.targetMegapixels).toBe(1.0)
            expect(RESOLUTION_TIERS["2k"].targetMegapixels).toBe(2.0)
            expect(RESOLUTION_TIERS["4k"].targetMegapixels).toBe(8.3)
        })

        it("should have labels for all tiers", () => {
            for (const tier of Object.values(RESOLUTION_TIERS)) {
                expect(tier.label).toBeDefined()
                expect(tier.shortLabel).toBeDefined()
                expect(tier.description).toBeDefined()
            }
        })
    })

    describe("RESOLUTION_TIER_ORDER", () => {
        it("should have tiers in ascending order", () => {
            expect(RESOLUTION_TIER_ORDER).toEqual(["sd", "hd", "2k", "4k"])
        })
    })
})

describe("parseAspectRatio", () => {
    it("should parse valid aspect ratios", () => {
        expect(parseAspectRatio("16:9")).toEqual({ widthRatio: 16, heightRatio: 9 })
        expect(parseAspectRatio("1:1")).toEqual({ widthRatio: 1, heightRatio: 1 })
        expect(parseAspectRatio("21:9")).toEqual({ widthRatio: 21, heightRatio: 9 })
    })

    it("should return null for invalid formats", () => {
        expect(parseAspectRatio("invalid")).toBeNull()
        expect(parseAspectRatio("16-9")).toBeNull()
        expect(parseAspectRatio("16:")).toBeNull()
        expect(parseAspectRatio(":9")).toBeNull()
    })

    it("should return null for zero or negative ratios", () => {
        expect(parseAspectRatio("0:9")).toBeNull()
        expect(parseAspectRatio("16:0")).toBeNull()
        expect(parseAspectRatio("-1:9")).toBeNull()
    })
})

describe("calculateDimensionsForTier", () => {
    it("should calculate dimensions for SD tier", () => {
        const dims = calculateDimensionsForTier(
            { widthRatio: 16, heightRatio: 9 },
            "sd",
            KONTEXT_CONSTRAINTS
        )
        // SD targets ~0.5MP but rounding/step alignment may cause slight variation
        expect(dims.width * dims.height).toBeLessThanOrEqual(600_000)
        expect(dims.width * dims.height).toBeGreaterThan(400_000)
        expect(dims.width).toBeGreaterThanOrEqual(KONTEXT_CONSTRAINTS.minDimension)
    })

    it("should calculate dimensions for HD tier", () => {
        const dims = calculateDimensionsForTier(
            { widthRatio: 1, heightRatio: 1 },
            "hd",
            KONTEXT_CONSTRAINTS
        )
        // Should be close to 1MP but under constraint
        expect(dims.width * dims.height).toBeLessThanOrEqual(KONTEXT_CONSTRAINTS.maxPixels)
    })

    it("should respect maxDimension constraints", () => {
        const dims = calculateDimensionsForTier(
            { widthRatio: 16, heightRatio: 9 },
            "4k",
            TURBO_CONSTRAINTS
        )
        expect(dims.width).toBeLessThanOrEqual(TURBO_CONSTRAINTS.maxDimension)
        expect(dims.height).toBeLessThanOrEqual(TURBO_CONSTRAINTS.maxDimension)
    })

    it("should align to step size", () => {
        const dims = calculateDimensionsForTier(
            { widthRatio: 16, heightRatio: 9 },
            "hd",
            KONTEXT_CONSTRAINTS
        )
        expect(dims.width % KONTEXT_CONSTRAINTS.step).toBe(0)
        expect(dims.height % KONTEXT_CONSTRAINTS.step).toBe(0)
    })

    it("should use model maxPixels when within 10% of tier target (Klein 9B HD 1:1 = 1024x1024)", () => {
        // Klein 9B has maxPixels of 1,048,576 (1.048576MP), which is within 10% of HD tier (1.0MP)
        // So HD tier should use the model's maxPixels for fuller resolution
        const dims = calculateDimensionsForTier(
            { widthRatio: 1, heightRatio: 1 },
            "hd",
            KLEIN_9B_CONSTRAINTS
        )
        // Should be 1024x1024 (1,048,576 pixels), not 1008x1008 (1,016,064 pixels)
        expect(dims.width).toBe(1024)
        expect(dims.height).toBe(1024)
        expect(dims.width * dims.height).toBe(1_048_576)
    })

    it("should use tier target when model maxPixels is significantly higher", () => {
        // Seedream has maxPixels of 16MP, way above HD tier (1.0MP)
        // So HD tier should use the tier target, not model maxPixels
        const dims = calculateDimensionsForTier(
            { widthRatio: 1, heightRatio: 1 },
            "hd",
            SEEDREAM_CONSTRAINTS
        )
        // Should be ~1000x1000 (tier target), not 4096x4096 (model max)
        expect(dims.width * dims.height).toBeLessThanOrEqual(1_100_000)
    })

    it("should calculate FLUX.2 Dev SD dimensions (identical to Klein 9B)", () => {
        const dims = calculateDimensionsForTier(
            { widthRatio: 16, heightRatio: 9 },
            "sd",
            FLUX_2_DEV_CONSTRAINTS
        )
        expect(dims.width * dims.height).toBeLessThanOrEqual(600_000)
        expect(dims.width * dims.height).toBeGreaterThan(400_000)
        expect(dims.width).toBeGreaterThanOrEqual(FLUX_2_DEV_CONSTRAINTS.minDimension)
        expect(dims.width % FLUX_2_DEV_CONSTRAINTS.step).toBe(0)
        expect(dims.height % FLUX_2_DEV_CONSTRAINTS.step).toBe(0)
    })

    it("should calculate FLUX.2 Dev HD 1:1 = 1024x1024 (uses model maxPixels within 10%)", () => {
        // FLUX.2 Dev has identical constraints to Klein 9B (1,048,576 maxPixels)
        // HD tier targets 1.0MP, model maxPixels is within 10%, so should use full budget
        const dims = calculateDimensionsForTier(
            { widthRatio: 1, heightRatio: 1 },
            "hd",
            FLUX_2_DEV_CONSTRAINTS
        )
        expect(dims.width).toBe(1024)
        expect(dims.height).toBe(1024)
        expect(dims.width * dims.height).toBe(1_048_576)
    })

    it("should calculate FLUX.2 Dev HD 16:9 within pixel budget", () => {
        const dims = calculateDimensionsForTier(
            { widthRatio: 16, heightRatio: 9 },
            "hd",
            FLUX_2_DEV_CONSTRAINTS
        )
        expect(dims.width * dims.height).toBeLessThanOrEqual(FLUX_2_DEV_CONSTRAINTS.maxPixels)
        expect(dims.width).toBeLessThanOrEqual(FLUX_2_DEV_CONSTRAINTS.maxDimension)
        expect(dims.height).toBeLessThanOrEqual(FLUX_2_DEV_CONSTRAINTS.maxDimension)
        expect(dims.width % FLUX_2_DEV_CONSTRAINTS.step).toBe(0)
        expect(dims.height % FLUX_2_DEV_CONSTRAINTS.step).toBe(0)
        // Width should be greater than height for landscape 16:9
        expect(dims.width).toBeGreaterThan(dims.height)
    })

    it("should produce identical dimensions for FLUX.2 Dev and Klein 9B", () => {
        // Both models share the exact same constraints, so all outputs must match
        const ratios = [
            { widthRatio: 1, heightRatio: 1 },
            { widthRatio: 16, heightRatio: 9 },
            { widthRatio: 9, heightRatio: 16 },
            { widthRatio: 4, heightRatio: 3 },
        ] satisfies AspectRatioParts[]
        const tiers = ["sd", "hd"] satisfies ResolutionTier[]

        for (const ratio of ratios) {
            for (const tier of tiers) {
                const flux2DevDims = calculateDimensionsForTier(ratio, tier, FLUX_2_DEV_CONSTRAINTS)
                const klein9bDims = calculateDimensionsForTier(ratio, tier, KLEIN_9B_CONSTRAINTS)
                expect(flux2DevDims).toEqual(klein9bDims)
            }
        }
    })
})

describe("getTierForPixelCount", () => {
    it("should return sd for low pixel counts", () => {
        expect(getTierForPixelCount(250_000)).toBe("sd")
        expect(getTierForPixelCount(500_000)).toBe("sd")
    })

    it("should return hd for medium pixel counts", () => {
        expect(getTierForPixelCount(1_000_000)).toBe("hd")
        expect(getTierForPixelCount(1_400_000)).toBe("hd")
    })

    it("should return 2k for higher pixel counts", () => {
        expect(getTierForPixelCount(2_000_000)).toBe("2k")
        expect(getTierForPixelCount(4_000_000)).toBe("2k")
    })

    it("should return 4k for very high pixel counts", () => {
        expect(getTierForPixelCount(8_000_000)).toBe("4k")
        expect(getTierForPixelCount(12_000_000)).toBe("4k")
        expect(getTierForPixelCount(20_000_000)).toBe("4k")
    })
})

describe("getSupportedTiersForModel", () => {
    it("should return explicitly defined tiers", () => {
        const tiers = getSupportedTiersForModel(KONTEXT_CONSTRAINTS)
        expect(tiers).toEqual(["sd", "hd"])
    })

    it("should return explicitly defined tiers for FLUX.2 Dev", () => {
        const tiers = getSupportedTiersForModel(FLUX_2_DEV_CONSTRAINTS)
        expect(tiers).toEqual(["sd", "hd"])
    })

    it("should infer tiers from maxPixels when not defined", () => {
        const constraintsWithoutTiers: ModelConstraints = {
            maxPixels: 4_000_000,
            minPixels: 0,
            minDimension: 64,
            maxDimension: 4096,
            step: 32,
            defaultDimensions: { width: 1024, height: 1024 },
            dimensionsEnabled: true,
        }
        const tiers = getSupportedTiersForModel(constraintsWithoutTiers)
        expect(tiers).toContain("sd")
        expect(tiers).toContain("hd")
        expect(tiers).toContain("2k")
        expect(tiers).not.toContain("4k")
    })
})

describe("isTierSupportedByModel", () => {
    it("should return true for supported tiers", () => {
        expect(isTierSupportedByModel("sd", KONTEXT_CONSTRAINTS)).toBe(true)
        expect(isTierSupportedByModel("hd", KONTEXT_CONSTRAINTS)).toBe(true)
    })

    it("should return true for FLUX.2 Dev SD and HD tiers", () => {
        expect(isTierSupportedByModel("sd", FLUX_2_DEV_CONSTRAINTS)).toBe(true)
        expect(isTierSupportedByModel("hd", FLUX_2_DEV_CONSTRAINTS)).toBe(true)
    })

    it("should return false for FLUX.2 Dev 2k and 4k tiers", () => {
        expect(isTierSupportedByModel("2k", FLUX_2_DEV_CONSTRAINTS)).toBe(false)
        expect(isTierSupportedByModel("4k", FLUX_2_DEV_CONSTRAINTS)).toBe(false)
    })

    it("should return false for unsupported tiers", () => {
        expect(isTierSupportedByModel("2k", KONTEXT_CONSTRAINTS)).toBe(false)
        expect(isTierSupportedByModel("4k", KONTEXT_CONSTRAINTS)).toBe(false)
    })
})

describe("getMaxTierForModel", () => {
    it("should return the highest supported tier", () => {
        expect(getMaxTierForModel(KONTEXT_CONSTRAINTS)).toBe("hd")
        expect(getMaxTierForModel(SEEDREAM_CONSTRAINTS)).toBe("4k")
        expect(getMaxTierForModel(TURBO_CONSTRAINTS)).toBe("sd")
    })

    it("should return HD as max tier for FLUX.2 Dev", () => {
        expect(getMaxTierForModel(FLUX_2_DEV_CONSTRAINTS)).toBe("hd")
    })
})

describe("getDefaultTierForModel", () => {
    it("should prefer HD if available", () => {
        expect(getDefaultTierForModel(KONTEXT_CONSTRAINTS)).toBe("hd")
        expect(getDefaultTierForModel(SEEDREAM_CONSTRAINTS)).toBe("hd")
    })

    it("should prefer HD for FLUX.2 Dev", () => {
        expect(getDefaultTierForModel(FLUX_2_DEV_CONSTRAINTS)).toBe("hd")
    })

    it("should return first tier if HD not available", () => {
        expect(getDefaultTierForModel(TURBO_CONSTRAINTS)).toBe("sd")
    })
})

describe("formatMegapixels", () => {
    it("should format megapixels correctly", () => {
        expect(formatMegapixels(1_000_000)).toBe("1.0 MP")
        expect(formatMegapixels(2_073_600)).toBe("2.1 MP")
        expect(formatMegapixels(8_294_400)).toBe("8.3 MP")
    })

    it("should format kilopixels for small values", () => {
        expect(formatMegapixels(500_000)).toBe("500 KP")
        expect(formatMegapixels(250_000)).toBe("250 KP")
    })
})

describe("formatDimensions", () => {
    it("should format dimensions with multiplication sign", () => {
        expect(formatDimensions(1920, 1080)).toBe("1920 × 1080")
        expect(formatDimensions(4096, 4096)).toBe("4096 × 4096")
    })
})

describe("calculatePixelBudgetPercent", () => {
    it("should calculate percentage correctly", () => {
        expect(calculatePixelBudgetPercent(500_000, 1_000_000)).toBe(50)
        expect(calculatePixelBudgetPercent(1_000_000, 1_000_000)).toBe(100)
        expect(calculatePixelBudgetPercent(1_200_000, 1_000_000)).toBe(100) // Capped at 100
    })

    it("should return 0 for Infinity max", () => {
        expect(calculatePixelBudgetPercent(1_000_000, Infinity)).toBe(0)
    })

    it("should return 0 for zero max", () => {
        expect(calculatePixelBudgetPercent(1_000_000, 0)).toBe(0)
    })
})
