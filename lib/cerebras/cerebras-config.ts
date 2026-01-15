/**
 * Cerebras Configuration
 *
 * Centralized configuration for Cerebras AI integration.
 * Provides model selection and API key management.
 *
 * Cerebras offers extremely fast inference (~2,000 tokens/sec) with generous free tier:
 * - 30 requests per minute
 * - 60,000 tokens per minute
 * - 1 billion tokens per month
 */

/**
 * Available Cerebras models for text generation.
 * Developer-controlled selection - users don't choose the model.
 */
export const CEREBRAS_MODELS = {
    /** Best balance of quality and cost for prompt enhancement (half the cost of llama) */
    TEXT_PRIMARY: "gpt-oss-120b",
    /** Smaller, faster model for simple tasks */
    TEXT_FAST: "llama3.1-8b",
    /** High quality model for complex reasoning */
    TEXT_QUALITY: "llama-3.3-70b",
} as const

export type CerebrasModel = (typeof CEREBRAS_MODELS)[keyof typeof CEREBRAS_MODELS]

/**
 * Get Cerebras API key from environment.
 * Only available server-side.
 */
export function getCerebrasApiKey(): string | undefined {
    if (typeof window !== "undefined") {
        console.warn("Cerebras API key should only be accessed server-side")
        return undefined
    }
    return process.env.CEREBRAS_API_KEY
}

/**
 * Check if Cerebras API key is configured
 */
export function hasCerebrasApiKey(): boolean {
    return !!getCerebrasApiKey()
}
