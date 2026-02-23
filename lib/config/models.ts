/**
 * Unified Model Registry
 *
 * Single source of truth for all model definitions.
 * Each model is defined with its ID, display name, type, constraints, and aspect ratios.
 */

import type { AspectRatio, AspectRatioOption, ModelConstraints } from "@/types/pollinations";
import { STANDARD_RESOLUTIONS } from "./standard-resolutions";
import {
  IMAGE_MODEL_PRICING,
  VIDEO_MODEL_PRICING,
  type ModelPricingDefinition,
} from "../schemas/pollinations-pricing.schema";

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
  /**
   * Whether this model is legacy (no longer available for new generation).
   * Legacy models still exist in MODEL_REGISTRY for display name lookup,
   * constraints, and historical data, but are excluded from generation selectors.
   * @default false
   */
  readonly isLegacy?: boolean
}

// ============================================================================
// Shared Aspect Ratio Presets
// ============================================================================

const ASPECT_RATIO_TAGS: Readonly<Record<AspectRatio, readonly string[]>> = {
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

function withAspectRatioTags(ratio: AspectRatioOption): AspectRatioOption {
  return { ...ratio, tags: ASPECT_RATIO_TAGS[ratio.value] };
}

/**
 * Flux Schnell aspect ratios - Optimized for 768px max dimension
 *
 * Pollinations enforces:
 * - max 589,824 pixels (768×768 cap)
 * - width/height must be multiples of 8
 * - (width × height) must be divisible by 65,536
 *
 * | Ratio | Width | Height | Pixels    |
 * |-------|-------|--------|-----------|
 * | 1:1   | 768   | 768    | 589,824   |
 * | 16:9  | 768   | 432    | 331,776   |
 * | 9:16  | 432   | 768    | 331,776   |
 * | 4:3   | 768   | 576    | 442,368   |
 * | 3:4   | 576   | 768    | 442,368   |
 * | 3:2   | 768   | 512    | 393,216   |
 * | 2:3   | 512   | 768    | 393,216   |
 * | 21:9  | 768   | 328    | 251,904   |
 * | 9:21  | 328   | 768    | 251,904   |
 */
const FLUX_SCHNELL_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 768, height: 768, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 768, height: 432, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 432, height: 768, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 768, height: 576, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 576, height: 768, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 768, height: 512, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 512, height: 768, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 768, height: 328, icon: "monitor", category: "ultrawide" },
    { label: "Ultra Tall", value: "9:21", width: 328, height: 768, icon: "smartphone", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 768, height: 768, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** Standard aspect ratios for ~1MP models (NanoBanana, Kontext) - Optimized for <1MP limit */
const STANDARD_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
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
    { label: "Custom", value: "custom", width: 1024, height: 1024, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** SDXL Turbo-optimized aspect ratios (768px max dimension) */
const SDXLTURBO_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 768, height: 768, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 768, height: 432, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 432, height: 768, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 768, height: 576, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 576, height: 768, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 768, height: 320, icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 768, height: 768, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** GPT 1.0 fixed aspect ratios (no custom allowed) */
const GPTIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1536, height: 1024, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1024, height: 1536, icon: "rectangle-vertical", category: "portrait" },
  ] as const
).map(withAspectRatioTags);

/** GPT 1.5 fixed aspect ratios (no custom allowed) */
const GPTIMAGE_LARGE_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1792, height: 1024, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1024, height: 1792, icon: "rectangle-vertical", category: "portrait" },
  ] as const
).map(withAspectRatioTags);

/**
 * Z-Image Turbo aspect ratios - Uses HD standard dimensions within SPAN upscaler limit
 *
 * Pollinations enforces a max of 2,359,296 pixels (768×768 base × 2 upscale = 1536×1536 max square).
 * Uses HD standard resolutions where possible, with ultrawide ratios optimized for pixel budget.
 * All dimensions are aligned to step=8.
 *
 * | Ratio | Width | Height | Pixels    |
 * |-------|-------|--------|-----------|
 * | 1:1   | 1536  | 1536   | 2,359,296 | (max MP cap)
 * | 16:9  | 1920  | 1080   | 2,073,600 | (HD standard)
 * | 9:16  | 1080  | 1920   | 2,073,600 | (HD standard)
 * | 4:3   | 1440  | 1080   | 1,555,200 | (HD standard)
 * | 3:4   | 1080  | 1440   | 1,555,200 | (HD standard)
 * | 3:2   | 1624  | 1080   | 1,753,920 | (step=8 aligned)
 * | 2:3   | 1080  | 1624   | 1,753,920 | (step=8 aligned)
 * | 4:5   | 1080  | 1352   | 1,460,160 | (step=8 aligned)
 * | 5:4   | 1352  | 1080   | 1,460,160 | (step=8 aligned)
 * | 21:9  | 2240  | 960    | 2,150,400 | (optimized for pixel budget)
 * | 9:21  | 960   | 2240   | 2,150,400 | (optimized for pixel budget)
 */
const ZIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1536, height: 1536, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1920, height: 1080, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1080, height: 1920, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 1440, height: 1080, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 1080, height: 1440, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 1624, height: 1080, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 1080, height: 1624, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 1080, height: 1352, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 1352, height: 1080, icon: "monitor", category: "landscape" },
    { label: "Ultrawide", value: "21:9", width: 2240, height: 960, icon: "monitor", category: "ultrawide" },
    { label: "Ultra Tall", value: "9:21", width: 960, height: 2240, icon: "smartphone", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 1536, height: 1536, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** Seedream aspect ratios (defaults to 4K Tier) */
const SEEDREAM_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { ...STANDARD_RESOLUTIONS["4k"]["1:1"], label: "Square", value: "1:1", icon: "square", category: "square" },
    { ...STANDARD_RESOLUTIONS["4k"]["16:9"], label: "Landscape", value: "16:9", icon: "rectangle-horizontal", category: "landscape" },
    { ...STANDARD_RESOLUTIONS["4k"]["9:16"], label: "Portrait", value: "9:16", icon: "rectangle-vertical", category: "portrait" },
    { ...STANDARD_RESOLUTIONS["4k"]["4:3"], label: "Photo", value: "4:3", icon: "image", category: "landscape" },
    { ...STANDARD_RESOLUTIONS["4k"]["3:4"], label: "Portrait Photo", value: "3:4", icon: "frame", category: "portrait" },
    { ...STANDARD_RESOLUTIONS["4k"]["3:2"], label: "Photo Wide", value: "3:2", icon: "image", category: "landscape" },
    { ...STANDARD_RESOLUTIONS["4k"]["2:3"], label: "Photo Tall", value: "2:3", icon: "frame", category: "portrait" },
    { ...STANDARD_RESOLUTIONS["4k"]["21:9"], label: "Ultrawide", value: "21:9", icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 1024, height: 1024, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/** Video aspect ratios (16:9 and 9:16 only) - defaults to HD */
const VIDEO_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { ...STANDARD_RESOLUTIONS.hd["16:9"], label: "Landscape", value: "16:9", icon: "rectangle-horizontal", category: "landscape" },
    { ...STANDARD_RESOLUTIONS.hd["9:16"], label: "Portrait", value: "9:16", icon: "rectangle-vertical", category: "portrait" },
  ] as const
).map(withAspectRatioTags);

/**
 * Nano Banana aspect ratios - Fixed output dimensions per aspect ratio (no tiers)
 *
 * Gemini 2.5 Flash Image has fixed output resolutions per aspect ratio:
 * - Supported ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
 * - NO 9:21 (ultra tall) support
 * - Max dimension: 1536px (long edge)
 * - Max pixels: ~1.05 MP (1024×1024 = 1,048,576)
 *
 * | Ratio | Width | Height | Pixels    |
 * |-------|-------|--------|-----------|
 * | 1:1   | 1024  | 1024   | 1,048,576 |
 * | 16:9  | 1344  | 768    | 1,032,192 |
 * | 9:16  | 768   | 1344   | 1,032,192 |
 * | 4:3   | 1184  | 864    | 1,023,296 |
 * | 3:4   | 864   | 1184   | 1,023,296 |
 * | 3:2   | 1248  | 832    | 1,038,336 |
 * | 2:3   | 832   | 1248   | 1,038,336 |
 * | 4:5   | 896   | 1152   | 1,032,192 |
 * | 5:4   | 1152  | 896    | 1,032,192 |
 * | 21:9  | 1536  | 672    | 1,032,192 |
 */
const NANOBANANA_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1344, height: 768, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 768, height: 1344, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 1184, height: 864, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 864, height: 1184, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 1248, height: 832, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 832, height: 1248, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 896, height: 1152, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 1152, height: 896, icon: "monitor", category: "landscape" },
    { label: "Ultrawide", value: "21:9", width: 1536, height: 672, icon: "monitor", category: "ultrawide" },
  ] as const
).map(withAspectRatioTags);

/**
 * FLUX.2 Klein aspect ratios - Optimized for 4MP pixel budget
 *
 * BFL enforces:
 * - max 4,000,000 pixels (4 MP) per image
 * - width/height must be multiples of 16
 * - minimum 64×64
 * - step-distilled: fixed 4 inference steps (not user-adjustable)
 *
 * | Ratio | Width | Height | Pixels    |
 * |-------|-------|--------|-----------|
 * | 1:1   | 1984  | 1984   | 3,936,256 |
 * | 16:9  | 2560  | 1440   | 3,686,400 |
 * | 9:16  | 1440  | 2560   | 3,686,400 |
 * | 4:3   | 2304  | 1728   | 3,981,312 |
 * | 3:4   | 1728  | 2304   | 3,981,312 |
 * | 3:2   | 2432  | 1600   | 3,891,200 |
 * | 2:3   | 1600  | 2432   | 3,891,200 |
 * | 4:5   | 1776  | 2224   | 3,950,624 |
 * | 5:4   | 2224  | 1776   | 3,949,824 |
 * | 21:9  | 2912  | 1248   | 3,634,176 |
 * | 9:21  | 1248  | 2912   | 3,634,176 |
 */
const FLUX_KLEIN_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1984, height: 1984, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 2560, height: 1440, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1440, height: 2560, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 2304, height: 1728, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 1728, height: 2304, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 2432, height: 1600, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 1600, height: 2432, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 1776, height: 2224, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 2224, height: 1776, icon: "monitor", category: "landscape" },
    { label: "Ultrawide", value: "21:9", width: 2912, height: 1248, icon: "monitor", category: "ultrawide" },
    { label: "Ultra Tall", value: "9:21", width: 1248, height: 2912, icon: "smartphone", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 1024, height: 1024, icon: "sliders", category: "square" },
  ] as const
).map(withAspectRatioTags);

/**
 * Nano Banana Pro aspect ratios - Uses tiered output dimensions (1K / 2K / 4K)
 *
 * Gemini 3 Pro Image Preview supports 3 output tiers with exact dimensions:
 * - Supported ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
 * - NO 9:21 (ultra tall) support
 * - Max dimension: 6336px (long edge at 4K tier)
 * - Max pixels: ~17.2 MP
 *
 * Maps to our tier system as: HD→1K, 2K→2K, 4K→4K
 * Default aspect ratios shown are for HD (1K) tier; actual dimensions
 * are calculated per tier in the resolution system.
 *
 * HD (1K) Tier:
 * | Ratio | Width | Height |
 * |-------|-------|--------|
 * | 1:1   | 1024  | 1024   |
 * | 2:3   | 848   | 1264   |
 * | 3:2   | 1264  | 848    |
 * | 3:4   | 896   | 1200   |
 * | 4:3   | 1200  | 896    |
 * | 4:5   | 928   | 1152   |
 * | 5:4   | 1152  | 928    |
 * | 9:16  | 768   | 1376   |
 * | 16:9  | 1376  | 768    |
 * | 21:9  | 1584  | 672    |
 *
 * 2K Tier:
 * | Ratio | Width | Height |
 * |-------|-------|--------|
 * | 1:1   | 2048  | 2048   |
 * | 2:3   | 1696  | 2528   |
 * | 3:2   | 2528  | 1696   |
 * | 3:4   | 1792  | 2400   |
 * | 4:3   | 2400  | 1792   |
 * | 4:5   | 1856  | 2304   |
 * | 5:4   | 2304  | 1856   |
 * | 9:16  | 1536  | 2752   |
 * | 16:9  | 2752  | 1536   |
 * | 21:9  | 3168  | 1344   |
 *
 * 4K Tier:
 * | Ratio | Width | Height |
 * |-------|-------|--------|
 * | 1:1   | 4096  | 4096   |
 * | 2:3   | 3392  | 5056   |
 * | 3:2   | 5056  | 3392   |
 * | 3:4   | 3584  | 4800   |
 * | 4:3   | 4800  | 3584   |
 * | 4:5   | 3712  | 4608   |
 * | 5:4   | 4608  | 3712   |
 * | 9:16  | 3072  | 5504   |
 * | 16:9  | 5504  | 3072   |
 * | 21:9  | 6336  | 2688   |
 */
const NANOBANANA_PRO_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1376, height: 768, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 768, height: 1376, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 1200, height: 896, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 896, height: 1200, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 1264, height: 848, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 848, height: 1264, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 928, height: 1152, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 1152, height: 928, icon: "monitor", category: "landscape" },
    { label: "Ultrawide", value: "21:9", width: 1584, height: 672, icon: "monitor", category: "ultrawide" },
  ] as const
).map(withAspectRatioTags);



// ============================================================================
// Model Registry
// ============================================================================

/**
 * Complete registry of all supported models.
 * This is the single source of truth for model configuration.
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  // ========================================================================
  // Featured / High-Performance Models
  // ========================================================================

  "gptimage-large": {
    id: "gptimage-large",
    displayName: "GPT 1.5",
    type: "image",
    icon: "camera",
    logo: "/image-models/openai.svg",
    description: "Precision editing, stronger consistency, sharper text/detail rendering",
    constraints: {
      maxPixels: Infinity,
      minPixels: 0,
      minDimension: 1024,
      maxDimension: 1792,
      step: 1,
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: false,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["hd"],
      outputCertainty: "exact",
      dimensionWarning: "Dimensions are fixed for this model",
    },
    aspectRatios: GPTIMAGE_LARGE_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["gptimage-large"],
    isLegacy: true,
  },

  "seedream-pro": {
    id: "seedream-pro",
    displayName: "Seedream 4.5 Pro",
    type: "image",
    icon: "cloud",
    logo: "/image-models/bytedance.svg",
    description: "Campaign suites, multi-image consistency, typography-forward layouts",
    constraints: {
      maxPixels: 16_777_216,
      minPixels: 262_144, // 512x512
      minDimension: 512,
      maxDimension: 16384,
      step: 1,
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max
      maxAspectRatio: 16,
      supportedTiers: ["sd", "hd", "2k", "4k"],
      outputCertainty: "likely",
    },
    aspectRatios: SEEDREAM_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["seedream-pro"],
    isLegacy: true,
  },

  "nanobanana-pro": {
    id: "nanobanana-pro",
    displayName: "Nano Banana Pro",
    type: "image",
    icon: "zap",
    logo: "/image-models/google.svg",
    description: "Premium assets, brand/identity consistency, crisp typography",
    constraints: {
      maxPixels: 17_203_200, // ~17.2 MP at 4K tier (e.g., 4800×3584)
      minPixels: 0,
      minDimension: 672, // Smallest dimension in 1K tier (21:9 = 1584×672)
      maxDimension: 6336, // Largest dimension in 4K tier (21:9 = 6336×2688)
      step: 16,
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: false, // Model uses fixed dimensions per ratio+tier, no custom dimensions
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["hd", "2k", "4k"], // Maps to 1K/2K/4K imageSize tiers
      outputCertainty: "likely",
    },
    aspectRatios: NANOBANANA_PRO_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["nanobanana-pro"],
    isLegacy: true,
  },

  kontext: {
    id: "kontext",
    displayName: "Flux Kontext",
    type: "image",
    icon: "pen-tool",
    logo: "/image-models/flux.svg",
    description: "Image-to-image refinement, precise edits, consistent subject/style",
    constraints: {
      maxPixels: 1_048_576,
      minPixels: 0,
      minDimension: 64,
      maxDimension: 2048,
      step: 32,
      defaultDimensions: { width: 1000, height: 1000 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd", "hd"],
      outputCertainty: "variable",
      dimensionWarning: "Output dimensions may vary from request",
    },
    aspectRatios: STANDARD_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["kontext"],
    isLegacy: true,
  },

  flux: {
    id: "flux",
    displayName: "Flux Schnell",
    type: "image",
    icon: "zap",
    logo: "/image-models/flux.svg",
    description: "Rapid ideation, strong prompt following, clean high-detail renders",
    constraints: {
      maxPixels: 589_824, // 768×768 cap from Pollinations backend
      minPixels: 65_536, // Minimum 256×256 (area divisible by 65,536)
      minDimension: 64, // Minimum per-side (will snap to nearest valid)
      maxDimension: 768, // Max per-side dimension
      step: 8, // Dimensions must be multiples of 8
      defaultDimensions: { width: 768, height: 768 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd"], // Limited to SD tier (768px max)
      outputCertainty: "variable",
      dimensionWarning: "Output may be adjusted by gateway to fit constraints",
    },
    aspectRatios: FLUX_SCHNELL_ASPECT_RATIOS,
    supportsNegativePrompt: true, // Supports negative prompts
    modelPricing: IMAGE_MODEL_PRICING["flux"],
  },

  klein: {
    id: "klein",
    displayName: "FLUX.2 Klein 4B",
    type: "image",
    icon: "zap",
    logo: "/image-models/flux.svg",
    description: "Step-distilled 4B model, ultra-fast 4-step generation, high-resolution up to 4MP",
    constraints: {
      maxPixels: 4_000_000,
      minPixels: 4_096,
      minDimension: 64,
      maxDimension: 2560,
      step: 16,
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647,
      supportedTiers: ["hd", "2k"],
      outputCertainty: "likely",
      dimensionWarning: "Dimensions rounded to multiples of 16",
    },
    aspectRatios: FLUX_KLEIN_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["klein"],
  },

  "klein-large": {
    id: "klein-large",
    displayName: "FLUX.2 Klein 9B",
    type: "image",
    icon: "zap",
    logo: "/image-models/flux.svg",
    description: "Step-distilled 9B model, higher quality 4-step generation, up to 4MP resolution",
    constraints: {
      maxPixels: 4_000_000,
      minPixels: 4_096,
      minDimension: 64,
      maxDimension: 2560,
      step: 16,
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647,
      supportedTiers: ["hd", "2k"],
      outputCertainty: "likely",
      dimensionWarning: "Dimensions rounded to multiples of 16",
    },
    aspectRatios: FLUX_KLEIN_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["klein-large"],
  },

  "seedance-pro": {
    id: "seedance-pro",
    displayName: "Seedance Pro",
    type: "video",
    icon: "video",
    logo: "/image-models/bytedance.svg",
    description: "Native audio+video generation, cinematic camera moves, coherent short-form storytelling, expressive characters, ads & short dramas",
    constraints: {
      maxPixels: Infinity,
      minPixels: 0,
      minDimension: 720,
      maxDimension: 1920,
      step: 1,
      defaultDimensions: { width: 1920, height: 1080 },
      dimensionsEnabled: false,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd", "hd"],
    },
    aspectRatios: VIDEO_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    durationConstraints: {
      min: 2,
      max: 10,
      defaultDuration: 5,
    },
    modelPricing: VIDEO_MODEL_PRICING["seedance-pro"],
    isLegacy: true,
  },

  veo: {
    id: "veo",
    displayName: "Veo 3.1",
    type: "video",
    icon: "video",
    logo: "/image-models/google.svg",
    description: "Reference-guided generation, character/product consistency across shots, native audio, “ingredients” style control, social-ready storytelling",
    constraints: {
      maxPixels: Infinity,
      minPixels: 0,
      minDimension: 720,
      maxDimension: 1920,
      step: 1,
      defaultDimensions: { width: 1920, height: 1080 },
      dimensionsEnabled: false,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd", "hd"],
    },
    aspectRatios: VIDEO_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsAudio: true,
    supportsInterpolation: true,
    durationConstraints: {
      min: 4,
      max: 8,
      fixedOptions: [4, 6, 8],
      defaultDuration: 4,
    },
    modelPricing: VIDEO_MODEL_PRICING["veo"],
    isLegacy: true,
  },

  wan: {
    id: "wan",
    displayName: "Wan 2.6",
    type: "video",
    icon: "video",
    logo: "/image-models/alibaba.svg",
    description: "Image-to-video generation, flexible duration 2-15s, native audio support, resolution tiers",
    constraints: {
      maxPixels: Infinity,
      minPixels: 0,
      minDimension: 480,
      maxDimension: 1920,
      step: 16,
      defaultDimensions: { width: 1280, height: 720 },
      dimensionsEnabled: false,
      maxSeed: 2_147_483_647,
      supportedTiers: ["sd", "hd"],
    },
    aspectRatios: VIDEO_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsAudio: true,
    supportsReferenceImage: true,
    durationConstraints: {
      min: 2,
      max: 15,
      defaultDuration: 5,
    },
    modelPricing: VIDEO_MODEL_PRICING["wan"],
    isLegacy: true,
  },

  // ========================================================================
  // Standard Models
  // ========================================================================

  zimage: {
    id: "zimage",
    displayName: "Z-Image-Turbo",
    type: "image",
    icon: "zap",
    logo: "/image-models/alibaba.svg",
    description: "Super fast, Photorealistic people, products, posters",
    constraints: {
      maxPixels: 2_359_296, // SPAN upscaler limit: 768×768 base × 2 = 1536×1536 max
      minPixels: 0,
      minDimension: 64,
      maxDimension: 2048, // Max single dimension (e.g., 2048×1152 landscape)
      step: 8,
      defaultDimensions: { width: 1536, height: 1536 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd", "hd"], // 2K tier removed - exceeds pixel limit for most ratios
      outputCertainty: "likely",
    },
    aspectRatios: ZIMAGE_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    modelPricing: IMAGE_MODEL_PRICING["zimage"],
  },

  turbo: {
    id: "turbo",
    displayName: "SDXL Turbo",
    type: "image",
    icon: "zap",
    logo: "/image-models/stability.svg",
    description: "Instant previews, high-fidelity draft renders, rapid exploration",
    constraints: {
      maxPixels: 589_825,
      minPixels: 0,
      minDimension: 64,
      maxDimension: 768,
      step: 64,
      defaultDimensions: { width: 768, height: 768 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd"],
      outputCertainty: "likely",
      dimensionWarning: "Limited to 768px max dimension",
    },
    aspectRatios: SDXLTURBO_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    modelPricing: IMAGE_MODEL_PRICING["turbo"],
    isLegacy: true,
  },

  gptimage: {
    id: "gptimage",
    displayName: "GPT 1.0",
    type: "image",
    icon: "camera",
    logo: "/image-models/openai.svg",
    description: "Reliable generation+edits, high-fidelity outputs, versatile creative work",
    constraints: {
      maxPixels: Infinity,
      minPixels: 0,
      minDimension: 1024,
      maxDimension: 1792,
      step: 1,
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: false,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["hd"],
      outputCertainty: "exact",
      dimensionWarning: "Dimensions are fixed for this model",
    },
    aspectRatios: GPTIMAGE_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["gptimage"],
  },

  seedream: {
    id: "seedream",
    displayName: "Seedream 4.0",
    type: "image",
    icon: "cloud",
    logo: "/image-models/bytedance.svg",
    description: "High-fidelity creatives, reference-consistent series, polished illustration/photo",
    constraints: {
      maxPixels: 16_777_216,
      minPixels: 262_144, // 512x512
      minDimension: 512,
      maxDimension: 16384,
      step: 1,
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max
      maxAspectRatio: 16,
      supportedTiers: ["sd", "hd", "2k", "4k"],
      outputCertainty: "likely",
    },
    aspectRatios: SEEDREAM_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["seedream"],
    isLegacy: true,
  },

  nanobanana: {
    id: "nanobanana",
    displayName: "Nano Banana",
    type: "image",
    icon: "zap",
    logo: "/image-models/google.svg",
    description: "Everyday edits, instruction-heavy transforms, quick creative iteration",
    constraints: {
      maxPixels: 1_048_576, // ~1.05 MP (1024×1024)
      minPixels: 0,
      minDimension: 672, // Smallest dimension in fixed output (21:9 = 1536×672)
      maxDimension: 1536, // Largest dimension in fixed output (21:9 = 1536×672)
      step: 16, // Dimensions are fixed, step is for validation only
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: false, // Model uses fixed output dimensions per aspect ratio
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["hd"], // Single tier - fixed output dimensions per aspect ratio
      outputCertainty: "exact", // Fixed dimensions per aspect ratio
    },
    aspectRatios: NANOBANANA_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["nanobanana"],
    isLegacy: true,
  },

  seedance: {
    id: "seedance",
    displayName: "Seedance",
    type: "video",
    icon: "video",
    logo: "/image-models/bytedance.svg",
    description: "Multi-shot generation, strong prompt following, smooth motion + physical realism, cinematic look, text+image driven scenes",
    constraints: {
      maxPixels: Infinity,
      minPixels: 0,
      minDimension: 720,
      maxDimension: 1920,
      step: 1,
      defaultDimensions: { width: 1920, height: 1080 },
      dimensionsEnabled: false,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd", "hd"],
    },
    aspectRatios: VIDEO_ASPECT_RATIOS,
    supportsNegativePrompt: false,
    durationConstraints: {
      min: 2,
      max: 10,
      defaultDuration: 5,
    },
    modelPricing: VIDEO_MODEL_PRICING["seedance"],
  },
} as const;

// ============================================================================
// Accessors
// ============================================================================

/**
 * Get a model by ID. Returns undefined if not found.
 */
export function getModel(modelId: string): ModelDefinition | undefined {
  return MODEL_REGISTRY[modelId.toLowerCase()];
}

/**
 * Get model constraints. Returns undefined if model not found.
 */
export function getModelConstraints(modelId: string): ModelConstraints | undefined {
  return getModel(modelId)?.constraints;
}

/**
 * Get model aspect ratios. Returns undefined if model not found.
 */
export function getModelAspectRatios(modelId: string): readonly AspectRatioOption[] | undefined {
  return getModel(modelId)?.aspectRatios;
}

/**
 * Get model display name. Returns undefined if model not found.
 */
export function getModelDisplayName(modelId: string): string | undefined {
  return getModel(modelId)?.displayName;
}

/**
 * Check if a model supports negative prompts. Returns false if model not found or doesn't support it.
 */
export function getModelSupportsNegativePrompt(modelId: string): boolean {
  return getModel(modelId)?.supportsNegativePrompt ?? false;
}

/**
 * Check if a model supports reference image input. Returns false if model not found or doesn't support it.
 */
export function getModelSupportsReferenceImage(modelId: string): boolean {
  return getModel(modelId)?.supportsReferenceImage ?? false;
}

// ============================================================================
// Model Lists
// ============================================================================

/** All model IDs */
export const ALL_MODEL_IDS = Object.keys(MODEL_REGISTRY);

/** Image model IDs only */
export const IMAGE_MODEL_IDS = Object.values(MODEL_REGISTRY)
  .filter((m) => m.type === "image")
  .map((m) => m.id);

/** Video model IDs only */
export const VIDEO_MODEL_IDS = Object.values(MODEL_REGISTRY)
  .filter((m) => m.type === "video")
  .map((m) => m.id);

// ============================================================================
// Legacy Model Filtering
// ============================================================================

/**
 * Check if a model is legacy (no longer available for new generation).
 * Returns false if model not found.
 */
export function isModelLegacy(modelId: string): boolean {
  return getModel(modelId)?.isLegacy ?? false;
}

/**
 * Get all active (non-legacy) models.
 */
export function getActiveModels(): ModelDefinition[] {
  return Object.values(MODEL_REGISTRY).filter((m) => !m.isLegacy);
}

/**
 * Get all legacy models.
 */
export function getLegacyModels(): ModelDefinition[] {
  return Object.values(MODEL_REGISTRY).filter((m) => m.isLegacy === true);
}

/**
 * Get active image models only (non-legacy).
 */
export function getActiveImageModels(): ModelDefinition[] {
  return Object.values(MODEL_REGISTRY).filter((m) => m.type === "image" && !m.isLegacy);
}

/**
 * Get active video models only (non-legacy).
 */
export function getActiveVideoModels(): ModelDefinition[] {
  return Object.values(MODEL_REGISTRY).filter((m) => m.type === "video" && !m.isLegacy);
}

/** Active (non-legacy) image model IDs */
export const ACTIVE_IMAGE_MODEL_IDS = getActiveImageModels().map((m) => m.id);

/** Active (non-legacy) video model IDs */
export const ACTIVE_VIDEO_MODEL_IDS = getActiveVideoModels().map((m) => m.id);

/** All legacy model IDs */
export const LEGACY_MODEL_IDS = getLegacyModels().map((m) => m.id);
