/**
 * @vitest-environment jsdom
 *
 * Tests for useRandomSeed Hook
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
    generateRandomSeed,
    isRandomSeedMode,
    RANDOM_SEED,
    useRandomSeed,
} from "./use-random-seed"

describe("useRandomSeed", () => {
    describe("hook", () => {
        it("returns expected interface", () => {
            const { result } = renderHook(() => useRandomSeed())

            expect(result.current).toHaveProperty("generateSeed")
            expect(result.current).toHaveProperty("isRandomMode")
            expect(result.current).toHaveProperty("RANDOM_SEED")
            expect(result.current).toHaveProperty("MIN_SEED")
            expect(result.current).toHaveProperty("MAX_SEED")
        })

        it("generateSeed returns a valid integer", () => {
            const { result } = renderHook(() => useRandomSeed())

            const seed = result.current.generateSeed()

            expect(Number.isInteger(seed)).toBe(true)
            expect(seed).toBeGreaterThanOrEqual(result.current.MIN_SEED)
            expect(seed).toBeLessThanOrEqual(result.current.MAX_SEED)
        })

        it("generateSeed returns different values on multiple calls", () => {
            const { result } = renderHook(() => useRandomSeed())

            const seeds = Array.from({ length: 10 }, () =>
                result.current.generateSeed()
            )
            const uniqueSeeds = new Set(seeds)

            // With 10 random seeds, we should have at least 2 unique values
            // (probability of all 10 being identical is astronomically low)
            expect(uniqueSeeds.size).toBeGreaterThan(1)
        })

        it("isRandomMode returns true for -1", () => {
            const { result } = renderHook(() => useRandomSeed())

            expect(result.current.isRandomMode(-1)).toBe(true)
        })

        it("isRandomMode returns false for valid seeds", () => {
            const { result } = renderHook(() => useRandomSeed())

            expect(result.current.isRandomMode(0)).toBe(false)
            expect(result.current.isRandomMode(12345)).toBe(false)
            expect(result.current.isRandomMode(1844674407370955)).toBe(false)
        })

        it("RANDOM_SEED constant is -1", () => {
            const { result } = renderHook(() => useRandomSeed())

            expect(result.current.RANDOM_SEED).toBe(-1)
        })

        it("MIN_SEED is 0", () => {
            const { result } = renderHook(() => useRandomSeed())

            expect(result.current.MIN_SEED).toBe(0)
        })

        it("MAX_SEED is 1844674407370955", () => {
            const { result } = renderHook(() => useRandomSeed())

            expect(result.current.MAX_SEED).toBe(1844674407370955)
        })
    })

    describe("standalone utilities", () => {
        it("generateRandomSeed returns a valid integer", () => {
            const seed = generateRandomSeed()

            expect(Number.isInteger(seed)).toBe(true)
            expect(seed).toBeGreaterThanOrEqual(0)
            expect(seed).toBeLessThanOrEqual(1844674407370955)
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
