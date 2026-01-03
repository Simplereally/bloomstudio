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
            expect(result.current.isRandomMode(1844674407370955)).toBe(false)
        })

        it("RANDOM_SEED constant is -1", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            expect(result.current.RANDOM_SEED).toBe(-1)
        })

        it("MIN_SEED is 0", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            expect(result.current.MIN_SEED).toBe(0)
        })

        it("MAX_SEED is 1844674407370955 for zimage", () => {
            const { result } = renderHook(() => useRandomSeed("zimage"))

            expect(result.current.MAX_SEED).toBe(1844674407370955)
        })
    })

    describe("hook with Seedream model (int32 max)", () => {
        it("MAX_SEED is 2147483647 for seedream", () => {
            const { result } = renderHook(() => useRandomSeed("seedream"))

            expect(result.current.MAX_SEED).toBe(2147483647)
        })

        it("MAX_SEED is 2147483647 for seedream-pro", () => {
            const { result } = renderHook(() => useRandomSeed("seedream-pro"))

            expect(result.current.MAX_SEED).toBe(2147483647)
        })

        it("generateSeed returns values within int32 range for seedream", () => {
            const { result } = renderHook(() => useRandomSeed("seedream"))

            // Generate multiple seeds and verify they're all within int32 range
            for (let i = 0; i < 20; i++) {
                const seed = result.current.generateSeed()
                expect(seed).toBeLessThanOrEqual(2147483647)
            }
        })
    })

    describe("getMaxSeedForModel utility", () => {
        it("returns correct max seed for zimage", () => {
            expect(getMaxSeedForModel("zimage")).toBe(1844674407370955)
        })

        it("returns int32 max for seedream", () => {
            expect(getMaxSeedForModel("seedream")).toBe(2147483647)
        })

        it("throws for unknown model", () => {
            expect(() => getMaxSeedForModel("unknown-model")).toThrow(
                'Model "unknown-model" not found or missing maxSeed constraint'
            )
        })
    })

    describe("standalone utilities", () => {
        it("generateRandomSeed returns a valid integer for zimage", () => {
            const seed = generateRandomSeed("zimage")

            expect(Number.isInteger(seed)).toBe(true)
            expect(seed).toBeGreaterThanOrEqual(0)
            expect(seed).toBeLessThanOrEqual(1844674407370955)
        })

        it("generateRandomSeed returns value within int32 for seedream", () => {
            const seed = generateRandomSeed("seedream")

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

