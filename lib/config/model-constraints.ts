/**
 * Model Constraints Configuration
 *
 * Centralized configuration for model-specific dimension and aspect ratio limits.
 * Flux models enforce a < 1 megapixel limit with 32-pixel alignment for optimal quality.
 */

import type { AspectRatioOption, ModelConstraints } from "@/types/pollinations"
import { ASPECT_RATIOS } from "@/lib/image-models"

/**
 * Flux model family constraints.
 * Enforces < 1 megapixel limit with 32-pixel alignment.
 */
export const FLUX_CONSTRAINTS: ModelConstraints = {
    maxPixels: 1_048_575, // Strictly < 2^20 (1MP)
    minDimension: 64,
    maxDimension: 2048,
    step: 32,
    defaultDimensions: { width: 1000, height: 1000 },
    dimensionsEnabled: true,
} as const

/**
 * Default constraints for models without specific limits.
 */
export const DEFAULT_CONSTRAINTS: ModelConstraints = {
    maxPixels: Infinity,
    minDimension: 64,
    maxDimension: 2048,
    step: 64,
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: true,
} as const

/**
 * Model ID patterns that should use Flux constraints.
 * Matches both exact names and partial matches for flexibility.
 */
const FLUX_MODEL_PATTERNS = [
    "flux",
    "flux-pro",
    "flux-realism",
    "flux/dev",
    "flux/schnell",
] as const

/**
 * Check if a model ID matches Flux constraints.
 * Uses startsWith to catch variants like 'flux-realism', 'flux-anime', etc.
 */
function isFluxModel(modelId: string): boolean {
    const normalized = modelId.toLowerCase()
    return normalized.startsWith("flux")
}

/**
 * Get constraints for a specific model.
 * Returns DEFAULT_CONSTRAINTS if model has no specific limits.
 */
export function getModelConstraints(modelId: string): ModelConstraints {
    if (isFluxModel(modelId)) {
        return FLUX_CONSTRAINTS
    }
    return DEFAULT_CONSTRAINTS
}

/**
 * Check if a model has a megapixel limit.
 */
export function hasPixelLimit(modelId: string): boolean {
    const constraints = getModelConstraints(modelId)
    return constraints.maxPixels < Infinity
}

/**
 * Flux-optimized aspect ratio presets (all < 1MP).
 * Each preset is carefully calculated to stay under the 1,048,576 pixel limit
 * while maximizing resolution and aligning to 32-pixel multiples.
 */
export const FLUX_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 1000, height: 1000, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1360, height: 768, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 768, height: 1360, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 1152, height: 864, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 864, height: 1152, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 1248, height: 832, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 832, height: 1248, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 896, height: 1120, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 1120, height: 896, icon: "monitor", category: "landscape" },
    { label: "Ultrawide", value: "21:9", width: 1536, height: 640, icon: "monitor", category: "ultrawide" },
    { label: "Ultra Tall", value: "9:21", width: 640, height: 1536, icon: "smartphone", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 1000, height: 1000, icon: "sliders", category: "square" },
] as const

/**
 * Get aspect ratio presets for a specific model.
 * Flux models get optimized presets that stay under 1MP.
 */
export function getModelAspectRatios(modelId: string): readonly AspectRatioOption[] {
    if (isFluxModel(modelId)) {
        return FLUX_ASPECT_RATIOS
    }
    return ASPECT_RATIOS
}

/**
 * Validate that dimensions are within model constraints.
 * Returns an object with validation result and corrected dimensions if needed.
 */
export function validateDimensions(
    modelId: string,
    width: number,
    height: number
): {
    isValid: boolean
    pixelCount: number
    percentOfLimit: number | null
    correctedWidth?: number
    correctedHeight?: number
} {
    const constraints = getModelConstraints(modelId)
    const pixelCount = width * height
    const hasLimit = constraints.maxPixels < Infinity
    const isValid = pixelCount < constraints.maxPixels

    return {
        isValid,
        pixelCount,
        percentOfLimit: hasLimit ? (pixelCount / constraints.maxPixels) * 100 : null,
        ...(isValid ? {} : {
            correctedWidth: constraints.defaultDimensions.width,
            correctedHeight: constraints.defaultDimensions.height,
        }),
    }
}

/**
 * Align a dimension value to the given step size.
 */
export function alignToStep(value: number, step: number): number {
    return Math.round(value / step) * step
}

/**
 * Calculate the maximum width given the current height and model constraints.
 */
export function calculateMaxWidth(
    height: number,
    constraints: ModelConstraints
): number {
    if (constraints.maxPixels === Infinity) {
        return constraints.maxDimension
    }
    return Math.min(
        constraints.maxDimension,
        Math.floor(constraints.maxPixels / height)
    )
}

/**
 * Calculate the maximum height given the current width and model constraints.
 */
export function calculateMaxHeight(
    width: number,
    constraints: ModelConstraints
): number {
    if (constraints.maxPixels === Infinity) {
        return constraints.maxDimension
    }
    return Math.min(
        constraints.maxDimension,
        Math.floor(constraints.maxPixels / width)
    )
}
