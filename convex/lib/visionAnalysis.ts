"use node"

/**
 * Unified Vision Analysis
 *
 * Provides content analysis using vision models with automatic provider fallback.
 * Uses Groq as primary (1,000 RPD free tier) with OpenRouter as fallback.
 *
 * Provider Priority:
 * 1. Groq llama-4-scout (1,000 RPD free)
 * 2. OpenRouter free vision models (50 RPD free, multiple model fallback)
 */

import { analyzeImageWithGroq, hasGroqApiKey } from "./groq"
import { analyzeImageContent as analyzeWithOpenRouter, calculateSensitivityScore } from "./openrouter"

// =============================================================================
// Types
// =============================================================================

export interface ContentAnalysisResult {
    nudity: "none" | "partial" | "full"
    sexual_content: "none" | "suggestive" | "explicit"
    violence: "none" | "mild" | "graphic"
    confidence: number
    reasoning: string
    provider: "groq" | "openrouter"
}

// =============================================================================
// Constants
// =============================================================================

/** The analysis prompt for content moderation */
const CONTENT_ANALYSIS_PROMPT = `Analyze this image for content appropriateness. Classify:
1. Nudity: none/partial/full
2. Sexual content: none/suggestive/explicit  
3. Violence: none/mild/graphic

Respond ONLY with valid JSON:
{"nudity":"none|partial|full","sexual_content":"none|suggestive|explicit","violence":"none|mild|graphic","confidence":0.0-1.0,"reasoning":"brief explanation"}`

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Parse the JSON response from vision models.
 * Handles markdown code blocks and validates the structure.
 */
function parseAnalysisResponse(text: string): Omit<ContentAnalysisResult, "provider"> {
    // Remove markdown code block formatting if present
    let jsonContent = text.trim()
    jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()

    try {
        const parsed = JSON.parse(jsonContent)

        // Validate and normalize the response
        return {
            nudity: normalizeLevel(parsed.nudity, ["none", "partial", "full"]),
            sexual_content: normalizeLevel(parsed.sexual_content, ["none", "suggestive", "explicit"]),
            violence: normalizeLevel(parsed.violence, ["none", "mild", "graphic"]),
            confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
            reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "No reasoning provided",
        }
    } catch {
        throw new Error(`Failed to parse analysis response: ${text.substring(0, 200)}`)
    }
}

/**
 * Normalize a level value to one of the allowed values
 */
function normalizeLevel<T extends string>(value: unknown, allowed: T[]): T {
    if (typeof value === "string" && allowed.includes(value.toLowerCase() as T)) {
        return value.toLowerCase() as T
    }
    return allowed[0] // Default to first (safest) option
}

/**
 * Options for analyzeImageContent
 */
export interface AnalyzeImageOptions {
    /**
     * Callback invoked immediately when a provider returns a rate limit error (429).
     * Use this to record the rate limit in the database BEFORE trying the next provider,
     * so other scheduled jobs see the provider is unavailable.
     */
    onRateLimited?: (provider: "groq" | "openrouter", errorBody: string) => Promise<void>
}

/**
 * Analyze image content using Groq with OpenRouter fallback.
 *
 * @param imageUrl - Public URL of the image to analyze
 * @param options - Optional callbacks for immediate rate limit handling
 * @returns Content analysis result with provider metadata
 * @throws VisionAnalysisError if all providers fail, with rate limit info attached
 */
export async function analyzeImageContent(
    imageUrl: string,
    options?: AnalyzeImageOptions
): Promise<ContentAnalysisResult> {
    const errors: Array<{ provider: "groq" | "openrouter"; error: Error }> = []

    // Helper to check if an error is a rate limit error
    const isRateLimitError = (err: Error) => 
        err.message.includes("429") || err.message.toLowerCase().includes("rate limit")

    // Helper to extract error body for rate limit parsing
    const extractErrorBody = (provider: "groq" | "openrouter", err: Error) => {
        let errorBody = err.message
        // For OpenRouter, extract the raw JSON body from the error message
        // Format: "OpenRouter API error: 429 Too Many Requests - {JSON}"
        if (provider === "openrouter") {
            const jsonStart = err.message.indexOf(" - {")
            if (jsonStart !== -1) {
                errorBody = err.message.slice(jsonStart + 3) // Extract from "{" onwards
            }
        }
        return errorBody
    }

    // Try Groq first (if available)
    if (hasGroqApiKey()) {
        try {
            const result = await analyzeImageWithGroq(imageUrl, CONTENT_ANALYSIS_PROMPT)
            const parsed = parseAnalysisResponse(result.text)
            return { ...parsed, provider: "groq" }

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            errors.push({ provider: "groq", error: err })

            if (isRateLimitError(err) && options?.onRateLimited) {
                await options.onRateLimited("groq", extractErrorBody("groq", err))
            }
        }
    }

    // Fallback to OpenRouter (has its own multi-model fallback)
    try {
        const result = await analyzeWithOpenRouter(imageUrl)
        return { ...result, provider: "openrouter" }

    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        errors.push({ provider: "openrouter", error: err })

        if (isRateLimitError(err) && options?.onRateLimited) {
            await options.onRateLimited("openrouter", extractErrorBody("openrouter", err))
        }
    }

    // All providers failed - collect rate limit info for the error
    // (Note: rate limits were already recorded immediately via callback above)
    const rateLimitedProviders: ProviderRateLimitInfo[] = errors
        .filter(e => isRateLimitError(e.error))
        .map(e => ({
            provider: e.provider,
            errorMessage: extractErrorBody(e.provider, e.error),
            is429: true,
        }))

    const errorSummary = errors
        .map(e => `${e.provider}: ${e.error.message}`)
        .join("; ")

    throw new VisionAnalysisError(
        errors.length > 0
            ? `All vision providers failed: ${errorSummary}`
            : "No vision providers configured (missing GROQ_API_KEY and OPENROUTER_API_KEY)",
        "ALL_PROVIDERS_FAILED",
        rateLimitedProviders
    )
}

/**
 * Check if any vision provider is available
 */
export function hasAnyVisionProvider(): boolean {
    return hasGroqApiKey() || !!process.env.OPENROUTER_API_KEY
}

// Re-export the sensitivity score calculator
export { calculateSensitivityScore }

// =============================================================================
// Error Classes
// =============================================================================

export interface ProviderRateLimitInfo {
    provider: "groq" | "openrouter"
    errorMessage: string
    is429: boolean
}

/**
 * Error class for vision analysis failures
 */
export class VisionAnalysisError extends Error {
    public rateLimitedProviders: ProviderRateLimitInfo[]

    constructor(
        message: string,
        public code: string,
        rateLimitedProviders: ProviderRateLimitInfo[] = []
    ) {
        super(message)
        this.name = "VisionAnalysisError"
        this.rateLimitedProviders = rateLimitedProviders
    }
}

