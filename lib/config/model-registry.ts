/**
 * Model Registry
 *
 * Complete registry of all supported models.
 * This is the single source of truth for model configuration.
 */

import {
  IMAGE_MODEL_PRICING,
  VIDEO_MODEL_PRICING,
} from "../schemas/pollinations-pricing.schema";
import type { ModelDefinition } from "./model-types";
import {
  FLUX_SCHNELL_ASPECT_RATIOS,
  GPTIMAGE_ASPECT_RATIOS,
  GPTIMAGE_LARGE_ASPECT_RATIOS,
  NANOBANANA_ASPECT_RATIOS,
  NANOBANANA_PRO_ASPECT_RATIOS,
  SDXLTURBO_ASPECT_RATIOS,
  SEEDREAM_ASPECT_RATIOS,
  STANDARD_ASPECT_RATIOS,
  VIDEO_ASPECT_RATIOS,
  ZIMAGE_ASPECT_RATIOS,
} from "./aspect-ratios";

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
    description: "Efficient FLUX.2 distillation. fast generation with excellent prompt adherence.",
    constraints: {
      maxPixels: Infinity, // No enforced cap
      minPixels: 0,
      minDimension: 16, // Practical min
      maxDimension: 8192, // Arbitrary high cap
      step: 16, // Best pipeline compatibility
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647,
      supportedTiers: ["sd", "hd", "2k", "4k"], // Effectively all
      outputCertainty: "exact",
      dimensionWarning: "Recommended max 4MP (2048×2048) for best results",
    },
    aspectRatios: STANDARD_ASPECT_RATIOS,
    supportsNegativePrompt: true,
    supportsReferenceImage: true,
    modelPricing: IMAGE_MODEL_PRICING["klein"],
  },

  "klein-large": {
    id: "klein-large",
    displayName: "FLUX.2 Klein 9B",
    type: "image",
    icon: "zap",
    logo: "/image-models/flux.svg",
    description: "High-fidelity FLUX.2 model. 9B parameters for superior texture and detail.",
    constraints: {
      maxPixels: Infinity, // No enforced cap
      minPixels: 0,
      minDimension: 16, // Practical min
      maxDimension: 8192, // Arbitrary high cap
      step: 16, // Best pipeline compatibility
      defaultDimensions: { width: 1024, height: 1024 },
      dimensionsEnabled: true,
      maxSeed: 2_147_483_647,
      supportedTiers: ["sd", "hd", "2k", "4k"], // Effectively all
      outputCertainty: "exact",
      dimensionWarning: "Recommended max 4MP (2048×2048) for best results",
    },
    aspectRatios: STANDARD_ASPECT_RATIOS,
    supportsNegativePrompt: true,
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
  },

  veo: {
    id: "veo",
    displayName: "Veo 3.1",
    type: "video",
    icon: "video",
    logo: "/image-models/google.svg",
    description: "Reference-guided generation, character/product consistency across shots, native audio, 'ingredients' style control, social-ready storytelling",
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
