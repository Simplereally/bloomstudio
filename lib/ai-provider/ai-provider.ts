/**
 * Unified AI Provider
 *
 * Provides a unified interface for AI text generation with automatic
 * provider fallback. Uses Cerebras as primary (ultra-fast inference)
 * with OpenRouter as fallback.
 *
 * Provider Priority:
 * 1. Cerebras (30 RPM, 60K TPM, ~2,000 tokens/sec - fastest inference)
 * 2. OpenRouter (50 RPD on free tier, fallback only)
 *
 * Note: Groq is reserved exclusively for vision/NSFW detection (1,000 RPD).
 *
 * This abstraction allows seamless failover without changing consumer code.
 */

import { generateWithCerebras, hasCerebrasApiKey, CerebrasError, CEREBRAS_MODELS } from "@/lib/cerebras"
import { generate as generateWithOpenRouter, hasOpenRouterApiKey, OpenRouterError, OPENROUTER_MODELS } from "@/lib/openrouter"

// =============================================================================
// Configuration
// =============================================================================

/** Enable verbose logging (disable in production for performance) */
const VERBOSE_LOGGING = process.env.NODE_ENV === "development"

// =============================================================================
// Types
// =============================================================================

/** Use case hint for model selection */
export type AIUseCase = "enhancement" | "suggestions"

/**
 * Options for unified text generation
 */
export interface AIGenerateOptions {
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
    /** Maximum retry attempts per provider (default: 3) */
    maxRetries?: number
    /** Skip Cerebras and use OpenRouter directly (useful if Cerebras is rate-limited) */
    skipCerebras?: boolean
    /** Use case hint for optimal model selection */
    useCase?: AIUseCase
}

/**
 * Result of generation including provider metadata
 */
export interface AIGenerateResult {
    /** The generated text */
    text: string
    /** Which provider was used */
    provider: "cerebras" | "openrouter"
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Generate text using the best available AI provider.
 *
 * Tries Cerebras first (ultra-fast inference), falls back to OpenRouter
 * if Cerebras fails or is unavailable.
 *
 * @param options - Generation options
 * @returns Generated text and provider metadata
 * @throws AIProviderError if all providers fail
 */
export async function generateText(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const errors: Array<{ provider: string; error: Error }> = []

    // Select OpenRouter model based on use case
    const openRouterModel = options.useCase === "suggestions"
        ? OPENROUTER_MODELS.SUGGESTIONS
        : OPENROUTER_MODELS.PROMPT_ENHANCEMENT

    // Try Cerebras first (if available and not skipped)
    if (!options.skipCerebras && hasCerebrasApiKey()) {
        try {
            if (VERBOSE_LOGGING) {
                console.log("[AI Provider] Attempting Cerebras...")
            }

            const text = await generateWithCerebras({
                model: CEREBRAS_MODELS.TEXT_PRIMARY,
                system: options.system,
                prompt: options.prompt,
                maxTokens: options.maxTokens,
                temperature: options.temperature,
                abortSignal: options.abortSignal,
                maxRetries: options.maxRetries,
            })

            if (VERBOSE_LOGGING) {
                console.log("[AI Provider] Cerebras succeeded")
            }

            return { text, provider: "cerebras" }
        } catch (error) {
            // Don't fallback on abort - user cancelled
            if (error instanceof Error && error.name === "AbortError") {
                throw error
            }

            const err = error instanceof Error ? error : new Error(String(error))
            errors.push({ provider: "cerebras", error: err })

            if (VERBOSE_LOGGING) {
                console.warn("[AI Provider] Cerebras failed, trying OpenRouter:", err.message)
            }
        }
    }

    // Fallback to OpenRouter
    if (hasOpenRouterApiKey()) {
        try {
            if (VERBOSE_LOGGING) {
                console.log("[AI Provider] Attempting OpenRouter...")
            }

            const text = await generateWithOpenRouter({
                model: openRouterModel,
                system: options.system,
                prompt: options.prompt,
                maxOutputTokens: options.maxTokens,
                temperature: options.temperature,
                abortSignal: options.abortSignal,
                maxRetries: options.maxRetries,
                // Disable reasoning for suggestions model (Nemotron)
                disableReasoning: options.useCase === "suggestions",
            })

            if (VERBOSE_LOGGING) {
                console.log("[AI Provider] OpenRouter succeeded")
            }

            return { text, provider: "openrouter" }
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw error
            }

            const err = error instanceof Error ? error : new Error(String(error))
            errors.push({ provider: "openrouter", error: err })

            if (VERBOSE_LOGGING) {
                console.warn("[AI Provider] OpenRouter failed:", err.message)
            }
        }
    }

    // All providers failed
    const errorSummary = errors
        .map(e => `${e.provider}: ${e.error.message}`)
        .join("; ")

    throw new AIProviderError(
        errors.length > 0
            ? `All AI providers failed: ${errorSummary}`
            : "No AI providers configured (missing CEREBRAS_API_KEY and OPENROUTER_API_KEY)",
        "ALL_PROVIDERS_FAILED"
    )
}

/**
 * Check if any AI provider is available
 */
export function hasAnyAIProvider(): boolean {
    return hasCerebrasApiKey() || hasOpenRouterApiKey()
}

/**
 * Get the primary available provider name
 */
export function getPrimaryProvider(): "cerebras" | "openrouter" | null {
    if (hasCerebrasApiKey()) return "cerebras"
    if (hasOpenRouterApiKey()) return "openrouter"
    return null
}

// =============================================================================
// Error Classes
// =============================================================================

/**
 * Error class for unified AI provider errors
 */
export class AIProviderError extends Error {
    constructor(
        message: string,
        public code: string,
        public status?: number
    ) {
        super(message)
        this.name = "AIProviderError"
    }

    /**
     * Create from a provider-specific error
     */
    static fromError(error: unknown): AIProviderError {
        if (error instanceof AIProviderError) {
            return error
        }
        if (error instanceof CerebrasError) {
            return new AIProviderError(error.message, error.code, error.status)
        }
        if (error instanceof OpenRouterError) {
            return new AIProviderError(error.message, error.code, error.status)
        }
        if (error instanceof Error) {
            return new AIProviderError(error.message, "UNKNOWN_ERROR")
        }
        return new AIProviderError("An unknown error occurred", "UNKNOWN_ERROR")
    }
}
