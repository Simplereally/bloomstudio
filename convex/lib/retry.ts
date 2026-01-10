"use node"

/**
 * Retry utilities with exponential backoff for Convex actions
 * 
 * Provides configurable retry logic for handling transient failures
 * in external API calls (e.g., Pollinations, R2).
 */

// ============================================================
// Types
// ============================================================

/** Configuration for retry behavior */
export interface RetryConfig {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries: number
    /** Base delay in milliseconds for exponential backoff (default: 2000) */
    baseDelayMs: number
    /** Maximum delay in milliseconds (default: 30000) */
    maxDelayMs: number
}

/** Result of an operation with retry tracking */
export interface RetryResult<T> {
    /** Whether the operation succeeded */
    success: boolean
    /** The result data (if successful) */
    data?: T
    /** Error message (if failed) */
    error?: string
    /** Number of retry attempts made */
    attemptsMade: number
    /** Whether the failure was due to a non-retryable error */
    wasNonRetryable?: boolean
}

/** Function to determine if an error is retryable */
export type ShouldRetryFn = (status: number, errorText: string) => boolean

// ============================================================
// Constants
// ============================================================

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Calculate delay for exponential backoff
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap
 * @returns Delay in milliseconds with jitter
 */
export function calculateBackoffDelay(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number
): number {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt)
    
    // Add jitter (±25%) to prevent thundering herd
    const jitter = exponentialDelay * (0.75 + Math.random() * 0.5)
    
    // Cap at maximum delay
    return Math.min(jitter, maxDelayMs)
}

/**
 * Sleep for a specified duration
 * 
 * @param ms - Duration in milliseconds
 */
export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute a fetch request with retry logic
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param shouldRetry - Function to determine if error is retryable
 * @param config - Retry configuration
 * @param logger - Logging prefix for console output
 * @returns Retry result with response data or error
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit,
    shouldRetry: ShouldRetryFn,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    logger: string = "[Retry]"
): Promise<RetryResult<Response>> {
    let lastError: string | undefined
    let lastStatus: number | undefined
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            const response = await fetch(url, options)
            
            if (response.ok) {
                return {
                    success: true,
                    data: response,
                    attemptsMade: attempt + 1,
                }
            }
            
            // Non-OK response - check if retryable
            lastStatus = response.status
            const errorText = await response.text()
            
            // Try to parse error text as JSON and unescape it for better readability
            let displayError: string
            try {
            const parseRecursive = (input: unknown): unknown => {
                    if (typeof input !== "string") return input
                    try {
                        const parsed = JSON.parse(input)
                        if (parsed && typeof parsed === "object") {
                            // Recursively clean keys in object
                            for (const key in parsed) {
                                parsed[key] = parseRecursive(parsed[key])
                            }
                        }
                        return parsed
                    } catch {
                        return input
                    }
                }
                const parsed = parseRecursive(errorText)
                displayError = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)
            } catch {
                displayError = errorText
            }
            
            lastError = `HTTP ${response.status}: ${displayError}`
            
            const isRetryable = shouldRetry(response.status, errorText)
            
            if (!isRetryable) {
                console.log(`${logger} Non-retryable error (${response.status}), not retrying`)
                return {
                    success: false,
                    error: lastError,
                    attemptsMade: attempt + 1,
                    wasNonRetryable: true,
                }
            }
            
            // Retryable error - check if we have retries left
            if (attempt < config.maxRetries) {
                const delay = calculateBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs)
                console.log(`${logger} Attempt ${attempt + 1}/${config.maxRetries + 1} failed (${response.status}), retrying in ${Math.round(delay)}ms...`)
                await sleep(delay)
            }
            
        } catch (error) {
            // Network error or other exception
            lastError = error instanceof Error ? error.message : "Unknown error"
            
            // Network errors are generally retryable
            if (attempt < config.maxRetries) {
                const delay = calculateBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs)
                console.log(`${logger} Attempt ${attempt + 1}/${config.maxRetries + 1} failed (network error), retrying in ${Math.round(delay)}ms...`)
                await sleep(delay)
            }
        }
    }
    
    // All retries exhausted
    console.log(`${logger} All ${config.maxRetries + 1} attempts failed`)
    return {
        success: false,
        error: lastError ?? `Request failed with status ${lastStatus}`,
        attemptsMade: config.maxRetries + 1,
    }
}
