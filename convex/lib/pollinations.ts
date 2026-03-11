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

/** Video model IDs - these are the only models that support duration, aspectRatio, audio, and lastFrameImage */
const VIDEO_MODELS = ["veo", "seedance", "seedance-pro", "wan", "grok-video"] as const

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
    // Video-specific parameters
    /** Video duration in seconds */
    duration?: number
    /** Enable audio generation (veo only) */
    audio?: boolean
    /** Video aspect ratio (16:9 or 9:16) */
    aspectRatio?: string
    /** Second reference image for video interpolation (veo) */
    lastFrameImage?: string
    quality?: string
}

/** Result of error classification */
export interface ErrorClassification {
    isRetryable: boolean
    reason: string
}

export type RetryKind = "throttle" | "transient_error" | "permanent"

export type PollinationsAttemptResult =
    | { success: true; response: Response }
    | {
        success: false
        errorMessage: string
        statusCode?: number
        retryable: boolean
        retryKind?: RetryKind
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

    // Always include negative_prompt (even if empty) to work around Pollinations bug
    // where missing param gets converted to literal string "undefined"
    queryParams.append("negative_prompt", params.negativePrompt?.trim() ?? "")
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

    // Video-specific parameters - only include for video models
    const isVideoModel = params.model && VIDEO_MODELS.includes(params.model as typeof VIDEO_MODELS[number])
    if (isVideoModel) {
        // Reference image(s): for models that support interpolation (two reference images),
        // join both URLs with "|" in a single `image` param so the Pollinations gateway
        // splits them into the upstream `image_urls` array.
        if (params.image && params.lastFrameImage) {
            queryParams.append("image", `${params.image}|${params.lastFrameImage}`)
        } else if (params.image) {
            queryParams.append("image", params.image)
        }

        if (params.duration !== undefined && params.duration > 0) {
            queryParams.append("duration", params.duration.toString())
        }
        if (params.aspectRatio) {
            queryParams.append("aspectRatio", params.aspectRatio)
        }
        if (params.audio) {
            queryParams.append("audio", "true")
        }
    } else {
        // Non-video models: single reference image
        if (params.image) queryParams.append("image", params.image)
    }

    const query = queryParams.toString()
    return `${POLLINATIONS_BASE_URL}/image/${encodedPrompt}${query ? `?${query}` : ""}`
}

// ============================================================
// Error Classification
// ============================================================

/**
 * A pattern that identifies a non-retryable error in an API response body.
 *
 * These override HTTP status classification — even if the status code is 500
 * (normally retryable), a matching body pattern marks the error as terminal.
 *
 * This handles cases where upstream providers (e.g. api.airforce) wrap
 * client-level errors (400, 422) in server-level status codes (500).
 */
interface NonRetryableErrorPattern {
    /** Substring or RegExp to match against the error response body */
    readonly pattern: string | RegExp
    /** Machine-readable reason for logging / metrics */
    readonly reason: string
}

/**
 * Registry of error body patterns that should NEVER be retried,
 * regardless of the HTTP status code.
 *
 * Add new entries here when a provider is known to surface permanent
 * failures behind retryable status codes.
 *
 * Order matters: first match wins.
 */
export const NON_RETRYABLE_ERROR_PATTERNS: readonly NonRetryableErrorPattern[] = [
    // api.airforce wraps upstream 4xx errors in a 500 response.
    // e.g. "Provider error (400 Bad Request)" — the request itself is invalid.
    {
        pattern: /Provider error \(4\d{2}\b/,
        reason: "provider_client_error",
    },
    // Content policy / safety rejections from upstream providers
    {
        pattern: /content policy/i,
        reason: "content_policy_violation",
    },
    // Model not found / unsupported at the provider level
    {
        pattern: /model.*not found/i,
        reason: "provider_model_not_found",
    },
]

/**
 * Check if an error body matches any known non-retryable provider pattern.
 *
 * Searches both the raw text and, if the body is JSON, common nested
 * message fields (message, error, detail).
 *
 * @param errorText - Raw error response body
 * @returns Matching classification, or null if no pattern matched
 */
export function matchNonRetryablePattern(errorText: string): ErrorClassification | null {
    // Collect candidate strings to match against
    const candidates: string[] = [errorText]

    try {
        const parsed: unknown = JSON.parse(errorText)
        if (typeof parsed === "object" && parsed !== null) {
            const obj = parsed as Record<string, unknown>
            for (const key of ["message", "error", "detail"] as const) {
                if (typeof obj[key] === "string") {
                    candidates.push(obj[key])
                }
            }
        }
    } catch {
        // Not JSON — that's fine, we still have the raw text
    }

    for (const { pattern, reason } of NON_RETRYABLE_ERROR_PATTERNS) {
        for (const candidate of candidates) {
            const matches =
                typeof pattern === "string"
                    ? candidate.includes(pattern)
                    : pattern.test(candidate)
            if (matches) {
                return { isRetryable: false, reason }
            }
        }
    }

    return null
}

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
 * Evaluation order (first match wins):
 * 1. Known transient body patterns (e.g. Flux unavailability) → retryable
 * 2. Known non-retryable body patterns (e.g. provider 4xx wrapped in 500) → terminal
 * 3. HTTP status code heuristic → depends on code
 * 
 * @param status - HTTP status code
 * @param errorText - Error response body text
 * @returns Error classification with retryable flag and reason
 */
export function classifyApiError(status: number, errorText: string): ErrorClassification {
    // 1. Check for known transient errors in the response body (retryable overrides)
    if (isFluxModelUnavailable(errorText)) {
        return { isRetryable: true, reason: "model_unavailable" }
    }

    // 2. Check for known non-retryable provider errors in the response body
    //    These take priority over HTTP status (e.g. a 500 wrapping a provider 400)
    const nonRetryableMatch = matchNonRetryablePattern(errorText)
    if (nonRetryableMatch !== null) {
        return nonRetryableMatch
    }

    // 3. Fall back to HTTP status classification
    return classifyHttpError(status)
}

export function formatApiErrorText(rawErrorText: string): string {
    try {
        const parseRecursive = (input: unknown): unknown => {
            if (typeof input !== "string") return input
            try {
                const parsed = JSON.parse(input)
                if (parsed && typeof parsed === "object") {
                    for (const key in parsed) {
                        ;(parsed as Record<string, unknown>)[key] = parseRecursive(
                            (parsed as Record<string, unknown>)[key]
                        )
                    }
                }
                return parsed
            } catch {
                return input
            }
        }

        const parsed = parseRecursive(rawErrorText)
        return typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)
    } catch {
        return rawErrorText
    }
}

export async function fetchPollinationsWithTimeout(
    url: string,
    apiKey: string,
    timeoutMs: number,
    logger: string,
    includeRetryKind = false
): Promise<PollinationsAttemptResult> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            signal: controller.signal,
        })

        if (response.ok) {
            return { success: true, response }
        }

        const rawErrorText = await response.text()
        const displayError = formatApiErrorText(rawErrorText)
        const errorMessage = `HTTP ${response.status}: ${displayError}`
        const retryable = classifyApiError(response.status, rawErrorText).isRetryable
        const retryKind: RetryKind = !retryable
            ? "permanent"
            : response.status === 429
              ? "throttle"
              : "transient_error"

        return {
            success: false,
            errorMessage,
            statusCode: response.status,
            retryable,
            ...(includeRetryKind ? { retryKind } : {}),
        }
    } catch (error) {
        const isAbort = error instanceof Error && error.name === "AbortError"
        const errorMessage = isAbort
            ? `Pollinations request timed out after ${timeoutMs}ms`
            : error instanceof Error
              ? error.message
              : "Unknown network error"
        console.error(`${logger} Pollinations fetch failed: ${errorMessage}`)
        return {
            success: false,
            errorMessage,
            retryable: true,
            ...(includeRetryKind ? { retryKind: "transient_error" as const } : {}),
        }
    } finally {
        clearTimeout(timeoutId)
    }
}
