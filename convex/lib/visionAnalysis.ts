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

import { analyzeImageWithGroq, hasGroqApiKey, GroqApiError, GroqTimeoutError } from "./groq"
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
 * Analyze image content using Groq with OpenRouter fallback.
 *
 * @param imageUrl - Public URL of the image to analyze
 * @returns Content analysis result with provider metadata
 * @throws Error if all providers fail
 */
export async function analyzeImageContent(imageUrl: string): Promise<ContentAnalysisResult> {
    const errors: Array<{ provider: string; error: Error }> = []

    // Try Groq first (if available)
    if (hasGroqApiKey()) {
        try {
            console.log("[Vision Analysis] Attempting Groq...")

            const result = await analyzeImageWithGroq(imageUrl, CONTENT_ANALYSIS_PROMPT)
            const parsed = parseAnalysisResponse(result.text)

            console.log("[Vision Analysis] Groq succeeded")
            return { ...parsed, provider: "groq" }

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            errors.push({ provider: "groq", error: err })
            console.warn("[Vision Analysis] Groq failed, trying OpenRouter:", err.message)
        }
    }

    // Fallback to OpenRouter (has its own multi-model fallback)
    try {
        console.log("[Vision Analysis] Attempting OpenRouter...")

        const result = await analyzeWithOpenRouter(imageUrl)

        console.log("[Vision Analysis] OpenRouter succeeded")
        return { ...result, provider: "openrouter" }

    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        errors.push({ provider: "openrouter", error: err })
        console.warn("[Vision Analysis] OpenRouter failed:", err.message)
    }

    // All providers failed
    const errorSummary = errors
        .map(e => `${e.provider}: ${e.error.message}`)
        .join("; ")

    throw new VisionAnalysisError(
        errors.length > 0
            ? `All vision providers failed: ${errorSummary}`
            : "No vision providers configured (missing GROQ_API_KEY and OPENROUTER_API_KEY)",
        "ALL_PROVIDERS_FAILED"
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

/**
 * Error class for vision analysis failures
 */
export class VisionAnalysisError extends Error {
    constructor(
        message: string,
        public code: string
    ) {
        super(message)
        this.name = "VisionAnalysisError"
    }
}
