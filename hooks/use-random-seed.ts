"use client"

/**
 * useRandomSeed Hook
 *
 * Provides a utility for generating random seeds within the valid range for each model.
 * The seed range varies by model - some models (like Seedream) use int32 max,
 * while others can handle larger JavaScript safe integers.
 *
 * @see ModelConstraints.maxSeed in types/pollinations.ts
 */

import { getModelConstraints } from "@/lib/config/models"
import * as React from "react"

/**
 * Return type for useRandomSeed hook
 */
export interface UseRandomSeedReturn {
    /** Generate a new random seed within valid range for the current model */
    generateSeed: () => number

    /** Check if a seed value represents "random" mode */
    isRandomMode: (seed: number) => boolean

    /** The seed value that represents "random" mode (-1) */
    RANDOM_SEED: number

    /** Minimum valid seed value */
    MIN_SEED: number

    /** Maximum valid seed value for the current model */
    MAX_SEED: number
}

/** Sentinel value indicating random seed mode */
const RANDOM_SEED_VALUE = -1

/**
 * Get the maximum seed value for a specific model.
 * Throws if modelId is not found in the registry.
 */
export function getMaxSeedForModel(modelId: string): number {
    const constraints = getModelConstraints(modelId)
    if (!constraints?.maxSeed) {
        throw new Error(`Model "${modelId}" not found or missing maxSeed constraint`)
    }
    return constraints.maxSeed
}

/**
 * Hook for generating random seeds within valid range for a specific model.
 *
 * @param modelId - Model ID to get model-specific seed limits (required)
 *
 * @example
 * ```tsx
 * const { generateSeed, isRandomMode, RANDOM_SEED, MAX_SEED } = useRandomSeed('seedream')
 *
 * // MAX_SEED will be 2147483647 for Seedream models
 * // Check if seed is in random mode
 * if (isRandomMode(seed)) {
 *     const newSeed = generateSeed()
 *     console.log('Using random seed:', newSeed)
 * }
 * ```
 */
export function useRandomSeed(modelId: string): UseRandomSeedReturn {
    const maxSeed = React.useMemo(() => getMaxSeedForModel(modelId), [modelId])

    const generateSeed = React.useCallback((): number => {
        // Generate a random integer between 0 and maxSeed (inclusive)
        return Math.floor(Math.random() * (maxSeed + 1))
    }, [maxSeed])

    const isRandomMode = React.useCallback((seed: number): boolean => {
        return seed === RANDOM_SEED_VALUE
    }, [])

    return {
        generateSeed,
        isRandomMode,
        RANDOM_SEED: RANDOM_SEED_VALUE,
        MIN_SEED: 0,
        MAX_SEED: maxSeed,
    }
}

/**
 * Standalone utility function for generating a random seed
 * Use this when you don't need the full hook (e.g., outside React components)
 *
 * @param modelId - Model ID to get model-specific seed limits (required)
 */
export function generateRandomSeed(modelId: string): number {
    const maxSeed = getMaxSeedForModel(modelId)
    return Math.floor(Math.random() * (maxSeed + 1))
}

/**
 * Check if a seed value represents random mode
 */
export function isRandomSeedMode(seed: number): boolean {
    return seed === RANDOM_SEED_VALUE
}

/** Constant for random seed mode value */
export const RANDOM_SEED = RANDOM_SEED_VALUE
