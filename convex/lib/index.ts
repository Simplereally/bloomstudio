"use node"

/**
 * Convex shared utilities
 * 
 * Re-exports all utilities for convenient importing in actions.
 */

// Crypto utilities
export { decryptApiKey } from "./crypto"

// Pollinations API utilities
export {
    POLLINATIONS_BASE_URL,
    buildPollinationsUrl,
    classifyHttpError,
    classifyApiError,
    fetchPollinationsWithTimeout,
    formatApiErrorText,
    isFluxModelUnavailable,
    matchNonRetryablePattern,
    NON_RETRYABLE_ERROR_PATTERNS,
    type PollinationsAttemptResult,
    type PollinationsUrlParams,
    type RetryKind,
    type ErrorClassification,
} from "./pollinations"

// Dirtberry processing utilities
export {
    DIRTBERRY_TRIM_FRACTION,
    DIRTBERRY_SOURCE_WIDTH,
    DIRTBERRY_SOURCE_HEIGHT,
    DIRTBERRY_OUTPUT_HEIGHT,
    getDirtberrySourceDimensions,
    isDirtberryModel,
    calculateDirtberryCropRegion,
    cropDirtberryImageBuffer,
    type DirtberryCropResult,
} from "./dirtberryCrop"

// R2 storage utilities
export {
    generateR2Key,
    generateThumbnailKey,
    generatePreviewKey,
    uploadToR2,
    deleteR2Objects,
    generateAndUploadThumbnail,
    uploadMediaWithThumbnail,
    generateAndUploadVideoSecondaryAssets,
    type R2UploadResult,
    type MediaUploadResult,
} from "./r2"

// Video thumbnail utilities
export { extractVideoThumbnail } from "./videoThumbnail"

// Retry utilities
export {
    DEFAULT_RETRY_CONFIG,
    calculateBackoffDelay,
    sleep,
    fetchWithRetry,
    type RetryConfig,
    type RetryResult,
    type ShouldRetryFn,
} from "./retry"

// Vision analysis utilities (Groq primary, OpenRouter fallback)
export {
    analyzeImageContent,
    calculateSensitivityScore,
    hasAnyVisionProvider,
    VisionAnalysisError,
    type ContentAnalysisResult,
} from "./visionAnalysis"

// Groq vision utilities
export {
    analyzeImageWithGroq,
    hasGroqApiKey,
    GroqApiError,
    GroqTimeoutError,
    GROQ_VISION_MODEL,
} from "./groq"
