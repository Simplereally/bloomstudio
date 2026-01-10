/**
 * Resolution Tier Configuration
 *
 * Centralized configuration for resolution tiers used in the aspect ratio
 * and dimension selection system. Based on research document recommendations.
 */

import type {
    ModelConstraints,
    ResolutionTier,
    ResolutionTierConfig,
} from "@/types/pollinations"

// ============================================================================
// Resolution Tier Definitions
// ============================================================================

/**
 * Resolution tier configuration with target megapixels and labels.
 * These values are used to calculate dimensions for each aspect ratio.
 */
export const RESOLUTION_TIERS: Record<ResolutionTier, ResolutionTierConfig> = {
    sd: {
        targetMegapixels: 0.5,
        label: "Standard",
        shortLabel: "SD",
        description: "~720p equivalent, fastest generation",
    },
    hd: {
        targetMegapixels: 1.0,
        label: "HD",
        shortLabel: "HD",
        description: "~1080p equivalent, good quality/speed balance",
    },
    "2k": {
        targetMegapixels: 2.0,
        label: "2K",
        shortLabel: "2K",
        description: "~1440p equivalent, high quality",
    },
    "4k": {
        targetMegapixels: 8.3,
        label: "4K UHD",
        shortLabel: "4K",
        description: "~3840×2160 equivalent, maximum quality",
    },
} as const

/**
 * Ordered list of resolution tiers from lowest to highest.
 */
export const RESOLUTION_TIER_ORDER: readonly ResolutionTier[] = [
    "sd",
    "hd",
    "2k",
    "4k",
] as const

// ============================================================================
// Dimension Calculation Utilities
// ============================================================================

export interface AspectRatioParts {
    widthRatio: number
    heightRatio: number
}

/**
 * Parse an aspect ratio string (e.g., "16:9") into numeric parts.
 */
export function parseAspectRatio(ratio: string): AspectRatioParts | null {
    const parts = ratio.split(":")
    if (parts.length !== 2) return null

    const widthRatio = parseInt(parts[0], 10)
    const heightRatio = parseInt(parts[1], 10)

    if (isNaN(widthRatio) || isNaN(heightRatio)) return null
    if (widthRatio <= 0 || heightRatio <= 0) return null

    return { widthRatio, heightRatio }
}

/**
 * Calculate dimensions for a given aspect ratio and resolution tier,
 * respecting model constraints.
 */
export function calculateDimensionsForTier(
    ratio: AspectRatioParts,
    tier: ResolutionTier,
    constraints: ModelConstraints
): { width: number; height: number } {
    const tierConfig = RESOLUTION_TIERS[tier]
    const aspectRatio = ratio.widthRatio / ratio.heightRatio

    // Determine target pixels based on tier, capped at model's max
    const targetPixels = Math.min(tierConfig.targetMegapixels * 1_000_000, constraints.maxPixels)

    // Calculate base dimensions from target pixels
    // height = sqrt(pixels / aspectRatio), width = height * aspectRatio
    let height = Math.sqrt(targetPixels / aspectRatio)
    let width = height * aspectRatio

    // Apply dimension constraints
    if (width > constraints.maxDimension) {
        width = constraints.maxDimension
        height = width / aspectRatio
    }
    if (height > constraints.maxDimension) {
        height = constraints.maxDimension
        width = height * aspectRatio
    }

    // Ensure minimum dimensions
    if (width < constraints.minDimension) {
        width = constraints.minDimension
        height = width / aspectRatio
    }
    if (height < constraints.minDimension) {
        height = constraints.minDimension
        width = height * aspectRatio
    }

    // Align to step size
    width = Math.round(width / constraints.step) * constraints.step
    height = Math.round(height / constraints.step) * constraints.step

    // Final clamp to ensure we don't exceed limits after rounding
    width = Math.max(constraints.minDimension, Math.min(constraints.maxDimension, width))
    height = Math.max(constraints.minDimension, Math.min(constraints.maxDimension, height))

    return { width, height }
}

/**
 * Get the dimensions for a specific aspect ratio string and tier.
 */
export function getDimensionsForRatioAndTier(
    ratioString: string,
    tier: ResolutionTier,
    constraints: ModelConstraints
): { width: number; height: number } | null {
    const ratio = parseAspectRatio(ratioString)
    if (!ratio) return null

    return calculateDimensionsForTier(ratio, tier, constraints)
}

/**
 * Determine which resolution tier best matches the given pixel count.
 */
export function getTierForPixelCount(pixels: number): ResolutionTier {
    const megapixels = pixels / 1_000_000

    if (megapixels <= 0.75) return "sd"
    if (megapixels <= 1.5) return "hd"
    if (megapixels <= 5.0) return "2k"
    return "4k"
}

/**
 * Get supported tiers for a model, with fallback based on maxPixels.
 */
export function getSupportedTiersForModel(
    constraints: ModelConstraints
): readonly ResolutionTier[] {
    // If explicitly defined, use that
    if (constraints.supportedTiers && constraints.supportedTiers.length > 0) {
        return constraints.supportedTiers
    }

    // Otherwise, infer from maxPixels
    const tiers: ResolutionTier[] = []
    const maxMp = constraints.maxPixels / 1_000_000

    if (maxMp >= 0.5) tiers.push("sd")
    if (maxMp >= 1.0) tiers.push("hd")
    if (maxMp >= 2.0) tiers.push("2k")
    if (maxMp >= 8.0) tiers.push("4k")

    return tiers.length > 0 ? tiers : ["hd"] // Default to HD if nothing else
}

/**
 * Check if a specific tier is supported by the model.
 */
export function isTierSupportedByModel(
    tier: ResolutionTier,
    constraints: ModelConstraints
): boolean {
    const supportedTiers = getSupportedTiersForModel(constraints)
    return supportedTiers.includes(tier)
}

/**
 * Get the highest supported tier for a model.
 */
export function getMaxTierForModel(constraints: ModelConstraints): ResolutionTier {
    const supportedTiers = getSupportedTiersForModel(constraints)
    // Return the last (highest) tier in the supported list
    return supportedTiers[supportedTiers.length - 1] ?? "hd"
}

/**
 * Get the default tier for a model based on its constraints.
 */
export function getDefaultTierForModel(constraints: ModelConstraints): ResolutionTier {
    const supportedTiers = getSupportedTiersForModel(constraints)

    // Prefer HD if available, otherwise use the first supported tier
    if (supportedTiers.includes("hd")) return "hd"
    return supportedTiers[0] ?? "hd"
}

/**
 * Format megapixels for display.
 */
export function formatMegapixels(pixels: number): string {
    const mp = pixels / 1_000_000
    if (mp >= 1) {
        return `${mp.toFixed(1)} MP`
    }
    return `${(mp * 1000).toFixed(0)} KP`
}

/**
 * Format dimensions for display (e.g., "1920 × 1080").
 */
export function formatDimensions(width: number, height: number): string {
    return `${width} × ${height}`
}

/**
 * Calculate pixel budget percentage.
 */
export function calculatePixelBudgetPercent(
    currentPixels: number,
    maxPixels: number
): number {
    if (maxPixels === Infinity || maxPixels <= 0) return 0
    return Math.min(100, (currentPixels / maxPixels) * 100)
}
