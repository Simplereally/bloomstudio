/**
 * Model Type Definitions
 *
 * Types and interfaces for the model registry system.
 */

import type { AspectRatio, AspectRatioOption, ModelConstraints } from "@/types/pollinations";
import type { ModelPricingDefinition } from "../schemas/pollinations-pricing.schema";

// ============================================================================
// Types
// ============================================================================

/** Model type - image generation or video generation */
export type ModelType = "image" | "video";

/** Duration constraints for video models */
export interface VideoDurationConstraints {
  /** Minimum duration in seconds */
  readonly min: number
  /** Maximum duration in seconds */
  readonly max: number
  /** Fixed duration options (if not provided, any value in range is allowed) */
  readonly fixedOptions?: readonly number[]
  /** Default duration in seconds */
  readonly defaultDuration: number
}

/** Complete model definition with all configuration */
export interface ModelDefinition {
  /** API ID - used in API requests to Pollinations */
  readonly id: string;
  /** Human-readable display name for UI */
  readonly displayName: string;
  /** Model type (image or video) */
  readonly type: ModelType;
  /** Dimension and pixel constraints */
  readonly constraints: ModelConstraints;
  /** Available aspect ratio presets */
  readonly aspectRatios: readonly AspectRatioOption[];
  /** Icon name for UI (lucide icon) */
  readonly icon: string;
  /** Logo SVG path for UI (optional) */
  readonly logo?: string;
  /** Description for tooltips */
  readonly description: string;
  /** Whether this model supports negative prompts */
  readonly supportsNegativePrompt: boolean;
  /** Whether this model supports audio generation (video models only) */
  readonly supportsAudio?: boolean
  /** Duration constraints for video models */
  readonly durationConstraints?: VideoDurationConstraints
  /** Whether this model supports reference image interpolation (first/last frame) */
  readonly supportsInterpolation?: boolean
  /** Whether this model supports image-to-image generation (reference image) */
  readonly supportsReferenceImage?: boolean
  /** The pricing definition for this model */
  readonly modelPricing: ModelPricingDefinition
}

// ============================================================================
// Internal Helpers
// ============================================================================

/** Tags for aspect ratio UI display */
export const ASPECT_RATIO_TAGS: Readonly<Record<AspectRatio, readonly string[]>> = {
  "1:1": ["Instagram Post", "Profile Picture", "Album / Cover Art"],
  "16:9": ["YouTube", "Widescreen Video", "Desktop Wallpaper"],
  "9:16": ["Instagram", "TikTok", "YouTube Shorts"],
  "4:3": ["Product Photos", "Presentation Slides", "Blog Images"],
  "3:4": ["Portrait Photography", "Instagram Feed", "Posters"],
  "3:2": ["DSLR Photos", "Web Hero", "Prints"],
  "2:3": ["Pinterest Pins", "Portrait Photography", "Posters"],
  "4:5": ["Instagram Feed", "Ads", "Product Posts"],
  "5:4": ["Product Shots", "Facebook", "Blog / Newsletter"],
  "21:9": ["Ultrawide Wallpaper", "Cinematic Scenes", "Stream Overlays"],
  "9:21": ["Mobile Wallpaper", "Vertical Posters", "Tall Story Templates"],
  custom: ["Exact Dimensions"],
};

/** Helper to add tags to aspect ratio options */
export function withAspectRatioTags(ratio: AspectRatioOption): AspectRatioOption {
  return { ...ratio, tags: ASPECT_RATIO_TAGS[ratio.value] };
}
