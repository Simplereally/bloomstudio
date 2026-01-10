"use client"

/**
 * useAspectRatioDimensions Hook
 *
 * Provides dimension calculations for aspect ratios based on resolution tier
 * and model constraints. Uses standard industry resolutions as the baseline,
 * then applies model constraints to determine achievable dimensions.
 *
 * This hook follows the principle that:
 * - Resolutions and aspect ratios are predefined standards (e.g., HD 16:9 = 1920×1080)
 * - Model constraints determine WHETHER a resolution is achievable, not WHAT it should be
 * - When a model can't achieve the standard, we gracefully degrade to the closest supported size
 */

import * as React from "react"
import type { AspectRatio, AspectRatioOption, ModelConstraints, ResolutionTier } from "@/types/pollinations"
import {
    getStandardDimensions,
    getStandardDimensionsWithFallback,
    getAspectRatioDefinition,
    getAllAspectRatioDefinitions,
    type StandardDimensions,
} from "@/lib/config/standard-resolutions"
import { calculateDimensionsForTier, parseAspectRatio } from "@/lib/config/resolution-tiers"

export interface UseAspectRatioDimensionsOptions {
    /** Currently selected resolution tier */
    tier: ResolutionTier
    /** Model constraints for validation/adjustment */
    constraints?: ModelConstraints
    /** Available aspect ratios for this model (used to filter options) */
    availableRatios?: readonly AspectRatioOption[]
}

export interface UseAspectRatioDimensionsReturn {
    /**
     * Get dimensions for an aspect ratio at the current tier.
     * Returns standard dimensions adjusted for model constraints if needed.
     */
    getDimensionsForRatio: (ratio: AspectRatio) => StandardDimensions

    /**
     * Get all aspect ratio options with their dimensions for the current tier.
     * Uses standard dimensions, adjusted for model constraints.
     */
    aspectRatioOptions: AspectRatioOption[]

    /**
     * Check if a specific aspect ratio is achievable at the current tier
     * given the model constraints.
     */
    isRatioAchievable: (ratio: AspectRatio) => boolean

    /**
     * Get the closest achievable dimensions for a ratio if the standard
     * dimensions exceed model constraints.
     */
    getConstrainedDimensions: (ratio: AspectRatio) => StandardDimensions
}

/**
 * Hook for calculating aspect ratio dimensions based on resolution tier
 * and model constraints.
 *
 * @example
 * ```tsx
 * const { getDimensionsForRatio, aspectRatioOptions } = useAspectRatioDimensions({
 *     tier: "hd",
 *     constraints: modelConstraints,
 * })
 *
 * // Get dimensions for 16:9 at HD = { width: 1920, height: 1080 }
 * const dims = getDimensionsForRatio("16:9")
 * ```
 */
export function useAspectRatioDimensions({
    tier,
    constraints,
    availableRatios,
}: UseAspectRatioDimensionsOptions): UseAspectRatioDimensionsReturn {
    /**
     * Get constrained dimensions for a ratio.
     * If model constraints would prevent the standard resolution,
     * calculates the closest achievable dimensions.
     */
    const getConstrainedDimensions = React.useCallback(
        (ratio: AspectRatio): StandardDimensions => {
            if (ratio === "custom") {
                // For custom, use default dimensions from constraints or fallback
                const defaultWidth = constraints?.defaultDimensions?.width ?? 1024
                const defaultHeight = constraints?.defaultDimensions?.height ?? 1024
                return { width: defaultWidth, height: defaultHeight }
            }

            // Get the standard dimensions for this ratio and tier
            const standardDims = getStandardDimensions(ratio, tier)

            // If no standard dims (e.g., max tier), calculate from constraints
            if (!standardDims) {
                if (constraints) {
                    const parsed = parseAspectRatio(ratio)
                    if (parsed) {
                        return calculateDimensionsForTier(parsed, tier, constraints)
                    }
                }
                // Ultimate fallback
                return getStandardDimensionsWithFallback(ratio, tier)
            }

            // If no constraints, return standard dimensions
            if (!constraints) {
                return standardDims
            }

            // Check if standard dimensions fit within model constraints
            const pixels = standardDims.width * standardDims.height
            const exceedsPixels = pixels > constraints.maxPixels
            const exceedsMaxDim =
                standardDims.width > constraints.maxDimension ||
                standardDims.height > constraints.maxDimension
            const belowMinDim =
                standardDims.width < constraints.minDimension ||
                standardDims.height < constraints.minDimension

            // If standard dimensions don't fit, calculate constrained dimensions
            if (exceedsPixels || exceedsMaxDim || belowMinDim) {
                const parsed = parseAspectRatio(ratio)
                if (parsed) {
                    return calculateDimensionsForTier(parsed, tier, constraints)
                }
            }

            // Apply step alignment if needed
            const alignedWidth = Math.round(standardDims.width / constraints.step) * constraints.step
            const alignedHeight = Math.round(standardDims.height / constraints.step) * constraints.step

            // Return aligned dimensions, clamped to constraints
            return {
                width: Math.max(constraints.minDimension, Math.min(constraints.maxDimension, alignedWidth)),
                height: Math.max(constraints.minDimension, Math.min(constraints.maxDimension, alignedHeight)),
            }
        },
        [tier, constraints]
    )

    /**
     * Get dimensions for a ratio (alias for getConstrainedDimensions).
     */
    const getDimensionsForRatio = React.useCallback(
        (ratio: AspectRatio): StandardDimensions => {
            return getConstrainedDimensions(ratio)
        },
        [getConstrainedDimensions]
    )

    /**
     * Check if a ratio is achievable at the current tier.
     * Returns true if the standard dimensions can be achieved (possibly with minor alignment adjustments).
     */
    const isRatioAchievable = React.useCallback(
        (ratio: AspectRatio): boolean => {
            if (ratio === "custom") return true
            if (!constraints) return true

            const standardDims = getStandardDimensions(ratio, tier)
            if (!standardDims) return true // Can't determine, assume achievable

            const pixels = standardDims.width * standardDims.height

            // Check if reasonably achievable (within ~10% of standard after constraints)
            if (pixels <= constraints.maxPixels * 0.9) return true
            if (pixels > constraints.maxPixels * 1.1) return false

            return true
        },
        [tier, constraints]
    )

    /**
     * Build aspect ratio options array with dimensions.
     */
    const aspectRatioOptions = React.useMemo((): AspectRatioOption[] => {
        // If specific ratios are provided, filter to those
        const ratioValues = availableRatios
            ? availableRatios.map(r => r.value)
            : getAllAspectRatioDefinitions().map(d => d.value)

        return ratioValues.map((ratio): AspectRatioOption => {
            const definition = getAspectRatioDefinition(ratio)
            const dimensions = getDimensionsForRatio(ratio)

            return {
                label: definition.label,
                value: ratio,
                width: dimensions.width,
                height: dimensions.height,
                icon: definition.icon,
                category: definition.category,
            }
        })
    }, [availableRatios, getDimensionsForRatio])

    return {
        getDimensionsForRatio,
        aspectRatioOptions,
        isRatioAchievable,
        getConstrainedDimensions,
    }
}
