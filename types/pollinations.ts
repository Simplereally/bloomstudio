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
}
