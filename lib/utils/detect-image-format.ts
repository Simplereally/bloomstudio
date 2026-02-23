/**
 * Image Format Detection Utilities
 *
 * Detects aspect ratio and resolution tier from image dimensions.
 * Uses STANDARD_RESOLUTIONS for accurate tier detection rather than
 * megapixel thresholds (which can misclassify non-standard dimensions).
 */

import {
	RESOLUTION_TIER_ORDER,
	RESOLUTION_TIERS,
} from "@/lib/config/resolution-tiers";
import {
	STANDARD_RESOLUTIONS,
	type StandardDimensions,
} from "@/lib/config/standard-resolutions";
import type { AspectRatio, ResolutionTier } from "@/types/pollinations";

// ============================================================================
// Constants
// ============================================================================

/**
 * Tolerance for aspect ratio matching (2% allows for rounding differences)
 */
const RATIO_TOLERANCE = 0.02;

/**
 * Tolerance for dimension matching when detecting tier (5% allows for minor variations)
 */
const DIMENSION_TOLERANCE = 0.05;

/**
 * All standard aspect ratios with their numeric values
 */
const ASPECT_RATIO_VALUES: readonly {
	ratio: Exclude<AspectRatio, "custom">;
	value: number;
}[] = [
	{ ratio: "1:1", value: 1 },
	{ ratio: "16:9", value: 16 / 9 },
	{ ratio: "9:16", value: 9 / 16 },
	{ ratio: "4:3", value: 4 / 3 },
	{ ratio: "3:4", value: 3 / 4 },
	{ ratio: "3:2", value: 3 / 2 },
	{ ratio: "2:3", value: 2 / 3 },
	{ ratio: "4:5", value: 4 / 5 },
	{ ratio: "5:4", value: 5 / 4 },
	{ ratio: "21:9", value: 21 / 9 },
	{ ratio: "9:21", value: 9 / 21 },
] as const;

// ============================================================================
// Aspect Ratio Detection
// ============================================================================

/**
 * Detect the closest matching aspect ratio from image dimensions.
 * Uses a tolerance to handle rounding differences in generated images.
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns The matching AspectRatio or "custom" if no match within tolerance
 */
export function detectAspectRatio(width: number, height: number): AspectRatio {
	if (width <= 0 || height <= 0) {
		return "custom";
	}

	const actualRatio = width / height;

	for (const { ratio, value } of ASPECT_RATIO_VALUES) {
		const difference = Math.abs(actualRatio - value) / value;
		if (difference <= RATIO_TOLERANCE) {
			return ratio;
		}
	}

	return "custom";
}

// ============================================================================
// Resolution Tier Detection
// ============================================================================

/**
 * Detect the resolution tier by matching dimensions against STANDARD_RESOLUTIONS.
 * This is more accurate than using megapixel thresholds because it accounts
 * for the actual standard dimensions at each tier.
 *
 * For example, HD 1:1 is 1536×1536 (~2.36MP), which would incorrectly be
 * detected as 2K using MP thresholds. By matching against standard dimensions,
 * we correctly identify it as HD.
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param aspectRatio - The detected or known aspect ratio (optional, will detect if not provided)
 * @returns The matching ResolutionTier
 */
export function detectResolutionTier(
	width: number,
	height: number,
	aspectRatio?: AspectRatio,
): ResolutionTier {
	if (width <= 0 || height <= 0) {
		return "hd"; // Default fallback
	}

	const ratio = aspectRatio ?? detectAspectRatio(width, height);

	// For custom ratios, fall back to megapixel-based detection
	if (ratio === "custom") {
		return detectTierByMegapixels(width, height);
	}

	// Find the closest matching tier by comparing to standard dimensions
	let bestMatch: { tier: ResolutionTier; score: number } | null = null;

	for (const tier of RESOLUTION_TIER_ORDER) {
		const standardDims = STANDARD_RESOLUTIONS[tier][ratio];
		if (!standardDims) continue;

		// Calculate how close the dimensions are to the standard
		const widthDiff = Math.abs(width - standardDims.width) / standardDims.width;
		const heightDiff =
			Math.abs(height - standardDims.height) / standardDims.height;
		const score = (widthDiff + heightDiff) / 2;

		// Check if within tolerance and is the best match so far
		if (score <= DIMENSION_TOLERANCE) {
			if (!bestMatch || score < bestMatch.score) {
				bestMatch = { tier, score };
			}
		}
	}

	// If we found a match within tolerance, return it
	if (bestMatch) {
		return bestMatch.tier;
	}

	// Otherwise, find the closest tier by dimension proximity
	return findClosestTierByDimensions(width, height, ratio);
}

/**
 * Fallback tier detection using megapixel thresholds.
 * Used for custom aspect ratios where we can't match against standard dimensions.
 */
function detectTierByMegapixels(width: number, height: number): ResolutionTier {
	const megapixels = (width * height) / 1_000_000;

	// Use midpoints between tier target megapixels as thresholds
	if (megapixels <= 0.75) return "sd"; // SD target: 0.5MP
	if (megapixels <= 1.5) return "hd"; // HD target: 1.0MP
	if (megapixels <= 5.0) return "2k"; // 2K target: 2.0MP
	return "4k"; // 4K target: 8.3MP
}

/**
 * Find the closest tier by comparing to standard dimensions for the given ratio.
 * Used when no tier matches within tolerance.
 */
function findClosestTierByDimensions(
	width: number,
	height: number,
	ratio: Exclude<AspectRatio, "custom">,
): ResolutionTier {
	let closestTier: ResolutionTier = "hd";
	let closestDistance = Infinity;

	for (const tier of RESOLUTION_TIER_ORDER) {
		const standardDims = STANDARD_RESOLUTIONS[tier][ratio];
		if (!standardDims) continue;

		// Use Euclidean distance for comparison
		const distance = Math.sqrt(
			(width - standardDims.width) ** 2 + (height - standardDims.height) ** 2,
		);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestTier = tier;
		}
	}

	return closestTier;
}

// ============================================================================
// Combined Detection
// ============================================================================

/**
 * Complete image format info detected from dimensions
 */
export interface ImageFormatInfo {
	/** Detected aspect ratio */
	aspectRatio: AspectRatio;
	/** Detected resolution tier */
	resolutionTier: ResolutionTier;
	/** Original dimensions */
	width: number;
	height: number;
	/** Megapixels */
	megapixels: number;
	/** Tier display label */
	tierLabel: string;
}

/**
 * Detect complete image format information from dimensions.
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Complete format info including ratio, tier, and labels
 */
export function detectImageFormat(
	width: number,
	height: number,
): ImageFormatInfo {
	const aspectRatio = detectAspectRatio(width, height);
	const resolutionTier = detectResolutionTier(width, height, aspectRatio);

	return {
		aspectRatio,
		resolutionTier,
		width,
		height,
		megapixels: (width * height) / 1_000_000,
		tierLabel: RESOLUTION_TIERS[resolutionTier].shortLabel,
	};
}

/**
 * Get dimensions for a specific aspect ratio and tier from standard resolutions.
 * Falls back to the provided dimensions if ratio is custom.
 */
export function getStandardDimensionsForFormat(
	aspectRatio: AspectRatio,
	tier: ResolutionTier,
	fallbackWidth = 1024,
	fallbackHeight = 1024,
): StandardDimensions {
	if (aspectRatio === "custom") {
		return { width: fallbackWidth, height: fallbackHeight };
	}

	return STANDARD_RESOLUTIONS[tier][aspectRatio];
}

/**
 * Format dimensions for display (e.g., "1920×1080")
 */
export function formatDimensions(width: number, height: number): string {
	return `${width}×${height}`;
}

/**
 * Format complete format info as a string (e.g., "16:9 · HD · 1920×1080")
 */
export function formatImageFormatInfo(info: ImageFormatInfo): string {
	const ratioDisplay =
		info.aspectRatio === "custom" ? "Custom" : info.aspectRatio;
	return `${ratioDisplay} · ${info.tierLabel} · ${formatDimensions(info.width, info.height)}`;
}
