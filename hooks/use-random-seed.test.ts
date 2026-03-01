/**
 * @vitest-environment jsdom
 *
 * Tests for useRandomSeed Hook
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
    generateRandomSeed,
    getMaxSeedForModel,
    isRandomSeedMode,
    modelSupportsSeed,
    RANDOM_SEED,
    useRandomSeed,
} from "./use-random-seed"

describe("useRandomSeed", () => {
    describe("hook with default model (zimage)", () => {
        it("returns expected interface", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            expect(result.current).toHaveProperty("generateSeed")
            expect(result.current).toHaveProperty("isRandomMode")
            expect(result.current).toHaveProperty("RANDOM_SEED")
            expect(result.current).toHaveProperty("MIN_SEED")
            expect(result.current).toHaveProperty("MAX_SEED")
            expect(result.current).toHaveProperty("supportsSeed")
        })

        it("generateSeed returns a valid integer", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            const seed = result.current.generateSeed()

            expect(Number.isInteger(seed)).toBe(true)
            expect(seed).toBeGreaterThanOrEqual(result.current.MIN_SEED)
            expect(seed).toBeLessThanOrEqual(result.current.MAX_SEED)
        })

        it("generateSeed returns different values on multiple calls", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            const seeds = Array.from({ length: 10 }, () =>
                result.current.generateSeed()
            )
            const uniqueSeeds = new Set(seeds)

            // With 10 random seeds, we should have at least 2 unique values
            // (probability of all 10 being identical is astronomically low)
            expect(uniqueSeeds.size).toBeGreaterThan(1)
        })

        it("isRandomMode returns true for -1", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            expect(result.current.isRandomMode(-1)).toBe(true)
        })

        it("isRandomMode returns false for valid seeds", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            expect(result.current.isRandomMode(0)).toBe(false)
            expect(result.current.isRandomMode(12345)).toBe(false)
            expect(result.current.isRandomMode(2147483647)).toBe(false)
        })

        it("RANDOM_SEED constant is -1", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            expect(result.current.RANDOM_SEED).toBe(-1)
        })

        it("MIN_SEED is 0", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            expect(result.current.MIN_SEED).toBe(0)
        })

        it("MAX_SEED is 2147483647 (int32 max) for all models", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            expect(result.current.MAX_SEED).toBe(2147483647)
        })

        it("supportsSeed is true for models with seed support", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))
            expect(result.current.supportsSeed).toBe(true)
        })
    })

    describe("hook with models that do not support seed", () => {
        it("supportsSeed is false for imagen-4", () => {
            const { result } = renderHook(() => useRandomSeed("imagen-4"))
            expect(result.current.supportsSeed).toBe(false)
        })

        it("supportsSeed is false for grok-imagine", () => {
            const { result } = renderHook(() => useRandomSeed("grok-imagine"))
            expect(result.current.supportsSeed).toBe(false)
        })

        it("supportsSeed is false for grok-video", () => {
            const { result } = renderHook(() => useRandomSeed("grok-video"))
            expect(result.current.supportsSeed).toBe(false)
        })

        it("still returns a valid maxSeed fallback for models without maxSeed", () => {
            const { result } = renderHook(() => useRandomSeed("imagen-4"))
            expect(result.current.MAX_SEED).toBe(2147483647)
        })
    })

    describe("getMaxSeedForModel utility", () => {
        it("returns int32 max (2147483647) for all models", () => {
            expect(getMaxSeedForModel("zimage")).toBe(2147483647)
            expect(getMaxSeedForModel("seedream")).toBe(2147483647)
        })

        it("returns fallback int32 max for models without explicit maxSeed", () => {
            // imagen-4 no longer has maxSeed set, should fallback to int32 max
            expect(getMaxSeedForModel("imagen-4")).toBe(2147483647)
        })

        it("throws for unknown model", () => {
            expect(() => getMaxSeedForModel("unknown-model")).toThrow(
                'Model "unknown-model" not found in registry'
            )
        })
    })

    describe("modelSupportsSeed utility", () => {
        it("returns true for models with seed support", () => {
            expect(modelSupportsSeed("zimage")).toBe(true)
            expect(modelSupportsSeed("flux")).toBe(true)
            expect(modelSupportsSeed("seedream")).toBe(true)
        })

        it("returns false for models without seed support", () => {
            expect(modelSupportsSeed("imagen-4")).toBe(false)
            expect(modelSupportsSeed("grok-imagine")).toBe(false)
            expect(modelSupportsSeed("grok-video")).toBe(false)
        })

        it("returns false for unknown models", () => {
            expect(modelSupportsSeed("unknown-model")).toBe(false)
        })
    })

    describe("standalone utilities", () => {
        it("generateRandomSeed returns a valid integer within int32 range", () => {
            const seed = generateRandomSeed("zimage")

            expect(Number.isInteger(seed)).toBe(true)
            expect(seed).toBeGreaterThanOrEqual(0)
            expect(seed).toBeLessThanOrEqual(2147483647)
        })

        it("isRandomSeedMode correctly identifies random mode", () => {
            expect(isRandomSeedMode(-1)).toBe(true)
            expect(isRandomSeedMode(0)).toBe(false)
            expect(isRandomSeedMode(12345)).toBe(false)
        })

        it("RANDOM_SEED constant is -1", () => {
            expect(RANDOM_SEED).toBe(-1)
        })
    })
})

