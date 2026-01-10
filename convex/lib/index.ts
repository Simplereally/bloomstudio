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
    isFluxModelUnavailable,
    type PollinationsUrlParams,
    type ErrorClassification,
} from "./pollinations"

// R2 storage utilities
export {
    generateR2Key,
    generateThumbnailKey,
    uploadToR2,
    generateAndUploadThumbnail,
    uploadMediaWithThumbnail,
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
