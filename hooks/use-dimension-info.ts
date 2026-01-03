"use client"

/**
 * useDimensionInfo Hook
 *
 * Provides computed dimension information (megapixels, limit status) for display purposes.
 * Designed to be used separately from the full useDimensionConstraints hook for header controls.
 */

import { getModel } from "@/lib/config/models"
import type { ModelConstraints } from "@/types/pollinations"
import { useMemo } from "react"

/** Default constraints for unknown models */
const DEFAULT_CONSTRAINTS: ModelConstraints = {
    maxPixels: Infinity,
    minPixels: 0,
    minDimension: 64,
    maxDimension: 2048,
    step: 64,
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: true,
} as const

interface UseDimensionInfoProps {
    /** Model ID for constraint lookup */
    modelId: string
    /** Current width value */
    width: number
    /** Current height value */
    height: number
}

interface DimensionInfoResult {
    /** Current pixel count */
    pixelCount: number
    /** Megapixels as a formatted string (e.g., "2.10") */
    megapixels: string
    /** Whether current dimensions exceed the limit */
    isOverLimit: boolean
    /** Percentage of pixel limit used (null if no limit) */
    percentOfLimit: number | null
    /** Whether the model has a pixel limit */
    hasPixelLimit: boolean
    /** Whether dimensions are enabled for this model */
    isEnabled: boolean
}

/**
 * Hook for getting computed dimension information for display purposes.
 * Lighter weight than useDimensionConstraints when you only need display info.
 *
 * @example
 * ```tsx
 * const { megapixels, isOverLimit, percentOfLimit } = useDimensionInfo({
 *   modelId: "zimage",
 *   width: 1024,
 *   height: 1024,
 * })
 * ```
 */
export function useDimensionInfo({
    modelId,
    width,
    height,
}: UseDimensionInfoProps): DimensionInfoResult {
    // Memoize constraints lookup
    const constraints = useMemo(
        () => getModel(modelId)?.constraints ?? DEFAULT_CONSTRAINTS,
        [modelId]
    )

    // Calculate derived values
    return useMemo(() => {
        const { maxPixels, dimensionsEnabled } = constraints
        const pixels = width * height
        const hasLimitFlag = maxPixels < Infinity

        return {
            pixelCount: pixels,
            megapixels: (pixels / 1_000_000).toFixed(2),
            isOverLimit: hasLimitFlag && pixels >= maxPixels,
            percentOfLimit: hasLimitFlag ? (pixels / maxPixels) * 100 : null,
            hasPixelLimit: hasLimitFlag,
            isEnabled: dimensionsEnabled,
        }
    }, [constraints, width, height])
}
