/**
 * Query Hooks Barrel Export
 *
 * Central export point for all TanStack Query hooks.
 */

export {
    ServerGenerationError, isServerGenerationError, useGenerateImage, type UseGenerateImageOptions,
    type UseGenerateImageReturn
} from "./use-generate-image"

export {
    useDownloadImage,
    type DownloadImageParams, type ImageFormat, type UseDownloadImageOptions,
    type UseDownloadImageReturn
} from "./use-download-image"

export {
    useImageModels,
    type UseImageModelsOptions,
    type UseImageModelsReturn
} from "./use-image-models"

export {
    useGenerationHistory,
    type UseGenerationHistoryReturn
} from "./use-generation-history"

export {
    EnhancementError,
    isEnhancementError, useEnhancePrompt, type EnhanceParams, type UseEnhancePromptOptions,
    type UseEnhancePromptReturn
} from "./use-enhance-prompt"

// Re-export commonly used types from schemas
export type {
    GeneratedImage, ImageGenerationParams
} from "@/lib/schemas/pollinations.schema"

