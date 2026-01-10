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
 *
 * RESOLUTION MODEL: "Shorter Edge" (Video Standard)
 * ─────────────────────────────────────────────────
 * Each tier is defined by its VERTICAL resolution (the shorter edge in landscape):
 *   - SD:  720 (from 720p)
 *   - HD:  1080 (from 1080p Full HD)
 *   - 2K:  1440 (from 1440p QHD)
 *   - 4K:  2160 (from 2160p UHD)
 *
 * For any aspect ratio, the SHORTER dimension equals the tier's reference value.
 * This matches how video resolutions are named (1080p = 1080 vertical lines).
 *
 * Examples:
 *   - HD 16:9 = 1920×1080 (shorter edge 1080 ✓)
 *   - HD 1:1  = 1080×1080 (both edges 1080 ✓)
 *   - 4K 1:1  = 2160×2160 (both edges 2160 ✓)
 *   - 4K 9:16 = 2160×3840 (shorter edge 2160 ✓)
 */
export const STANDARD_RESOLUTIONS: Record<
    ResolutionTier,
    Record<Exclude<AspectRatio, "custom">, StandardDimensions>
> = {
    // ──────────────────────────────────────────────────────────────────────────
    // SD: 720p reference (shorter edge = 720)
    // ──────────────────────────────────────────────────────────────────────────
    sd: {
        "1:1": { width: 720, height: 720 },
        "16:9": { width: 1280, height: 720 },
        "9:16": { width: 720, height: 1280 },
        "4:3": { width: 960, height: 720 },
        "3:4": { width: 720, height: 960 },
        "3:2": { width: 1080, height: 720 },
        "2:3": { width: 720, height: 1080 },
        "4:5": { width: 720, height: 900 },
        "5:4": { width: 900, height: 720 },
        "21:9": { width: 1680, height: 720 },
        "9:21": { width: 720, height: 1680 },
    },
    // ──────────────────────────────────────────────────────────────────────────
    // HD: 1080p reference (shorter edge = 1080)
    // ──────────────────────────────────────────────────────────────────────────
    hd: {
        "1:1": { width: 1080, height: 1080 },
        "16:9": { width: 1920, height: 1080 },
        "9:16": { width: 1080, height: 1920 },
        "4:3": { width: 1440, height: 1080 },
        "3:4": { width: 1080, height: 1440 },
        "3:2": { width: 1620, height: 1080 },
        "2:3": { width: 1080, height: 1620 },
        "4:5": { width: 1080, height: 1350 },
        "5:4": { width: 1350, height: 1080 },
        "21:9": { width: 2520, height: 1080 },
        "9:21": { width: 1080, height: 2520 },
    },
    // ──────────────────────────────────────────────────────────────────────────
    // 2K: 1440p reference (shorter edge = 1440)
    // ──────────────────────────────────────────────────────────────────────────
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
    // ──────────────────────────────────────────────────────────────────────────
    // 4K: 2160p reference (shorter edge = 2160)
    // ──────────────────────────────────────────────────────────────────────────
    "4k": {
        "1:1": { width: 2160, height: 2160 },
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
