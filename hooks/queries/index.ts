/**
 * Query Hooks Barrel Export
 *
 * Central export point for all TanStack Query hooks.
 */

export {
    useGenerateImage,
    isServerGenerationError,
    ServerGenerationError,
    type UseGenerateImageOptions,
    type UseGenerateImageReturn,
} from "./use-generate-image"

export {
    useDownloadImage,
    type DownloadImageParams,
    type UseDownloadImageOptions,
    type UseDownloadImageReturn,
    type ImageFormat,
} from "./use-download-image"

export {
    useImageModels,
    type UseImageModelsOptions,
    type UseImageModelsReturn,
} from "./use-image-models"

export {
    useGenerationHistory,
    type UseGenerationHistoryReturn,
} from "./use-generation-history"

// Re-export commonly used types from schemas
export type {
    ImageGenerationParams,
    GeneratedImage,
} from "@/lib/schemas/pollinations.schema"
