"use client"

/**
 * useRandomSeed Hook
 *
 * Provides a utility for generating random seeds within the valid Pollinations API range.
 * The seed is an integer between 0 and the maximum safe integer for JavaScript.
 *
 * @see API_CONSTRAINTS.seed in lib/config/api.config.ts
 */

import { API_CONSTRAINTS } from "@/lib/config/api.config"
import * as React from "react"

/**
 * Return type for useRandomSeed hook
 */
export interface UseRandomSeedReturn {
    /** Generate a new random seed within valid range */
    generateSeed: () => number

    /** Check if a seed value represents "random" mode */
    isRandomMode: (seed: number) => boolean

    /** The seed value that represents "random" mode (-1) */
    RANDOM_SEED: number

    /** Minimum valid seed value */
    MIN_SEED: number

    /** Maximum valid seed value (JavaScript safe integer limit) */
    MAX_SEED: number
}

/** Sentinel value indicating random seed mode */
const RANDOM_SEED_VALUE = -1

/**
 * Maximum safe seed value for JavaScript
 * Using 2^31 - 1 (max 32-bit signed integer) for broader compatibility
 */
const MAX_SAFE_SEED = 1844674407370955

/**
 * Hook for generating random seeds within valid Pollinations API range.
 *
 * @example
 * ```tsx
 * const { generateSeed, isRandomMode, RANDOM_SEED } = useRandomSeed()
 *
 * // Check if seed is in random mode
 * if (isRandomMode(seed)) {
 *     const newSeed = generateSeed()
 *     console.log('Using random seed:', newSeed)
 * }
 * ```
 */
export function useRandomSeed(): UseRandomSeedReturn {
    const generateSeed = React.useCallback((): number => {
        // Generate a random integer between 0 and MAX_SAFE_SEED (inclusive)
        return Math.floor(Math.random() * (MAX_SAFE_SEED + 1))
    }, [])

    const isRandomMode = React.useCallback((seed: number): boolean => {
        return seed === RANDOM_SEED_VALUE
    }, [])

    return {
        generateSeed,
        isRandomMode,
        RANDOM_SEED: RANDOM_SEED_VALUE,
        MIN_SEED: API_CONSTRAINTS.seed.min,
        MAX_SEED: MAX_SAFE_SEED,
    }
}

/**
 * Standalone utility function for generating a random seed
 * Use this when you don't need the full hook (e.g., outside React components)
 */
export function generateRandomSeed(): number {
    return Math.floor(Math.random() * (MAX_SAFE_SEED + 1))
}

/**
 * Check if a seed value represents random mode
 */
export function isRandomSeedMode(seed: number): boolean {
    return seed === RANDOM_SEED_VALUE
}

/** Constant for random seed mode value */
export const RANDOM_SEED = RANDOM_SEED_VALUE
