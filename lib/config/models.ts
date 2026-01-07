/**
 * Unified Model Registry
 *
 * Single source of truth for all model definitions.
 * Each model is defined with its ID, display name, type, constraints, and aspect ratios.
 */

import type { AspectRatioOption, ModelConstraints } from "@/types/pollinations"

// ============================================================================
// Types
// ============================================================================

/** Model type - image generation or video generation */
export type ModelType = "image" | "video"

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
    readonly id: string
    /** Human-readable display name for UI */
    readonly displayName: string
    /** Model type (image or video) */
    readonly type: ModelType
    /** Dimension and pixel constraints */
    readonly constraints: ModelConstraints
    /** Available aspect ratio presets */
    readonly aspectRatios: readonly AspectRatioOption[]
    /** Icon name for UI (lucide icon) */
    readonly icon: string
    /** Logo SVG path for UI (optional) */
    readonly logo?: string
    /** Description for tooltips */
    readonly description: string
    /** Whether this model supports negative prompts */
    readonly supportsNegativePrompt: boolean
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

/** Standard aspect ratios for ~1MP models (NanoBanana, Kontext) */
const STANDARD_ASPECT_RATIOS: readonly AspectRatioOption[] = [
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

/** SDXL Turbo-optimized aspect ratios (768px max dimension) */
const SDXLTURBO_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 768, height: 768, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 768, height: 432, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 432, height: 768, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 768, height: 576, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 576, height: 768, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 768, height: 320, icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 768, height: 768, icon: "sliders", category: "square" },
] as const

/** GPT 1.0 fixed aspect ratios (no custom allowed) */
const GPTIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1536, height: 1024, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1024, height: 1536, icon: "rectangle-vertical", category: "portrait" },
] as const

/** GPT 1.5 fixed aspect ratios (no custom allowed) */
const GPTIMAGE_LARGE_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 1024, height: 1024, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 1792, height: 1024, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1024, height: 1792, icon: "rectangle-vertical", category: "portrait" },
] as const

/** ZImage high-resolution aspect ratios (max dimension 2048) */
const ZIMAGE_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 2048, height: 2048, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 2048, height: 1152, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1152, height: 2048, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 2048, height: 1536, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 1536, height: 2048, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 2048, height: 880, icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 2048, height: 2048, icon: "sliders", category: "square" },
] as const

/** Seedream aspect ratios (max dimension 2048 for API compatibility) */
const SEEDREAM_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Square", value: "1:1", width: 2048, height: 2048, icon: "square", category: "square" },
    { label: "Landscape", value: "16:9", width: 2048, height: 1152, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1152, height: 2048, icon: "rectangle-vertical", category: "portrait" },
    { label: "Photo", value: "4:3", width: 2048, height: 1536, icon: "image", category: "landscape" },
    { label: "Portrait Photo", value: "3:4", width: 1536, height: 2048, icon: "frame", category: "portrait" },
    { label: "Photo Wide", value: "3:2", width: 2048, height: 1344, icon: "image", category: "landscape" },
    { label: "Photo Tall", value: "2:3", width: 1344, height: 2048, icon: "frame", category: "portrait" },
    { label: "Ultrawide", value: "21:9", width: 2048, height: 832, icon: "monitor", category: "ultrawide" },
    { label: "Custom", value: "custom", width: 2048, height: 2048, icon: "sliders", category: "square" },
] as const

/** Video aspect ratios (16:9 and 9:16 only) */
const VIDEO_ASPECT_RATIOS: readonly AspectRatioOption[] = [
    { label: "Landscape", value: "16:9", width: 1920, height: 1080, icon: "rectangle-horizontal", category: "landscape" },
    { label: "Portrait", value: "9:16", width: 1080, height: 1920, icon: "rectangle-vertical", category: "portrait" },
] as const

// ============================================================================
// Model Registry
// ============================================================================

/**
 * Complete registry of all supported models.
 * This is the single source of truth for model configuration.
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
    // ========================================================================
    // Image Models
    // ========================================================================

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
        },
        aspectRatios: STANDARD_ASPECT_RATIOS,
        supportsNegativePrompt: false,
    },

    zimage: {
        id: "zimage",
        displayName: "Z-Image-Turbo",
        type: "image",
        icon: "zap",
        logo: "/image-models/alibaba.svg",
        description: "High-resolution image generation up to 4MP",
        constraints: {
            maxPixels: 4_194_304,
            minPixels: 0,
            minDimension: 64,
            maxDimension: 4096,
            step: 32,
            defaultDimensions: { width: 2048, height: 2048 },
            dimensionsEnabled: true,
            maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
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
        },
        aspectRatios: GPTIMAGE_ASPECT_RATIOS,
        supportsNegativePrompt: false,
    },

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
        },
        aspectRatios: GPTIMAGE_LARGE_ASPECT_RATIOS,
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
            minPixels: 3_686_400,
            minDimension: 1024,
            maxDimension: 6144,
            step: 64,
            defaultDimensions: { width: 4096, height: 4096 },
            dimensionsEnabled: true,
            maxSeed: 2_147_483_647, // int32 max
        },
        aspectRatios: SEEDREAM_ASPECT_RATIOS,
        supportsNegativePrompt: false,
    },

    "seedream-pro": {
        id: "seedream-pro",
        displayName: "Seedream 4.5",
        type: "image",
        icon: "cloud",
        logo: "/image-models/bytedance.svg",
        description: "Pro version with enhanced quality",
        constraints: {
            maxPixels: 16_777_216,
            minPixels: 3_686_400,
            minDimension: 1024,
            maxDimension: 6144,
            step: 64,
            defaultDimensions: { width: 4096, height: 4096 },
            dimensionsEnabled: true,
            maxSeed: 2_147_483_647, // int32 max
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
        },
        aspectRatios: STANDARD_ASPECT_RATIOS,
        supportsNegativePrompt: false,
    },

    "nanobanana-pro": {
        id: "nanobanana-pro",
        displayName: "NanoBanana Pro",
        type: "image",
        icon: "zap",
        logo: "/image-models/google.svg",
        description: "Pro version with enhanced quality",
        constraints: {
            maxPixels: 1_048_576,
            minPixels: 0,
            minDimension: 64,
            maxDimension: 2048,
            step: 32,
            defaultDimensions: { width: 1024, height: 1024 },
            dimensionsEnabled: true,
            maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
        },
        aspectRatios: STANDARD_ASPECT_RATIOS,
        supportsNegativePrompt: false,
    },

    // ========================================================================
    // Video Models
    // ========================================================================

    seedance: {
        id: "seedance",
        displayName: "Seedance",
        type: "video",
        icon: "video",
        logo: "/image-models/bytedance.svg",
        description: "Video generation with flexible duration",
        constraints: {
            maxPixels: Infinity,
            minPixels: 0,
            minDimension: 720,
            maxDimension: 1920,
            step: 1,
            defaultDimensions: { width: 1920, height: 1080 },
            dimensionsEnabled: false,
            maxSeed: 2_147_483_647, // int32 max - Pollinations API limit
        },
        aspectRatios: VIDEO_ASPECT_RATIOS,
        supportsNegativePrompt: false,
        durationConstraints: {
            min: 2,
            max: 10,
            defaultDuration: 5,
        },
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
} as const

// ============================================================================
// Accessors
// ============================================================================

/**
 * Get a model by ID. Returns undefined if not found.
 */
export function getModel(modelId: string): ModelDefinition | undefined {
    return MODEL_REGISTRY[modelId.toLowerCase()]
}

/**
 * Get model constraints. Returns undefined if model not found.
 */
export function getModelConstraints(modelId: string): ModelConstraints | undefined {
    return getModel(modelId)?.constraints
}

/**
 * Get model aspect ratios. Returns undefined if model not found.
 */
export function getModelAspectRatios(modelId: string): readonly AspectRatioOption[] | undefined {
    return getModel(modelId)?.aspectRatios
}

/**
 * Get model display name. Returns undefined if model not found.
 */
export function getModelDisplayName(modelId: string): string | undefined {
    return getModel(modelId)?.displayName
}

/**
 * Check if a model supports negative prompts. Returns false if model not found or doesn't support it.
 */
export function getModelSupportsNegativePrompt(modelId: string): boolean {
    return getModel(modelId)?.supportsNegativePrompt ?? false
}

// ============================================================================
// Model Lists
// ============================================================================

/** All model IDs */
export const ALL_MODEL_IDS = Object.keys(MODEL_REGISTRY)

/** Image model IDs only */
export const IMAGE_MODEL_IDS = Object.values(MODEL_REGISTRY)
    .filter(m => m.type === "image")
    .map(m => m.id)

/** Video model IDs only */
export const VIDEO_MODEL_IDS = Object.values(MODEL_REGISTRY)
    .filter(m => m.type === "video")
    .map(m => m.id)
