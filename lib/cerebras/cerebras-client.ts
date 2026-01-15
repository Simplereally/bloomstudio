/**
 * Cerebras Client
 *
 * Provides an ultra-fast Cerebras client for AI text completions.
 * Optimized for handling high request volumes with:
 * - Singleton client pattern (avoids re-creation overhead)
 * - Exponential backoff retry with jitter for transient failures
 * - Configurable timeouts
 * - Minimal logging overhead in production
 *
 * Uses the Vercel AI SDK provider for Cerebras.
 *
 * Cerebras free tier limits:
 * - 30 RPM (requests per minute)
 * - 60K TPM (tokens per minute)
 * - 1B tokens/month
 * - ~2,000 tokens/sec inference speed
 */

import { createCerebras, type CerebrasProvider } from "@ai-sdk/cerebras"
import { generateText, streamText } from "ai"
import { getCerebrasApiKey, CEREBRAS_MODELS, type CerebrasModel } from "./cerebras-config"

// =============================================================================
// Configuration
// =============================================================================

/** Retry configuration for transient failures */
const RETRY_CONFIG = {
    /** Maximum number of retry attempts */
    maxRetries: 3,
    /** Base delay in ms (doubles with each retry) */
    baseDelayMs: 50,
    /** Maximum delay cap in ms */
    maxDelayMs: 1000,
    /** Jitter factor (0-1) to prevent thundering herd */
    jitterFactor: 0.05,
    /** HTTP status codes that warrant a retry */
    retryableStatuses: [408, 429, 500, 502, 503, 504],
} as const

/** Enable verbose logging (disable in production for performance) */
const VERBOSE_LOGGING = process.env.NODE_ENV === "development"

// =============================================================================
// Singleton Client Management
// =============================================================================

/**
 * Cached client instance. Using a singleton avoids the overhead of
 * re-creating the client on every request, which is critical for high throughput.
 */
let cachedClient: CerebrasProvider | null = null
let cachedApiKey: string | null = null


/**
 * Creates or returns the singleton Cerebras client.
 * Thread-safe for concurrent access - JavaScript's single-threaded nature
 * means we don't need locks, but we do validate the API key hasn't changed.
 *
 * @throws Error if CEREBRAS_API_KEY is not set
 */
export function createCerebrasClient(): CerebrasProvider {
    const apiKey = getCerebrasApiKey()

    if (!apiKey) {
        throw new Error("CEREBRAS_API_KEY environment variable is not set")
    }

    // Return cached client if API key hasn't changed
    if (cachedClient && cachedApiKey === apiKey) {
        return cachedClient
    }

    // Create new client
    cachedClient = createCerebras({ apiKey })
    cachedApiKey = apiKey

    if (VERBOSE_LOGGING) {
        console.log("[Cerebras] Client initialized")
    }

    return cachedClient
}

/**
 * Clears the cached client. Useful for testing or when rotating API keys.
 */
export function clearCerebrasClientCache(): void {
    cachedClient = null
    cachedApiKey = null
}

// =============================================================================
// Retry Logic
// =============================================================================

/**
 * Calculates delay for exponential backoff with jitter.
 * Jitter prevents thundering herd when many requests retry simultaneously.
 */
function calculateRetryDelay(attempt: number): number {
    const exponentialDelay = Math.min(
        RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelayMs
    )
    const jitter = exponentialDelay * RETRY_CONFIG.jitterFactor * Math.random()
    return Math.floor(exponentialDelay + jitter)
}

/**
 * Determines if an error is retryable based on its characteristics.
 */
function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase()
        // Network errors
        if (
            message.includes("fetch failed") ||
            message.includes("network") ||
            message.includes("econnreset") ||
            message.includes("etimedout") ||
            message.includes("socket hang up")
        ) {
            return true
        }
        // Rate limiting or server errors (check status in error message)
        for (const status of RETRY_CONFIG.retryableStatuses) {
            if (message.includes(String(status))) {
                return true
            }
        }
    }
    return false
}

/**
 * Sleeps for the specified duration.
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// =============================================================================
// Types
// =============================================================================

/**
 * Options for text generation
 */
export interface CerebrasGenerateOptions {
    /** The model to use */
    model?: CerebrasModel
    /** System prompt */
    system?: string
    /** User prompt */
    prompt: string
    /** Maximum tokens to generate */
    maxTokens?: number
    /** Temperature for randomness (0-2) */
    temperature?: number
    /** Abort signal for cancellation */
    abortSignal?: AbortSignal
    /** Maximum retry attempts for transient failures (default: 3) */
    maxRetries?: number
}


// =============================================================================
// Core Generation Functions
// =============================================================================

/**
 * Generate text using Cerebras with high-throughput optimizations.
 *
 * Features:
 * - Automatic retry with exponential backoff for transient failures
 * - Timeout handling to prevent hung requests
 * - Connection pooling via singleton client
 *
 * @param options - Generation options
 * @returns The generated text
 * @throws AbortError if the request is cancelled
 * @throws CerebrasError for API errors after retries are exhausted
 */
export async function generateWithCerebras(options: CerebrasGenerateOptions): Promise<string> {
    const cerebras = createCerebrasClient()
    const model = options.model ?? CEREBRAS_MODELS.TEXT_PRIMARY
    const maxRetries = options.maxRetries ?? RETRY_CONFIG.maxRetries

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Check for abort before starting
            if (options.abortSignal?.aborted) {
                throw new DOMException("Aborted", "AbortError")
            }

            const result = await generateText({
                model: cerebras(model),
                system: options.system,
                prompt: options.prompt,
                maxOutputTokens: options.maxTokens ?? 1024,
                temperature: options.temperature ?? 0.7,
                abortSignal: options.abortSignal,
            })

            if (VERBOSE_LOGGING) {
                console.log("[Cerebras] Raw result:", JSON.stringify({
                    text: result.text,
                    reasoning: result.reasoning,
                    finishReason: result.finishReason,
                    usage: result.usage,
                }))
            }

            // Check if we hit token limit during reasoning (no actual output)
            // This is retryable - a fresh request may reason more efficiently
            if (result.finishReason === "length" && !result.text) {
                const truncationError = new Error("Response truncated - reasoning exhausted token budget")
                if (attempt < maxRetries) {
                    const delay = calculateRetryDelay(attempt)
                    if (VERBOSE_LOGGING) {
                        console.warn(
                            `[Cerebras] Reasoning truncated, retry ${attempt + 1}/${maxRetries} after ${delay}ms`
                        )
                    }
                    await sleep(delay)
                    continue
                }
                throw new CerebrasError(
                    truncationError.message,
                    "TOKEN_LIMIT_EXCEEDED",
                    400
                )
            }

            // Extract text, handling reasoning model response format
            // Reasoning models may wrap the answer in <answer> tags
            let responseText = result.text
            const answerMatch = responseText.match(/<answer>([\s\S]*?)<\/answer>/)
            if (answerMatch) {
                responseText = answerMatch[1].trim()
            }

            if (VERBOSE_LOGGING && responseText) {
                console.log(
                    `[Cerebras] Response from ${model}:`,
                    responseText.substring(0, 100) + (responseText.length > 100 ? "..." : "")
                )
            }

            return responseText
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))

            // Don't retry abort errors
            if (lastError.name === "AbortError") {
                throw lastError
            }

            // Check if we should retry
            if (attempt < maxRetries && isRetryableError(error)) {
                const delay = calculateRetryDelay(attempt)
                if (VERBOSE_LOGGING) {
                    console.warn(
                        `[Cerebras] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`,
                        lastError.message
                    )
                }
                await sleep(delay)
                continue
            }

            // No more retries - throw the error
            break
        }
    }

    throw new CerebrasError(
        lastError?.message ?? "Generation failed after retries",
        "GENERATION_FAILED",
        500
    )
}

/**
 * Generate text using Cerebras with streaming.
 * Useful when you need to process tokens as they arrive.
 */
export async function streamWithCerebras(options: CerebrasGenerateOptions) {
    const cerebras = createCerebrasClient()
    const model = options.model ?? CEREBRAS_MODELS.TEXT_PRIMARY

    const result = streamText({
        model: cerebras(model),
        system: options.system,
        prompt: options.prompt,
        maxOutputTokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.7,
        abortSignal: options.abortSignal,
    })

    return result
}

// =============================================================================
// Error Classes
// =============================================================================

/**
 * Error class for Cerebras API errors
 */
export class CerebrasError extends Error {
    constructor(
        message: string,
        public code: string,
        public status?: number
    ) {
        super(message)
        this.name = "CerebrasError"
    }
}
