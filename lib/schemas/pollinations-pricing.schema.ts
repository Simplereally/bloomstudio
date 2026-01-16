/**
 * Pollinations Model Pricing Schema
 *
 * Defines the pricing structure for all Pollinations AI models.
 * Pricing is denominated in "pollen" - Pollinations' unit of account.
 *
 * Key concepts:
 * - 1 pollen ≈ N images/videos (varies by model efficiency)
 * - Input pollen: Cost for processing input (prompts, reference images)
 * - Output pollen: Cost for generating output (images, videos)
 * - Prices are per-image, per-second, or per-million tokens depending on model
 *
 * For UI display names and other configuration, see @/lib/config/models.ts
 *
 * @see https://enter.pollinations.ai for current pricing
 */

import { z } from "zod";

// ============================================================================
// Input/Output Modality Types
// ============================================================================

/**
 * Input modalities that models can accept
 * - 👁️ = vision (image input)
 * - 💬 = text (prompt input)
 */
export const InputModalitySchema = z.enum(["vision", "text"]);
export type InputModality = z.infer<typeof InputModalitySchema>;

/**
 * Output modalities that models can produce
 * - 🖼️ = image output
 * - 🎬 = video output
 */
export const OutputModalitySchema = z.enum(["image", "video"]);
export type OutputModality = z.infer<typeof OutputModalitySchema>;

// ============================================================================
// Pricing Unit Types
// ============================================================================

/**
 * Units for pricing measurement
 * - per_image: Cost per generated image
 * - per_second: Cost per second of video
 * - per_million_tokens: Cost per million tokens (text/image tokens)
 */
export const PricingUnitSchema = z.enum([
    "per_image",
    "per_second",
    "per_million_tokens",
]);
export type PricingUnit = z.infer<typeof PricingUnitSchema>;

// ============================================================================
// Model Pricing Schemas
// ============================================================================

/**
 * Token-based pricing (for multimodal models like GPT Image, NanoBanana)
 * Prices specified per million tokens
 */
export const TokenPricingSchema = z.object({
    /** Price per million text input tokens */
    textInputPerMillion: z.number().optional(),
    /** Price per million image input tokens (vision) */
    imageInputPerMillion: z.number().optional(),
    /** Price per million image output tokens */
    imageOutputPerMillion: z.number(),
});
export type TokenPricing = z.infer<typeof TokenPricingSchema>;

/**
 * Per-image pricing (for simple generation models like Flux, Z-Image)
 */
export const ImagePricingSchema = z.object({
    /** Price per generated image in pollen */
    perImage: z.number(),
});
export type ImagePricing = z.infer<typeof ImagePricingSchema>;

/**
 * Per-second pricing (for video models)
 */
export const VideoPricingSchema = z.object({
    /** Price per second of video in pollen */
    perSecond: z.number().optional(),
    /** Price per million video output tokens */
    videoOutputPerMillion: z.number().optional(),
});
export type VideoPricing = z.infer<typeof VideoPricingSchema>;

// ============================================================================
// Model Definition Schema
// ============================================================================

/**
 * Complete model pricing definition
 */
export const ModelPricingDefinitionSchema = z.object({
    /** Model ID (matches API model parameter) */
    modelId: z.string(),

    /** Model type */
    type: z.enum(["image", "video"]),

    /** Approximate images/videos per 1 pollen (efficiency indicator) */
    approximatePerPollen: z.number(),

    /** Whether model supports reference image/vision input (defaults to false) */
    supportsReferenceImage: z.boolean().optional(),

    /** Token-based pricing (for multimodal models) */
    tokenPricing: TokenPricingSchema.optional(),

    /** Per-image pricing (for simple generation models) */
    imagePricing: ImagePricingSchema.optional(),

    /** Per-second/video pricing (for video models) */
    videoPricing: VideoPricingSchema.optional(),

    /** Whether this model is in alpha/experimental state (defaults to false) */
    isAlpha: z.boolean().optional(),
});
export type ModelPricingDefinition = z.infer<
    typeof ModelPricingDefinitionSchema
>;

// ============================================================================
// Image Model Pricing Registry
// ============================================================================

/**
 * Pricing data for all image generation models
 *
 * Data source: Pollinations pricing page (as of 2026-01-16)
 * Format: 1 pollen ≈ X images (higher = more efficient/cheaper)
 */
export const IMAGE_MODEL_PRICING: Record<string, ModelPricingDefinition> = {
    /**
     * Flux Schnell - Ultra-fast generation
     * Very efficient: 5000 images per pollen
     */
    flux: {
        modelId: "flux",
        type: "image",
        approximatePerPollen: 5000,
        supportsReferenceImage: false,
        imagePricing: {
            perImage: 0.0002, // 1 pollen / 5000 images
        },
    },

    /**
     * Z-Image Turbo - Fast with upscaling
     * Very efficient: 5000 images per pollen
     */
    zimage: {
        modelId: "zimage",
        type: "image",
        approximatePerPollen: 5000,
        supportsReferenceImage: false,
        imagePricing: {
            perImage: 0.0002, // 1 pollen / 5000 images
        },
    },

    /**
     * SDXL Turbo - Stable Diffusion based
     * Efficient: ~3300 images per pollen
     */
    turbo: {
        modelId: "turbo",
        type: "image",
        approximatePerPollen: 3333,
        supportsReferenceImage: false,
        imagePricing: {
            perImage: 0.0003, // 1 pollen / 3333 images
        },
    },

    /**
     * GPT Image 1 Mini - OpenAI multimodal
     * Supports vision input with complex token pricing
     */
    gptimage: {
        modelId: "gptimage",
        type: "image",
        approximatePerPollen: 70,
        supportsReferenceImage: true,
        tokenPricing: {
            textInputPerMillion: 2.0,
            imageInputPerMillion: 2.5,
            imageOutputPerMillion: 8.0,
        },
    },

    /**
     * Seedream 4.0 - ByteDance's flagship
     * Good efficiency: ~33.3 images per pollen
     */
    seedream: {
        modelId: "seedream",
        type: "image",
        approximatePerPollen: 33.3,
        supportsReferenceImage: true,
        imagePricing: {
            perImage: 0.03, // 1 / ~33.3 images
        },
    },

    /**
     * FLUX.1 Kontext - Context-aware editing
     * Premium: ~25 images per pollen
     */
    kontext: {
        modelId: "kontext",
        type: "image",
        approximatePerPollen: 25,
        supportsReferenceImage: true,
        imagePricing: {
            perImage: 0.04, // 1 / ~25 images
        },
    },

    /**
     * NanoBanana - Gemini-based generation
     * Token-based, multimodal
     */
    nanobanana: {
        modelId: "nanobanana",
        type: "image",
        approximatePerPollen: 25,
        supportsReferenceImage: true,
        tokenPricing: {
            textInputPerMillion: 0.3,
            imageInputPerMillion: 0.3,
            imageOutputPerMillion: 30.0,
        },
    },

    /**
     * Seedream 4.5 Pro - Premium ByteDance model
     * Premium tier: ~25 images per pollen
     */
    "seedream-pro": {
        modelId: "seedream-pro",
        type: "image",
        approximatePerPollen: 25,
        supportsReferenceImage: true,
        imagePricing: {
            perImage: 0.04,
        },
    },

    /**
     * GPT Image 1.5 - Enhanced OpenAI model
     * Higher quality, higher cost
     */
    "gptimage-large": {
        modelId: "gptimage-large",
        type: "image",
        approximatePerPollen: 15,
        supportsReferenceImage: true,
        tokenPricing: {
            textInputPerMillion: 8.0,
            imageInputPerMillion: 8.0,
            imageOutputPerMillion: 32.0,
        },
    },

    /**
     * NanoBanana Pro - Premium Gemini model
     * Highest quality, highest cost for image models
     */
    "nanobanana-pro": {
        modelId: "nanobanana-pro",
        type: "image",
        approximatePerPollen: 6,
        supportsReferenceImage: true,
        tokenPricing: {
            textInputPerMillion: 1.25,
            imageInputPerMillion: 1.25,
            imageOutputPerMillion: 120.0,
        },
    },
} as const;

// ============================================================================
// Video Model Pricing Registry
// ============================================================================

/**
 * Pricing data for all video generation models
 *
 * Data source: Pollinations pricing page (as of 2026-01-16)
 * Note: Video pricing is in ALPHA stage
 * Format: 1 pollen ≈ X videos (higher = more efficient/cheaper)
 */
export const VIDEO_MODEL_PRICING: Record<string, ModelPricingDefinition> = {
    /**
     * Seedance Pro-Fast - ByteDance fast video
     * Most efficient video model: ~10 videos per pollen
     */
    "seedance-pro": {
        modelId: "seedance-pro",
        type: "video",
        approximatePerPollen: 10,
        supportsReferenceImage: true,
        isAlpha: true,
        videoPricing: {
            videoOutputPerMillion: 1.0,
        },
    },

    /**
     * Seedance Lite - Lighter/faster variant
     * Good efficiency: ~6 videos per pollen
     */
    seedance: {
        modelId: "seedance",
        type: "video",
        approximatePerPollen: 6,
        supportsReferenceImage: true,
        isAlpha: true,
        videoPricing: {
            videoOutputPerMillion: 1.8,
        },
    },

    /**
     * Veo 3.1 Fast - Google's video model
     * Per-second pricing, most flexible
     */
    veo: {
        modelId: "veo",
        type: "video",
        approximatePerPollen: 1, // ~1 video per pollen (highly variable based on duration)
        supportsReferenceImage: true,
        isAlpha: true,
        videoPricing: {
            perSecond: 0.15,
        },
    },
} as const;

// ============================================================================
// Combined Registry
// ============================================================================

/**
 * Complete pricing registry for all models
 */
export const MODEL_PRICING_REGISTRY: Record<string, ModelPricingDefinition> = {
    ...IMAGE_MODEL_PRICING,
    ...VIDEO_MODEL_PRICING,
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get pricing for a specific model
 */
export function getModelPricing(
    modelId: string
): ModelPricingDefinition | undefined {
    return MODEL_PRICING_REGISTRY[modelId.toLowerCase()];
}

/**
 * Calculate estimated pollen cost for image generation
 * @param modelId - The model ID
 * @param imageCount - Number of images to generate (default: 1)
 * @returns Estimated pollen cost, or undefined if model not found
 */
export function estimateImageCost(
    modelId: string,
    imageCount = 1
): number | undefined {
    const pricing = getModelPricing(modelId);
    if (!pricing || pricing.type !== "image") return undefined;

    if (pricing.imagePricing) {
        return pricing.imagePricing.perImage * imageCount;
    }

    // For token-based models, we can only estimate based on output
    // Actual cost depends on prompt length and output resolution
    if (pricing.tokenPricing) {
        // Rough estimate: assume ~1M output tokens per image for simplicity
        // Real calculation would need actual token counts
        return (pricing.tokenPricing.imageOutputPerMillion / 1_000_000) * imageCount;
    }

    return undefined;
}

/**
 * Calculate estimated pollen cost for video generation
 * @param modelId - The model ID
 * @param durationSeconds - Video duration in seconds
 * @returns Estimated pollen cost, or undefined if model not found
 */
export function estimateVideoCost(
    modelId: string,
    durationSeconds: number
): number | undefined {
    const pricing = getModelPricing(modelId);
    if (!pricing || pricing.type !== "video") return undefined;

    if (pricing.videoPricing?.perSecond) {
        return pricing.videoPricing.perSecond * durationSeconds;
    }

    // For token-based video pricing, estimation is more complex
    // Would need to know expected token output per second
    if (pricing.videoPricing?.videoOutputPerMillion) {
        // Rough estimate based on approximatePerPollen
        return 1 / pricing.approximatePerPollen;
    }

    return undefined;
}

/**
 * Get all models sorted by efficiency (most efficient first)
 * @param type - Filter by model type ('image' | 'video'), or undefined for all
 */
export function getModelsByEfficiency(
    type?: "image" | "video"
): ModelPricingDefinition[] {
    return Object.values(MODEL_PRICING_REGISTRY)
        .filter((model) => !type || model.type === type)
        .sort((a, b) => b.approximatePerPollen - a.approximatePerPollen);
}

/**
 * Check if a model supports reference image/vision input
 */
export function modelSupportsReferenceImage(modelId: string): boolean {
    return getModelPricing(modelId)?.supportsReferenceImage ?? false;
}

/**
 * Check if a model is in alpha/experimental stage
 */
export function isModelAlpha(modelId: string): boolean {
    return getModelPricing(modelId)?.isAlpha ?? false;
}
