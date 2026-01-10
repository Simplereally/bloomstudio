/**
 * Standard Resolution Configuration
 *
 * Defines standard resolutions for each aspect ratio at each resolution tier.
 * These are industry-standard resolutions that are independent of model capabilities.
 * Model constraints only determine WHETHER a resolution is achievable, not WHAT it should be.
 */

import type { AspectRatio, ResolutionTier } from "@/types/pollinations"

// ============================================================================
// Types
// ============================================================================

export interface StandardDimensions {
    readonly width: number
    readonly height: number
}

export interface AspectRatioDefinition {
    readonly label: string
    readonly value: AspectRatio
    readonly icon: string
    readonly category: "square" | "landscape" | "portrait" | "ultrawide"
}

// ============================================================================
// Standard Aspect Ratio Definitions (no dimensions, just the ratios)
// ============================================================================

/**
 * All supported aspect ratios with their UI metadata.
 * Dimensions are NOT included here - they are calculated dynamically.
 */
export const ASPECT_RATIO_DEFINITIONS: Record<Exclude<AspectRatio, "custom">, AspectRatioDefinition> = {
    "1:1": { label: "Square", value: "1:1", icon: "square", category: "square" },
    "16:9": { label: "Landscape", value: "16:9", icon: "rectangle-horizontal", category: "landscape" },
    "9:16": { label: "Portrait", value: "9:16", icon: "rectangle-vertical", category: "portrait" },
    "4:3": { label: "Photo", value: "4:3", icon: "image", category: "landscape" },
    "3:4": { label: "Portrait Photo", value: "3:4", icon: "frame", category: "portrait" },
    "3:2": { label: "Photo Wide", value: "3:2", icon: "image", category: "landscape" },
    "2:3": { label: "Photo Tall", value: "2:3", icon: "frame", category: "portrait" },
    "4:5": { label: "Social", value: "4:5", icon: "smartphone", category: "portrait" },
    "5:4": { label: "Social Wide", value: "5:4", icon: "monitor", category: "landscape" },
    "21:9": { label: "Ultrawide", value: "21:9", icon: "monitor", category: "ultrawide" },
    "9:21": { label: "Ultra Tall", value: "9:21", icon: "smartphone", category: "ultrawide" },
} as const

/**
 * Custom aspect ratio definition for UI display.
 */
export const CUSTOM_ASPECT_RATIO: AspectRatioDefinition = {
    label: "Custom",
    value: "custom",
    icon: "sliders",
    category: "square",
}

// ============================================================================
// Standard Resolution Dimensions
// ============================================================================

/**
 * Standard dimensions for each aspect ratio at each resolution tier.
 * These represent industry-standard resolutions:
 * - SD: ~0.5 megapixels (720p equivalent)
 * - HD: ~1-2 megapixels (1080p equivalent)
 * - 2K: ~2-4 megapixels (1440p equivalent)
 * - 4K: ~8 megapixels (2160p equivalent)
 */
export const STANDARD_RESOLUTIONS: Record<
    ResolutionTier,
    Record<Exclude<AspectRatio, "custom">, StandardDimensions>
> = {
    sd: {
        "1:1": { width: 720, height: 720 },
        "16:9": { width: 960, height: 540 },
        "9:16": { width: 540, height: 960 },
        "4:3": { width: 832, height: 624 },
        "3:4": { width: 624, height: 832 },
        "3:2": { width: 864, height: 576 },
        "2:3": { width: 576, height: 864 },
        "4:5": { width: 640, height: 800 },
        "5:4": { width: 800, height: 640 },
        "21:9": { width: 1120, height: 480 },
        "9:21": { width: 480, height: 1120 },
    },
    hd: {
        "1:1": { width: 1024, height: 1024 },
        "16:9": { width: 1920, height: 1080 },
        "9:16": { width: 1080, height: 1920 },
        "4:3": { width: 1440, height: 1080 },
        "3:4": { width: 1080, height: 1440 },
        "3:2": { width: 1620, height: 1080 },
        "2:3": { width: 1080, height: 1620 },
        "4:5": { width: 1080, height: 1350 },
        "5:4": { width: 1350, height: 1080 },
        "21:9": { width: 2560, height: 1080 },
        "9:21": { width: 1080, height: 2560 },
    },
    "2k": {
        "1:1": { width: 1440, height: 1440 },
        "16:9": { width: 2560, height: 1440 },
        "9:16": { width: 1440, height: 2560 },
        "4:3": { width: 1920, height: 1440 },
        "3:4": { width: 1440, height: 1920 },
        "3:2": { width: 2160, height: 1440 },
        "2:3": { width: 1440, height: 2160 },
        "4:5": { width: 1440, height: 1800 },
        "5:4": { width: 1800, height: 1440 },
        "21:9": { width: 3360, height: 1440 },
        "9:21": { width: 1440, height: 3360 },
    },
    "4k": {
        "1:1": { width: 2880, height: 2880 },
        "16:9": { width: 3840, height: 2160 },
        "9:16": { width: 2160, height: 3840 },
        "4:3": { width: 2880, height: 2160 },
        "3:4": { width: 2160, height: 2880 },
        "3:2": { width: 3240, height: 2160 },
        "2:3": { width: 2160, height: 3240 },
        "4:5": { width: 2160, height: 2700 },
        "5:4": { width: 2700, height: 2160 },
        "21:9": { width: 5040, height: 2160 },
        "9:21": { width: 2160, height: 5040 },
    },
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get standard dimensions for an aspect ratio at a specific resolution tier.
 * Returns null for custom aspect ratio.
 */
export function getStandardDimensions(
    aspectRatio: AspectRatio,
    tier: ResolutionTier
): StandardDimensions | null {
    if (aspectRatio === "custom") return null

    return STANDARD_RESOLUTIONS[tier][aspectRatio] ?? null
}

/**
 * Get the aspect ratio definition for a given ratio value.
 */
export function getAspectRatioDefinition(ratio: AspectRatio): AspectRatioDefinition {
    if (ratio === "custom") return CUSTOM_ASPECT_RATIO
    return ASPECT_RATIO_DEFINITIONS[ratio]
}

/**
 * Get all aspect ratio definitions as an array (for iteration).
 */
export function getAllAspectRatioDefinitions(): AspectRatioDefinition[] {
    return [...Object.values(ASPECT_RATIO_DEFINITIONS), CUSTOM_ASPECT_RATIO]
}

/**
 * Get standard dimensions, with fallback for unsupported combinations.
 */
export function getStandardDimensionsWithFallback(
    aspectRatio: AspectRatio,
    tier: ResolutionTier
): StandardDimensions {
    if (aspectRatio === "custom") {
        // Default custom dimensions - 1024x1024
        return { width: 1024, height: 1024 }
    }

    return STANDARD_RESOLUTIONS[tier][aspectRatio]
}
