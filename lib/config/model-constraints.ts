/**
 * Model Constraints Configuration
 *
 * Centralized configuration for model-specific dimension and aspect ratio limits.
 * - Flux models enforce a < 1 megapixel limit with 32-pixel alignment for optimal quality.
 * - GPT Image (DALL-E based) uses fixed resolutions only - no dimension customization.
 */

import type { AspectRatio, AspectRatioOption, ModelConstraints } from "@/types/pollinations"
import { ASPECT_RATIOS } from "@/lib/image-models"

/**
 * Flux model family constraints.
 * Enforces < 1 megapixel limit with 32-pixel alignment.
 */
export const FLUX_CONSTRAINTS: ModelConstraints = {
    maxPixels: 1_048_575, // Strictly < 2^20 (1MP)
    minPixels: 0,
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
    minPixels: 0,
    minDimension: 64,
    maxDimension: 2048,
    step: 64,
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: true,
} as const

/**
 * GPT Image (DALL-E based) model constraints.
 * Uses fixed resolutions only - no dimension customization allowed.
 */
export const GPTIMAGE_CONSTRAINTS: ModelConstraints = {
    maxPixels: Infinity, // Fixed sizes, not pixel-based
    minPixels: 0,
    minDimension: 1024,
    maxDimension: 1792,
    step: 1, // Not applicable - fixed sizes
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: false, // ⚠️ KEY: Disables dimension controls
} as const

/**
 * GPT Image Large (DALL-E 3 HD based) model constraints.
 * Uses the same fixed resolutions as GPT Image but with higher quality/detail.
 */
export const GPTIMAGE_LARGE_CONSTRAINTS: ModelConstraints = {
    maxPixels: Infinity, // Fixed sizes, not pixel-based
    minPixels: 0,
    minDimension: 1024,
    maxDimension: 1792,
    step: 1, // Not applicable - fixed sizes
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: false, // ⚠️ KEY: Disables dimension controls
} as const

/**
 * Supported fixed sizes for GPT Image model.
 * These are the only valid dimension combinations.
 */
export const GPTIMAGE_SUPPORTED_SIZES = [
    { width: 1024, height: 1024, ratio: "1:1" as AspectRatio },
    { width: 1536, height: 1024, ratio: "16:9" as AspectRatio },
    { width: 1024, height: 1536, ratio: "9:16" as AspectRatio },
] as const

/**
 * Supported fixed sizes for GPT Image Large model.
 * These are the only valid dimension combinations.
 */
export const GPTIMAGE_LARGE_SUPPORTED_SIZES = [
    { width: 1024, height: 1024, ratio: "1:1" as AspectRatio },
    { width: 1792, height: 1024, ratio: "16:9" as AspectRatio },
    { width: 1024, height: 1792, ratio: "9:16" as AspectRatio },
] as const

/**
 * Nanobanana model family constraints.
 * Lightweight, fast model suitable for quick generations.
 * Uses standard 1MP limit with 32-pixel alignment.
 */
export const NANOBANANA_CONSTRAINTS: ModelConstraints = {
    maxPixels: 1_048_576,
    minPixels: 0,
    minDimension: 64,
    maxDimension: 2048,
    step: 32,
    defaultDimensions: { width: 1024, height: 1024 },
    dimensionsEnabled: true,
} as const

/**
 * Seedream model family constraints.
 * Artistic/dreamlike image generation model.
 * Uses standard 1MP limit with 32-pixel alignment.
 */
export const SEEDREAM_CONSTRAINTS: ModelConstraints = {
    maxPixels: 16_777_216, // Runware: max 16,777,216 total pixels
    minPixels: 3_686_400, // Runware: min 3,686,400 total pixels
    minDimension: 1024, // Parallel AI Summary: at least 1024px
    maxDimension: 6144, // Accommodates 6048 from recommended list
    step: 64, // Standard alignment
    defaultDimensions: { width: 4096, height: 4096 }, // Highest supported 1:1
    dimensionsEnabled: true,
} as const

/**
 * Turbo model constraints.
 * Fast generation model with strict 768×768 maximum dimension limit.
 * Optimized for rapid iteration and previews.
 */
export const TURBO_CONSTRAINTS: ModelConstraints = {
    maxPixels: 589_825, // Allows 768 × 768 = 589,824 (strict < comparison)
    minPixels: 0,
    minDimension: 64,
    maxDimension: 768, // Strict maximum
    step: 64,
    defaultDimensions: { width: 768, height: 768 },
    dimensionsEnabled: true,
} as const

/**
 * ZImage model constraints.
 * Standard image generation model with flexible dimensions.
 * Uses standard 1MP limit with 32-pixel alignment.
 */
export const ZIMAGE_CONSTRAINTS: ModelConstraints = {
    maxPixels: 4_194_304,
    minPixels: 0,
    minDimension: 64,
    maxDimension: 4096,
    step: 32,
    defaultDimensions: { width: 2048, height: 2048 },
    dimensionsEnabled: true,
} as const

/**
 * Check if a model ID matches Flux constraints.
 * Uses startsWith to catch variants like 'flux-realism', 'flux-anime', etc.
 */
export function isFluxModel(modelId: string): boolean {
    const normalized = modelId.toLowerCase()
    return normalized.startsWith("flux")
}

/**
 * Check if a model ID matches GPT Image constraints.
 * Matches 'gptimage', 'gpt-image', and similar variations.
 */
export function isGPTImageModel(modelId: string): boolean {
    const normalized = modelId.toLowerCase()
    return normalized === "gptimage" || normalized === "gpt-image"
}

/**
 * Check if a model ID matches GPT Image Large (HD) constraints.
 * Matches 'gptimage-large', 'gpt-image-large', and similar variations.
 */
export function isGPTImageLargeModel(modelId: string): boolean {
    const normalized = modelId.toLowerCase()
    return (
        normalized === "gptimage-large" ||
        normalized === "gpt-image-large" ||
        normalized === "gptimagelarge"
    )
}

/**
 * Check if a model ID matches Nanobanana constraints.
 * Catches both 'nanobanana' and 'nanobanana-pro' variants.
 */
export function isNanobananaModel(modelId: string): boolean {
    const normalized = modelId.toLowerCase()
    return normalized.startsWith("nanobanana")
}

/**
 * Check if a model ID matches Seedream constraints.
 * Catches both 'seedream' and 'seedream-pro' variants.
 */
export function isSeedreamModel(modelId: string): boolean {
    const normalized = modelId.toLowerCase()
    return normalized.startsWith("seedream")
}

/**
 * Check if a model ID matches Turbo constraints.
 * Fast generation model with strict dimension limits.
 */
export function isTurboModel(modelId: string): boolean {
    const normalized = modelId.toLowerCase()
    return normalized === "turbo"
}

/**
 * Check if a model ID matches ZImage constraints.
 */
export function isZImageModel(modelId: string): boolean {
    const normalized = modelId.toLowerCase()
    return normalized === "zimage"
}

/**
 * Get constraints for a specific model.
 * Returns DEFAULT_CONSTRAINTS if model has no specific limits.
 */
export function getModelConstraints(modelId: string): ModelConstraints {
    if (isFluxModel(modelId)) {
        return FLUX_CONSTRAINTS
    }
    // Check GPT Image Large first (more specific) before GPT Image
    if (isGPTImageLargeModel(modelId)) {
        return GPTIMAGE_LARGE_CONSTRAINTS
    }
    if (isGPTImageModel(modelId)) {
        return GPTIMAGE_CONSTRAINTS
    }
    // Nanobanana (both base and Pro variants)
    if (isNanobananaModel(modelId)) {
        return NANOBANANA_CONSTRAINTS
    }
    // Seedream (both base and Pro variants)
    if (isSeedreamModel(modelId)) {
        return SEEDREAM_CONSTRAINTS
    }
    // Turbo (fast generation with strict 768px limit)
    if (isTurboModel(modelId)) {
        return TURBO_CONSTRAINTS
    }
    // ZImage (standard constraints)
    if (isZImageModel(modelId)) {
        return ZIMAGE_CONSTRAINTS
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
 * GPT Image aspect ratio presets (fixed sizes only).
 * Only 3 options available - no custom dimensions allowed.
 */
export const GPTIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1536, height: 1024, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1024, height: 1536, icon: "rectangle-vertical", category: "portrait" },
] as const // Note: NO "custom" option - fixed sizes only

/**
 * Turbo-optimized aspect ratio presets (768px max dimension).
 * Scaled down from standard ratios to fit Turbo's strict 768px limit.
 */
export const TURBO_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 768, height: 768, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 768, height: 432, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 432, height: 768, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 768, height: 576, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 576, height: 768, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 768, height: 320, icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 768, height: 768, icon: "sliders", category: "square" },
] as const

export const ZIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 2048, height: 2048, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 2560, height: 1440, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1440, height: 2560, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 2048, height: 1536, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 1536, height: 2048, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 2048, height: 960, icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 2048, height: 2048, icon: "sliders", category: "square" },
] as const

/**
 * Seedream 4.5 (Pro) optimized aspect ratio presets.
 * Uses the highest possible supported pixel dimensions (4K) as per Runware documentation.
 */
export const SEEDREAM_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 4096, height: 4096, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 5120, height: 2880, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 2880, height: 5120, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 4608, height: 3456, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 3456, height: 4608, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 4992, height: 3328, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 3328, height: 4992, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 6048, height: 2592, icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 4096, height: 4096, icon: "sliders", category: "square" },
] as const

/**
 * Get aspect ratio presets for a specific model.
 * - Flux, Nanobanana, Seedream, and ZImage get optimized presets that stay under 1MP.
 * - Turbo gets scaled-down presets with 768px max.
 * - GPT Image models get only 3 fixed size options.
 */
export function getModelAspectRatios(modelId: string): readonly AspectRatioOption[] {
    // GPT Image models have fixed sizes only
    if (isGPTImageLargeModel(modelId) || isGPTImageModel(modelId)) {
        return GPTIMAGE_ASPECT_RATIOS
    }
    // Turbo has strict 768px max dimension
    if (isTurboModel(modelId)) {
        return TURBO_ASPECT_RATIOS
    }
    // Flux, Nanobanana all use standard 1MP-optimized ratios
    if (isFluxModel(modelId) || isNanobananaModel(modelId)) {
        return FLUX_ASPECT_RATIOS
    }

    // Seedream uses high-resolution (4K) presets
    if (isSeedreamModel(modelId)) {
        return SEEDREAM_ASPECT_RATIOS
    }

    if (isZImageModel(modelId)) {
        return ZIMAGE_ASPECT_RATIOS
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
    const hasMaxLimit = constraints.maxPixels < Infinity
    const isUnderMax = pixelCount < constraints.maxPixels
    const isAboveMin = pixelCount >= constraints.minPixels
    const isValid = isUnderMax && isAboveMin

    return {
        isValid,
        pixelCount,
        percentOfLimit: hasMaxLimit ? (pixelCount / constraints.maxPixels) * 100 : null,
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

/**
 * Validation result for GPT Image dimensions.
 */
export interface GPTImageValidationResult {
    valid: boolean
    error?: string
    suggestedDimensions?: { width: number; height: number; ratio: AspectRatio }
}

/**
 * Validate dimensions for GPT Image model.
 * Only specific dimension combinations are allowed.
 */
export function validateGPTImageDimensions(
    width: number,
    height: number
): GPTImageValidationResult {
    const validSize = GPTIMAGE_SUPPORTED_SIZES.find(
        (s) => s.width === width && s.height === height
    )

    if (!validSize) {
        return {
            valid: false,
            error: "GPT Image only supports 1024×1024, 1536×1024, or 1024×1536",
            suggestedDimensions: {
                width: GPTIMAGE_CONSTRAINTS.defaultDimensions.width,
                height: GPTIMAGE_CONSTRAINTS.defaultDimensions.height,
                ratio: "1:1" as AspectRatio,
            },
        }
    }

    return { valid: true }
}

/**
 * Find the nearest supported GPT Image size for the given aspect ratio.
 * Maps common aspect ratios to the closest GPT Image supported size.
 * 
 * @param currentRatio - The current aspect ratio
 * @param currentWidth - The current width (used to determine orientation for custom ratios)
 * @param currentHeight - The current height (used to determine orientation for custom ratios)
 * @returns The nearest supported GPT Image size with its ratio
 */
export function findNearestGPTImageSize(
    currentRatio: AspectRatio,
    currentWidth: number,
    currentHeight: number
): { width: number; height: number; ratio: AspectRatio } {
    // Direct mapping for supported ratios
    const supportedSize = GPTIMAGE_SUPPORTED_SIZES.find(
        (s) => s.ratio === currentRatio
    )
    if (supportedSize) {
        return { ...supportedSize }
    }

    // Map other ratios to nearest GPT Image size
    // Square-ish ratios (4:3, 5:4, 3:4, 4:5) → 1:1
    // Wide ratios (16:9, 21:9, 3:2) → 16:9
    // Tall ratios (9:16, 9:21, 2:3) → 9:16
    const ratioNumber = currentWidth / currentHeight

    if (ratioNumber > 1.4) {
        // Landscape wider than 4:3 → 16:9
        return { width: 1536, height: 1024, ratio: "16:9" }
    } else if (ratioNumber < 0.7) {
        // Portrait taller than 3:4 → 9:16
        return { width: 1024, height: 1536, ratio: "9:16" }
    } else {
        // Everything else → 1:1 (square)
        return { width: 1024, height: 1024, ratio: "1:1" }
    }
}

/**
 * Validate dimensions for GPT Image Large model.
 * Uses the same fixed sizes as GPT Image (HD variant).
 */
export function validateGPTImageLargeDimensions(
    width: number,
    height: number
): GPTImageValidationResult {
    const validSize = GPTIMAGE_LARGE_SUPPORTED_SIZES.find(
        (s) => s.width === width && s.height === height
    )

    if (!validSize) {
        return {
            valid: false,
            error: "GPT Image Large only supports 1024×1024, 1792×1024, or 1024×1792",
            suggestedDimensions: {
                width: GPTIMAGE_LARGE_CONSTRAINTS.defaultDimensions.width,
                height: GPTIMAGE_LARGE_CONSTRAINTS.defaultDimensions.height,
                ratio: "1:1" as AspectRatio,
            },
        }
    }

    return { valid: true }
}

export function findNearestGPTImageLargeSize(
    currentRatio: AspectRatio,
    currentWidth: number,
    currentHeight: number
): { width: number; height: number; ratio: AspectRatio } {
    // Direct mapping for supported ratios
    const supportedSize = GPTIMAGE_LARGE_SUPPORTED_SIZES.find(
        (s) => s.ratio === currentRatio
    )
    if (supportedSize) {
        return { ...supportedSize }
    }

    // Map other ratios to nearest GPT Image Large size
    const ratioNumber = currentWidth / currentHeight

    if (ratioNumber > 1.4) {
        // Landscape wider than 4:3 → 16:9
        return { width: 1792, height: 1024, ratio: "16:9" }
    } else if (ratioNumber < 0.7) {
        // Portrait taller than 3:4 → 9:16
        return { width: 1024, height: 1792, ratio: "9:16" }
    } else {
        // Everything else → 1:1 (square)
        return { width: 1024, height: 1024, ratio: "1:1" }
    }
}
