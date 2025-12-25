/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
    maxAttempts?: number
    initialDelayMs?: number
    maxDelayMs?: number
    shouldRetry?: (error: unknown) => boolean
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelayMs = 1000,
        maxDelayMs = 10000,
        shouldRetry = () => true,
    } = options

    let lastError: unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error

            if (attempt === maxAttempts || !shouldRetry(error)) {
                throw error
            }

            const delay = Math.min(
                initialDelayMs * Math.pow(2, attempt - 1),
                maxDelayMs
            )

            console.warn(
                `[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`,
                error
            )

            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    throw lastError
}

/**
 * Check if an error is retryable (network errors, 5xx responses)
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        // Network errors
        if (error.message.toLowerCase().includes("fetch") ||
            error.message.toLowerCase().includes("network") ||
            error.message.toLowerCase().includes("connection") ||
            error.message.toLowerCase().includes("timeout")) {
            return true
        }
    }

    // R2/S3 errors with status codes
    if (typeof error === "object" && error !== null && "$metadata" in error) {
        const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        const status = metadata?.httpStatusCode
        return status !== undefined && status >= 500
    }

    return false
}
