/**
 * Pollinations Types
 *
 * Re-exports all types from the Zod schema file for convenience.
 * UI-specific types that don't need runtime validation are defined here.
 */

// Re-export everything from the schema file
export * from "@/lib/schemas/pollinations.schema"

// UI-specific types that don't need runtime validation

/**
 * Extended aspect ratio type to support model-specific presets.
 * Union includes all standard ratios plus any model-specific additions.
 */
export type AspectRatio =
  | "1:1"
  | "16:9"
  | "9:16"
  | "4:3"
  | "3:4"
  | "3:2"
  | "2:3"
  | "4:5"
  | "5:4"
  | "21:9"
  | "9:21"
  | "custom"

// ============================================================================
// Resolution Tier System
// ============================================================================

/**
 * Resolution tier for aspect ratio presets.
 * Each tier represents a target megapixel range for image generation.
 */
export type ResolutionTier = "sd" | "hd" | "2k" | "4k"

/**
 * Configuration for a resolution tier.
 */
export interface ResolutionTierConfig {
  /** Target megapixels for this tier */
  readonly targetMegapixels: number
  /** Human-readable label */
  readonly label: string
  /** Short label for compact UI */
  readonly shortLabel: string
  /** Approximate description for tooltips */
  readonly description: string
}

/**
 * Output certainty level for a model.
 * Indicates how reliably the model will produce the requested dimensions.
 */
export type OutputCertainty = "exact" | "likely" | "variable"

/**
 * Model constraints configuration.
 * Each model can define its own pixel limits and UI behavior.
 */
export interface ModelConstraints {
  /** Maximum total pixels allowed (width × height must be <= this value) */
  readonly maxPixels: number
  /** Minimum total pixels required (width × height must be >= this value) */
  readonly minPixels: number
  /** Minimum dimension for width or height */
  readonly minDimension: number
  /** Maximum dimension for a single axis */
  readonly maxDimension: number
  /** Step size for UI sliders (should align with model's optimal values) */
  readonly step: number
  /** Default dimensions when this model is selected */
  readonly defaultDimensions: { readonly width: number; readonly height: number }
  /** Whether dimension controls are enabled for this model */
  readonly dimensionsEnabled: boolean
  /** Maximum seed value for this model (optional - defaults to API_CONSTRAINTS.seed.max) */
  readonly maxSeed?: number
  /** Maximum aspect ratio allowed (max(w/h, h/w) must be <= this value) (optional) */
  readonly maxAspectRatio?: number
  /** Supported resolution tiers for this model */
  readonly supportedTiers?: readonly ResolutionTier[]
  /** How reliably the model produces requested dimensions */
  readonly outputCertainty?: OutputCertainty
  /** Warning message to display for dimension-related expectations */
  readonly dimensionWarning?: string
}

/**
 * Aspect ratio option extended with optional category for UI grouping.
 */
export interface AspectRatioOption {
  readonly label: string
  readonly value: AspectRatio
  readonly width: number
  readonly height: number
  readonly icon: string
  readonly category?: "square" | "landscape" | "portrait" | "ultrawide"
  readonly tags?: readonly string[]
}
