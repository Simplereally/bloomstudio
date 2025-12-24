"use client"

/**
 * useDimensionConstraints Hook
 *
 * Custom hook for managing dimension constraints based on model limits.
 * Automatically calculates dynamic slider bounds to prevent exceeding pixel limits.
 */

import { useMemo, useCallback } from "react"
import { getModelConstraints } from "@/lib/config/model-constraints"
import type { ModelConstraints } from "@/types/pollinations"

interface UseDimensionConstraintsProps {
    /** Model ID for constraint lookup */
    modelId: string
    /** Current width value */
    width: number
    /** Current height value */
    height: number
    /** Callback when width changes */
    onWidthChange: (width: number) => void
    /** Callback when height changes */
    onHeightChange: (height: number) => void
}

interface DimensionConstraintsResult {
    /** Current model constraints */
    constraints: ModelConstraints
    /** Computed max width based on current height and pixel limit */
    maxWidth: number
    /** Computed max height based on current width and pixel limit */
    maxHeight: number
    /** Whether sliders should be enabled */
    isEnabled: boolean
    /** Current pixel count */
    pixelCount: number
    /** Whether current dimensions exceed the limit */
    isOverLimit: boolean
    /** Percentage of pixel limit used (null if no limit) */
    percentOfLimit: number | null
    /** Whether the model has a pixel limit */
    hasPixelLimit: boolean
    /** Handle width change with auto-clamping */
    handleWidthChange: (newWidth: number) => void
    /** Handle height change with auto-clamping */
    handleHeightChange: (newHeight: number) => void
}

/**
 * Hook for managing dimension constraints based on model limits.
 * Automatically calculates dynamic slider bounds to prevent exceeding pixel limits.
 *
 * @example
 * ```tsx
 * const {
 *   constraints,
 *   maxWidth,
 *   maxHeight,
 *   isOverLimit,
 *   handleWidthChange,
 *   handleHeightChange,
 * } = useDimensionConstraints({
 *   modelId: "flux",
 *   width: 1024,
 *   height: 1024,
 *   onWidthChange: setWidth,
 *   onHeightChange: setHeight,
 * })
 * ```
 */
export function useDimensionConstraints({
    modelId,
    width,
    height,
    onWidthChange,
    onHeightChange,
}: UseDimensionConstraintsProps): DimensionConstraintsResult {
    // Memoize constraints lookup to avoid recalculating on every render
    const constraints = useMemo(() => getModelConstraints(modelId), [modelId])

    // Calculate derived values
    const { maxWidth, maxHeight, pixelCount, isOverLimit, percentOfLimit, hasLimit } = useMemo(() => {
        const { maxPixels, maxDimension } = constraints
        const pixels = width * height
        const hasLimitFlag = maxPixels < Infinity

        return {
            // Dynamic max: minimum of (absolute max, pixels remaining / other dimension)
            maxWidth: hasLimitFlag
                ? Math.min(maxDimension, Math.floor(maxPixels / height))
                : maxDimension,
            maxHeight: hasLimitFlag
                ? Math.min(maxDimension, Math.floor(maxPixels / width))
                : maxDimension,
            pixelCount: pixels,
            isOverLimit: hasLimitFlag && pixels >= maxPixels,
            percentOfLimit: hasLimitFlag ? (pixels / maxPixels) * 100 : null,
            hasLimit: hasLimitFlag,
        }
    }, [constraints, width, height])

    // Align value to step size
    const alignToStep = useCallback(
        (value: number) => Math.round(value / constraints.step) * constraints.step,
        [constraints.step]
    )

    // Handle width change with auto-clamping to constraints
    const handleWidthChange = useCallback(
        (newWidth: number) => {
            const aligned = alignToStep(newWidth)
            const clamped = Math.min(aligned, maxWidth)
            const finalWidth = Math.max(constraints.minDimension, clamped)
            onWidthChange(finalWidth)

            // Auto-clamp height if it would exceed pixel limit
            if (hasLimit) {
                const newMaxHeight = Math.floor(constraints.maxPixels / finalWidth)
                if (height > newMaxHeight) {
                    const clampedHeight = alignToStep(Math.min(height, newMaxHeight))
                    onHeightChange(Math.max(constraints.minDimension, clampedHeight))
                }
            }
        },
        [alignToStep, maxWidth, height, constraints, onWidthChange, onHeightChange, hasLimit]
    )

    // Handle height change with auto-clamping to constraints
    const handleHeightChange = useCallback(
        (newHeight: number) => {
            const aligned = alignToStep(newHeight)
            const clamped = Math.min(aligned, maxHeight)
            const finalHeight = Math.max(constraints.minDimension, clamped)
            onHeightChange(finalHeight)

            // Auto-clamp width if it would exceed pixel limit
            if (hasLimit) {
                const newMaxWidth = Math.floor(constraints.maxPixels / finalHeight)
                if (width > newMaxWidth) {
                    const clampedWidth = alignToStep(Math.min(width, newMaxWidth))
                    onWidthChange(Math.max(constraints.minDimension, clampedWidth))
                }
            }
        },
        [alignToStep, maxHeight, width, constraints, onWidthChange, onHeightChange, hasLimit]
    )

    return {
        constraints,
        maxWidth,
        maxHeight,
        isEnabled: constraints.dimensionsEnabled,
        pixelCount,
        isOverLimit,
        percentOfLimit,
        hasPixelLimit: hasLimit,
        handleWidthChange,
        handleHeightChange,
    }
}
