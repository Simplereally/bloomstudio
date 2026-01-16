"use node"

/**
 * Groq Vision Client for Convex
 *
 * Provides vision/image analysis using Groq's multimodal models.
 * Uses raw fetch for Convex compatibility (no external SDK dependencies).
 * 
 * Groq free tier limits for vision (Llama 4 Scout):
 * - 30 Requests Per Minute (RPM)
 * - 1,000 Requests Per Day (RPD)
 * - 500K Tokens Per Day (TPD)
 */

import { calculateBackoffDelay, sleep, DEFAULT_RETRY_CONFIG, type RetryConfig } from "./retry"

// =============================================================================
// Configuration
// =============================================================================

/** Groq vision model */
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

/** Timeout for Groq API requests in milliseconds */
export const GROQ_FETCH_TIMEOUT_MS = 30_000

/** Max retries before giving up */
export const GROQ_MAX_RETRIES = 2

// =============================================================================
// Types
// =============================================================================

export interface GroqVisionResult {
    text: string
}

/** Dependencies that can be injected for testing */
export interface GroqVisionDeps {
    apiKey: string | undefined
    fetchFn: typeof fetch
    sleepFn: (ms: number) => Promise<void>
    retryConfig: RetryConfig
    maxRetries: number
    timeoutMs: number
}

// =============================================================================
// Error Classes
// =============================================================================

/**
 * Custom error class for Groq API errors
 */
export class GroqApiError extends Error {
    constructor(
        message: string,
        public status?: number
    ) {
        super(message)
        this.name = "GroqApiError"
    }
}

/**
 * Custom error class for timeout scenarios
 */
export class GroqTimeoutError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "GroqTimeoutError"
    }
}

// =============================================================================
// Default Dependencies
// =============================================================================

const getDefaultDeps = (): GroqVisionDeps => ({
    apiKey: process.env.GROQ_API_KEY,
    fetchFn: fetch,
    sleepFn: sleep,
    retryConfig: DEFAULT_RETRY_CONFIG,
    maxRetries: GROQ_MAX_RETRIES,
    timeoutMs: GROQ_FETCH_TIMEOUT_MS,
})

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Analyze an image using Groq's vision model.
 * 
 * @internal Exported for testing - use analyzeImageWithGroq() in production
 */
export async function analyzeImageWithGroqDeps(
    imageUrl: string,
    prompt: string,
    deps: GroqVisionDeps
): Promise<GroqVisionResult> {
    if (!deps.apiKey) {
        throw new GroqApiError("GROQ_API_KEY is not set")
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= deps.maxRetries; attempt++) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), deps.timeoutMs)

        try {

            const response = await deps.fetchFn("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${deps.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: GROQ_VISION_MODEL,
                    messages: [{
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: { url: imageUrl }
                            }
                        ]
                    }],
                    temperature: 0.1,
                    max_completion_tokens: 1024,
                }),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorText = await response.text().catch(() => "")
                
                // For rate limit errors, capture the reset duration from headers
                let rateLimitInfo = ""
                if (response.status === 429) {
                    const resetDuration = response.headers.get("x-ratelimit-reset-requests")
                    if (resetDuration) {
                        rateLimitInfo = ` x-ratelimit-reset-requests: ${resetDuration}`
                    }
                }
                
                throw new GroqApiError(
                    `Groq API error: ${response.status} ${response.statusText} - ${errorText}${rateLimitInfo}`,
                    response.status
                )
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content

            if (!content) {
                throw new GroqApiError("No content received from Groq")
            }

            return { text: content }

        } catch (error) {
            clearTimeout(timeoutId)

            // Handle timeout
            if (error instanceof Error && error.name === "AbortError") {
                lastError = new GroqTimeoutError(
                    `Groq API request timed out after ${deps.timeoutMs}ms`
                )
            } else {
                lastError = error instanceof Error ? error : new Error(String(error))
            }

            // Retry with backoff if we have attempts left
            if (attempt < deps.maxRetries) {
                const delay = calculateBackoffDelay(
                    attempt,
                    deps.retryConfig.baseDelayMs,
                    deps.retryConfig.maxDelayMs
                )
                await deps.sleepFn(delay)
            }
        }
    }

    throw lastError ?? new GroqApiError("Groq vision analysis failed")
}

/**
 * Analyze an image using Groq's vision model.
 * 
 * @param imageUrl - Public URL of the image to analyze
 * @param prompt - Analysis prompt
 * @returns Analysis result text
 */
export async function analyzeImageWithGroq(
    imageUrl: string,
    prompt: string
): Promise<GroqVisionResult> {
    return analyzeImageWithGroqDeps(imageUrl, prompt, getDefaultDeps())
}

/**
 * Check if Groq API key is configured
 */
export function hasGroqApiKey(): boolean {
    return !!process.env.GROQ_API_KEY
}
