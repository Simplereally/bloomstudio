"use node"

import { z } from "zod"

export interface ContentAnalysisResult {
    /** Binary nudity: "none" = clothed/partial skin, "full" = sexual organs visible OR completely nude */
    nudity: "none" | "full";
    sexual_content: "none" | "suggestive" | "explicit";
    violence: "none" | "mild" | "graphic";
    confidence: number;
    reasoning: string;
}

const ANALYSIS_MODEL = "qwen/qwen-2.5-vl-7b-instruct:free"; // Free vision model with image input

/** Timeout for OpenRouter API requests in milliseconds */
const FETCH_TIMEOUT_MS = 30_000; // 30 seconds

/**
 * Custom error class for timeout scenarios, allowing callers to distinguish
 * timeout failures from other error types.
 */
export class OpenRouterTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OpenRouterTimeoutError";
    }
}

/** Dependencies that can be injected for testing */
export interface OpenRouterDeps {
    apiKey: string | undefined;
    fetchFn: (url: string, init?: RequestInit) => Promise<Response>;
    timeoutMs: number;
}

const contentAnalysisSchema = z.object({
    nudity: z.enum(["none", "full"]),
    sexual_content: z.enum(["none", "suggestive", "explicit"]),
    violence: z.enum(["none", "mild", "graphic"]),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
})

function getFirstMessageContent(value: unknown): string | undefined {
    if (!value || typeof value !== "object") {
        return undefined
    }

    const choices = Reflect.get(value, "choices")
    if (!Array.isArray(choices) || choices.length === 0) {
        return undefined
    }

    const firstChoice = choices[0]
    if (!firstChoice || typeof firstChoice !== "object") {
        return undefined
    }

    const message = Reflect.get(firstChoice, "message")
    if (!message || typeof message !== "object") {
        return undefined
    }

    const content = Reflect.get(message, "content")
    return typeof content === "string" ? content : undefined
}

/** Get default dependencies */
const getDefaultDeps = (): OpenRouterDeps => ({
    apiKey: process.env.OPENROUTER_API_KEY,
    fetchFn: fetch,
    timeoutMs: FETCH_TIMEOUT_MS,
});

/**
 * Analyze image content with dependency injection for testing.
 * @internal Exported for testing - use analyzeImageContent() in production
 */
export async function analyzeImageContentWithDeps(
    imageUrl: string,
    deps: OpenRouterDeps
): Promise<ContentAnalysisResult> {
    const { apiKey, fetchFn, timeoutMs } = deps;
    if (!apiKey) {
        console.warn("OPENROUTER_API_KEY is not set, skipping image analysis");
        // Return a safe default so we don't crash, but logged warning
        return {
            nudity: "none",
            sexual_content: "none",
            violence: "none",
            confidence: 0,
            reasoning: "Missing API configuration"
        };
    }

    // Set up AbortController with timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Build request body for logging and sending
    const requestBody = {
        model: ANALYSIS_MODEL,
        messages: [{
            role: "user",
            content: [
                {
                    type: "image_url",
                    image_url: { url: imageUrl }
                },
                {
                    type: "text",
                    text: `Analyze this image for content appropriateness. Classify:
1. Nudity: none/full ("full" = sexual organs visible such as nipples, genitals, anus OR subject is entirely nude with zero clothing. Bikinis, lingerie, or partial skin showing is "none".)
2. Sexual content: none/suggestive/explicit  
3. Violence: none/mild/graphic

Respond ONLY with valid JSON:
{"nudity":"none|full","sexual_content":"none|suggestive|explicit","violence":"none|mild|graphic","confidence":0.0-1.0,"reasoning":"brief explanation"}`
                }
            ]
        }],
        temperature: 0.1,
    };

    try {
        const response = await fetchFn("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });

        // Clear timeout immediately after fetch completes (success or HTTP error)
        clearTimeout(timeoutId);

        if (!response.ok) {
            // Read the error body for more details
            let errorBody = "";
            try {
                errorBody = await response.text();
            } catch {
                // Could not read error body
            }
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const rawData: unknown = await response.json();
        const content = getFirstMessageContent(rawData)

        if (!content) {
            throw new Error("No content received from OpenRouter");
        }

        // Remove any markdown code block formatting if present
        const jsonContent = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');

        const parsedContent: unknown = JSON.parse(jsonContent)
        const validated = contentAnalysisSchema.safeParse(parsedContent)
        if (!validated.success) {
            throw new Error("OpenRouter returned invalid JSON shape")
        }

        return validated.data
    } catch (error) {
        // Ensure timeout is cleared on any error path
        clearTimeout(timeoutId);

        // Handle abort/timeout specifically
        if (error instanceof Error && error.name === "AbortError") {
            const timeoutError = new OpenRouterTimeoutError(
                `OpenRouter API request timed out after ${timeoutMs}ms`
            );
            console.error("Image analysis timeout:", timeoutError.message);
            throw timeoutError;
        }

        console.error("Image analysis failed:", error);
        throw error;
    }
}

/**
 * Analyze image content using OpenRouter API.
 * Public API that uses default dependencies.
 */
export async function analyzeImageContent(imageUrl: string): Promise<ContentAnalysisResult> {
    return analyzeImageContentWithDeps(imageUrl, getDefaultDeps());
}

/**
 * Calculate a sensitivity score from 0-1 based on content analysis.
 * Nudity is now binary: "full" (explicit/nude) scores high, "none" scores 0.
 * Threshold for isSensitive is >= 0.8.
 */
export function calculateSensitivityScore(analysis: ContentAnalysisResult): number {
    let score = 0;

    // Binary nudity: "full" means sexual organs visible OR completely nude
    if (analysis.nudity === "full") score += 0.9;

    if (analysis.sexual_content === "suggestive") score += 0.3;
    if (analysis.sexual_content === "explicit") score += 0.9;

    if (analysis.violence === "mild") score += 0.2;
    if (analysis.violence === "graphic") score += 0.7;

    return Math.min(score, 1);
}
