"use node"

/**
 * Pollinations API utilities
 * 
 * Provides URL building and error classification for the Pollinations image generation API.
 */

// ============================================================
// Constants
// ============================================================

/** Pollinations API base URL */
export const POLLINATIONS_BASE_URL = "https://gen.pollinations.ai"

// ============================================================
// Types
// ============================================================

/** Parameters for building a Pollinations image generation URL */
export interface PollinationsUrlParams {
    prompt: string
    negativePrompt?: string
    model?: string
    width?: number
    height?: number
    seed?: number
    enhance?: boolean
    private?: boolean
    safe?: boolean
    image?: string
}

/** Result of error classification */
export interface ErrorClassification {
    isRetryable: boolean
    reason: string
}

// ============================================================
// URL Building
// ============================================================

/**
 * Build the Pollinations image generation URL with all parameters
 * 
 * @param params - Generation parameters
 * @returns Fully formed URL for the Pollinations API
 */
export function buildPollinationsUrl(params: PollinationsUrlParams): string {
    const encodedPrompt = encodeURIComponent(params.prompt)
    const queryParams = new URLSearchParams()

    if (params.negativePrompt?.trim()) {
        queryParams.append("negative_prompt", params.negativePrompt.trim())
    }
    if (params.model) {
        queryParams.append("model", params.model)
    }
    if (params.width) {
        queryParams.append("width", params.width.toString())
    }
    if (params.height) {
        queryParams.append("height", params.height.toString())
    }
    if (params.seed !== undefined && params.seed >= 0) {
        queryParams.append("seed", params.seed.toString())
    }
    
    // Always use high quality
    queryParams.append("quality", "high")
    
    // Boolean flags
    if (params.enhance) queryParams.append("enhance", "true")
    if (params.safe) queryParams.append("safe", "true")
    if (params.private) queryParams.append("private", "true")
    if (params.image) queryParams.append("image", params.image)

    const query = queryParams.toString()
    return `${POLLINATIONS_BASE_URL}/image/${encodedPrompt}${query ? `?${query}` : ""}`
}

// ============================================================
// Error Classification
// ============================================================

/**
 * Classify an HTTP response status code to determine if it's retryable.
 * 
 * Retryable errors:
 * - 429 (Rate limit)
 * - 500, 502, 503, 504 (Server errors)
 * - Timeouts and network errors
 * 
 * Non-retryable errors:
 * - 400 (Bad request - invalid prompt/parameters)
 * - 401, 403 (Authentication/authorization errors)
 * - 404 (Not found)
 * 
 * @param status - HTTP status code
 * @returns Error classification with retryable flag and reason
 */
export function classifyHttpError(status: number): ErrorClassification {
    // Rate limiting - always retryable
    if (status === 429) {
        return { isRetryable: true, reason: "rate_limited" }
    }
    
    // Server errors - retryable
    if (status >= 500) {
        return { isRetryable: true, reason: "server_error" }
    }
    
    // Authentication/authorization errors - not retryable
    if (status === 401 || status === 403) {
        return { isRetryable: false, reason: "auth_error" }
    }
    
    // Bad request (validation) - not retryable
    if (status === 400) {
        return { isRetryable: false, reason: "validation_error" }
    }
    
    // Not found - not retryable
    if (status === 404) {
        return { isRetryable: false, reason: "not_found" }
    }
    
    // Other 4xx errors - not retryable
    if (status >= 400 && status < 500) {
        return { isRetryable: false, reason: "client_error" }
    }
    
    // Unknown status - default to not retryable
    return { isRetryable: false, reason: "unknown" }
}

/**
 * Check if an error message indicates a Flux model unavailability.
 * This is a known transient error that should be retried.
 * 
 * @param errorText - Error message text from API response
 * @returns True if the error indicates Flux model unavailability
 */
export function isFluxModelUnavailable(errorText: string): boolean {
    const pattern = "No active flux servers available"
    
    // Direct match
    if (errorText.includes(pattern)) {
        return true
    }
    
    // Try parsing as JSON (Pollinations sometimes returns nested JSON)
    try {
        const parsed = JSON.parse(errorText)
        if (typeof parsed === "object" && parsed !== null) {
            const nestedMessage = parsed.message ?? parsed.error
            if (typeof nestedMessage === "string" && nestedMessage.includes(pattern)) {
                return true
            }
        }
    } catch {
        // Not JSON, that's fine
    }
    
    return false
}

/**
 * Classify an error based on HTTP status and response body.
 * Combines status code classification with content-based checks.
 * 
 * @param status - HTTP status code
 * @param errorText - Error response body text
 * @returns Error classification with retryable flag and reason
 */
export function classifyApiError(status: number, errorText: string): ErrorClassification {
    // Check for known transient errors in the response body
    if (isFluxModelUnavailable(errorText)) {
        return { isRetryable: true, reason: "model_unavailable" }
    }
    
    // Fall back to HTTP status classification
    return classifyHttpError(status)
}
