// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import {
    useEstimatedCost,
    estimateCost,
    formatRemainingBalance,
    LOW_BALANCE_AFTER_GENERATION_THRESHOLD,
} from "./use-estimated-cost"
import type { ModelPricingDefinition } from "@/lib/schemas/pollinations-pricing.schema"

// Mock the models config
vi.mock("@/lib/config/models", () => ({
    getModel: vi.fn((modelId: string) => {
        const models: Record<string, { modelPricing: ModelPricingDefinition }> = {
            flux: {
                modelPricing: {
                    modelId: "flux",
                    type: "image",
                    approximatePerPollen: 5000,
                    supportsReferenceImage: false,
                    imagePricing: { perImage: 0.0002 },
                },
            },
            gptimage: {
                modelPricing: {
                    modelId: "gptimage",
                    type: "image",
                    approximatePerPollen: 70,
                    supportsReferenceImage: true,
                    tokenPricing: {
                        textInputPerMillion: 2.0,
                        imageInputPerMillion: 2.5,
                        imageOutputPerMillion: 8.0,
                    },
                },
            },
            veo: {
                modelPricing: {
                    modelId: "veo",
                    type: "video",
                    approximatePerPollen: 1,
                    supportsReferenceImage: true,
                    isAlpha: true,
                    videoPricing: { perSecond: 0.15 },
                },
            },
            seedance: {
                modelPricing: {
                    modelId: "seedance",
                    type: "video",
                    approximatePerPollen: 6,
                    supportsReferenceImage: true,
                    isAlpha: true,
                    videoPricing: { videoOutputPerMillion: 1.8 },
                },
            },
        }
        return models[modelId]
    }),
}))

describe("estimateCost", () => {
    it("returns null when pricing is undefined", () => {
        expect(estimateCost(undefined, {})).toBeNull()
    })

    it("calculates per-image pricing correctly", () => {
        const pricing: ModelPricingDefinition = {
            modelId: "flux",
            type: "image",
            approximatePerPollen: 5000,
            imagePricing: { perImage: 0.0002 },
        }
        expect(estimateCost(pricing, { imageCount: 1 })).toBeCloseTo(0.0002)
        expect(estimateCost(pricing, { imageCount: 10 })).toBeCloseTo(0.002)
    })

    it("calculates token-based image pricing correctly", () => {
        const pricing: ModelPricingDefinition = {
            modelId: "gptimage",
            type: "image",
            approximatePerPollen: 70,
            tokenPricing: {
                textInputPerMillion: 2.0,
                imageInputPerMillion: 2.5,
                imageOutputPerMillion: 8.0,
            },
        }
        // Uses approximatePerPollen: 1 / 70 ≈ 0.0143
        expect(estimateCost(pricing, { imageCount: 1 })).toBeCloseTo(1 / 70)
        expect(estimateCost(pricing, { imageCount: 5 })).toBeCloseTo(5 / 70)
    })

    it("calculates per-second video pricing correctly", () => {
        const pricing: ModelPricingDefinition = {
            modelId: "veo",
            type: "video",
            approximatePerPollen: 1,
            videoPricing: { perSecond: 0.15 },
        }
        expect(estimateCost(pricing, { durationSeconds: 5 })).toBeCloseTo(0.75)
        expect(estimateCost(pricing, { durationSeconds: 10 })).toBeCloseTo(1.5)
    })

    it("calculates token-based video pricing correctly", () => {
        const pricing: ModelPricingDefinition = {
            modelId: "seedance",
            type: "video",
            approximatePerPollen: 6,
            videoPricing: { videoOutputPerMillion: 1.8 },
        }
        // Uses approximatePerPollen: 1 / 6 ≈ 0.167
        expect(estimateCost(pricing, {})).toBeCloseTo(1 / 6)
    })
})

describe("formatRemainingBalance", () => {
    it("returns null for null input", () => {
        expect(formatRemainingBalance(null)).toBeNull()
    })

    it("returns 0.00 for negative values", () => {
        expect(formatRemainingBalance(-5)).toBe("0.00")
    })

    it("formats positive values with 2 decimal places", () => {
        expect(formatRemainingBalance(1.5)).toBe("1.50")
        expect(formatRemainingBalance(0.123)).toBe("0.12")
        expect(formatRemainingBalance(100)).toBe("100.00")
    })
})

describe("useEstimatedCost", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns defaults when balance is null", () => {
        const { result } = renderHook(() =>
            useEstimatedCost({
                modelId: "flux",
                balance: null,
            })
        )

        expect(result.current.canAfford).toBe(true) // Assume can afford if can't calculate
        expect(result.current.willDepletBalance).toBe(false)
        expect(result.current.estimatedCost).toBeNull()
    })

    it("correctly identifies when user can afford generation", () => {
        const { result } = renderHook(() =>
            useEstimatedCost({
                modelId: "flux",
                balance: 10,
                imageCount: 1,
            })
        )

        expect(result.current.canAfford).toBe(true)
        expect(result.current.willDepletBalance).toBe(false)
        expect(result.current.estimatedCost).toBeCloseTo(0.0002)
    })

    it("correctly identifies when user cannot afford generation", () => {
        const { result } = renderHook(() =>
            useEstimatedCost({
                modelId: "veo",
                balance: 0.1,
                durationSeconds: 10, // Cost: 0.15 * 10 = 1.5
            })
        )

        expect(result.current.canAfford).toBe(false)
        expect(result.current.willDepletBalance).toBe(true)
        expect(result.current.estimatedCost).toBeCloseTo(1.5)
    })

    it("correctly identifies when balance will be depleted below threshold", () => {
        // Balance: 0.6, Cost: 0.15 (5 seconds video), Remaining: 0.45 < 0.5 threshold
        const { result } = renderHook(() =>
            useEstimatedCost({
                modelId: "veo",
                balance: 0.6,
                durationSeconds: 1, // Cost: 0.15 * 1 = 0.15
            })
        )

        expect(result.current.canAfford).toBe(true)
        expect(result.current.willDepletBalance).toBe(true)
        expect(result.current.remainingAfter).toBeCloseTo(0.45)
    })

    it("does not flag depletion when remaining balance is above threshold", () => {
        const { result } = renderHook(() =>
            useEstimatedCost({
                modelId: "flux",
                balance: 10,
                imageCount: 1,
            })
        )

        expect(result.current.canAfford).toBe(true)
        expect(result.current.willDepletBalance).toBe(false)
        // Remaining: 10 - 0.0002 ≈ 10
        expect(result.current.remainingAfter).toBeCloseTo(10, 1)
    })

    it("calculates batch generation cost correctly", () => {
        const { result } = renderHook(() =>
            useEstimatedCost({
                modelId: "flux",
                balance: 1,
                imageCount: 100, // Cost: 0.0002 * 100 = 0.02
            })
        )

        expect(result.current.estimatedCost).toBeCloseTo(0.02)
        expect(result.current.canAfford).toBe(true)
        expect(result.current.remainingAfter).toBeCloseTo(0.98)
    })

    it("formats cost appropriately for very small values", () => {
        const { result } = renderHook(() =>
            useEstimatedCost({
                modelId: "flux",
                balance: 10,
                imageCount: 1,
            })
        )

        // 0.0002 is less than 0.001, so it shows "<0.001"
        expect(result.current.formattedCost).toBe("<0.001")
    })
})

describe("LOW_BALANCE_AFTER_GENERATION_THRESHOLD", () => {
    it("should be set to 0.5", () => {
        expect(LOW_BALANCE_AFTER_GENERATION_THRESHOLD).toBe(0.5)
    })
})
