/**
 * Unified Model Registry
 *
 * Single source of truth for all model definitions.
 * Each model is defined with its ID, display name, type, constraints, and aspect ratios.
 */

import type { AspectRatio, AspectRatioOption, ModelConstraints } from "@/types/pollinations";
import { STANDARD_RESOLUTIONS } from "./standard-resolutions";

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
 * Z-Image Turbo aspect ratios - Optimized for SPAN upscaler limit
 *
 * Pollinations enforces a max of 2,359,296 pixels (768×768 base × 2 upscale = 1536×1536 max square).
 * All dimensions are aligned to step=32 and maximize quality within the pixel budget.
 *
 * | Ratio | Width | Height | Pixels    |
 * |-------|-------|--------|-----------||
 * | 1:1   | 1536  | 1536   | 2,359,296 |
 * | 16:9  | 2048  | 1152   | 2,359,296 |
 * | 9:16  | 1152  | 2048   | 2,359,296 |
 * | 4:3   | 1664  | 1248   | 2,076,672 |
 * | 3:4   | 1248  | 1664   | 2,076,672 |
 * | 3:2   | 1824  | 1216   | 2,218,784 |
 * | 2:3   | 1216  | 1824   | 2,218,784 |
 * | 4:5   | 1280  | 1600   | 2,048,000 |
 * | 5:4   | 1600  | 1280   | 2,048,000 |
 * | 21:9  | 2240  | 960    | 2,150,400 |
 * | 9:21  | 960   | 2240   | 2,150,400 |
 */
const ZIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = (
  [
    { label: "Square", value: "1:1", width: 1536, height: 1536, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 2048, height: 1152, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1152, height: 2048, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 1664, height: 1248, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 1248, height: 1664, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 1824, height: 1216, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 1216, height: 1824, icon: "frame", category: "portrait" },
    { label: "Social", value: "4:5", width: 1280, height: 1600, icon: "smartphone", category: "portrait" },
    { label: "Social Wide", value: "5:4", width: 1600, height: 1280, icon: "monitor", category: "landscape" },
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
    description: "DALL-E 3 HD with higher quality output",
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
  },

  "seedream-pro": {
    id: "seedream-pro",
    displayName: "Seedream 4.5 Pro",
    type: "image",
    icon: "cloud",
    logo: "/image-models/bytedance.svg",
    description: "Pro version with enhanced quality",
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
  },

  "nanobanana-pro": {
    id: "nanobanana-pro",
    displayName: "NanoBanana Pro",
    type: "image",
    icon: "zap",
    logo: "/image-models/google.svg",
    description: "Pro version with enhanced quality and 4k support",
    constraints: {
      maxPixels: 10_000_000,
      minPixels: 0,
      minDimension: 1024,
      maxDimension: 4096,
      step: 16,
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd", "hd", "2k", "4k"],
      outputCertainty: "likely",
    },
    aspectRatios: SEEDREAM_ASPECT_RATIOS, // NanoBanana Pro supports 4K tiers, same as Seedream
    supportsNegativePrompt: false,
  },

  kontext: {
    id: "kontext",
    displayName: "Flux Kontext",
    type: "image",
    icon: "pen-tool",
    logo: "/image-models/flux.svg",
    description: "Context-aware image generation",
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
  },

  flux: {
    id: "flux",
    displayName: "Flux Schnell",
    type: "image",
    icon: "zap",
    logo: "/image-models/flux.svg",
    description: "Fast image generation with 768px max dimension",
    constraints: {
      maxPixels: 589_824, // 768×768 cap from Pollinations backend
      minPixels: 65_536, // Minimum 256×256 (area divisible by 65,536)
      minDimension: 64, // Minimum per-side (will snap to nearest valid)
      maxDimension: 768, // Max per-side dimension
      step: 8, // Dimensions must be multiples of 8
      defaultDimensions: { width: 768, height: 768 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd", "hd"], // Limited to SD tier (768px max)
      outputCertainty: "variable",
      dimensionWarning: "Output may be adjusted by gateway to fit constraints",
    },
    aspectRatios: FLUX_SCHNELL_ASPECT_RATIOS,
    supportsNegativePrompt: true, // Supports negative prompts
  },

  "seedance-pro": {
    id: "seedance-pro",
    displayName: "Seedance Pro",
    type: "video",
    icon: "video",
    logo: "/image-models/bytedance.svg",
    description: "Pro video generation with enhanced quality",
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
  },

  veo: {
    id: "veo",
    displayName: "Veo 3.1",
    type: "video",
    icon: "video",
    logo: "/image-models/google.svg",
    description: "Google Veo video with audio and frame interpolation",
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
    description: "Fast image generation with SPAN upscaling (max 2.36MP)",
    constraints: {
      maxPixels: 2_359_296, // SPAN upscaler limit: 768×768 base × 2 = 1536×1536 max
      minPixels: 0,
      minDimension: 64,
      maxDimension: 2048, // Max single dimension (e.g., 2048×1152 landscape)
      step: 32,
      defaultDimensions: { width: 1536, height: 1536 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd", "hd"], // 2K tier removed - exceeds pixel limit for most ratios
      outputCertainty: "likely",
    },
    aspectRatios: ZIMAGE_ASPECT_RATIOS,
    supportsNegativePrompt: false,
  },

  turbo: {
    id: "turbo",
    displayName: "SDXL Turbo",
    type: "image",
    icon: "zap",
    logo: "/image-models/stability.svg",
    description: "Fast generation with 768px max dimension",
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
  },

  gptimage: {
    id: "gptimage",
    displayName: "GPT 1.0",
    type: "image",
    icon: "camera",
    logo: "/image-models/openai.svg",
    description: "DALL-E powered image generation with fixed sizes",
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
  },

  seedream: {
    id: "seedream",
    displayName: "Seedream 4.0",
    type: "image",
    icon: "cloud",
    logo: "/image-models/bytedance.svg",
    description: "Ultra-high resolution artistic generation",
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
  },

  nanobanana: {
    id: "nanobanana",
    displayName: "NanoBanana",
    type: "image",
    icon: "zap",
    logo: "/image-models/google.svg",
    description: "Lightweight fast image generation",
    constraints: {
      maxPixels: 1_048_576,
      minPixels: 0,
      minDimension: 64,
      maxDimension: 2048,
      step: 32,
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
      supportedTiers: ["sd", "hd"],
      outputCertainty: "variable",
      dimensionWarning: "Output dimensions may vary from request",
    },
    aspectRatios: STANDARD_ASPECT_RATIOS,
    supportsNegativePrompt: false,
  },

  seedance: {
    id: "seedance",
    displayName: "Seedance",
    type: "video",
    icon: "video",
    logo: "/image-models/bytedance.svg",
    description: "Video generation",
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
