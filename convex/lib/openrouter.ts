"use node"

export interface ContentAnalysisResult {
    nudity: "none" | "partial" | "full";
    sexual_content: "none" | "suggestive" | "explicit";
    violence: "none" | "mild" | "graphic";
    confidence: number;
    reasoning: string;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ANALYSIS_MODEL = "qwen/qwen2.5-vl-72b:free"; // Free vision model

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

export async function analyzeImageContent(imageUrl: string): Promise<ContentAnalysisResult> {
    if (!OPENROUTER_API_KEY) {
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
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
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
1. Nudity: none/partial/full
2. Sexual content: none/suggestive/explicit  
3. Violence: none/mild/graphic

Respond ONLY with valid JSON:
{"nudity":"none|partial|full","sexual_content":"none|suggestive|explicit","violence":"none|mild|graphic","confidence":0.0-1.0,"reasoning":"brief explanation"}`
                        }
                    ]
                }],
                temperature: 0.1, // Low temp for consistent classification
            }),
            signal: controller.signal,
        });

        // Clear timeout immediately after fetch completes (success or HTTP error)
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No content received from OpenRouter");
        }

        // Remove any markdown code block formatting if present
        const jsonContent = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');

        // Parse JSON response
        return JSON.parse(jsonContent);
    } catch (error) {
        // Ensure timeout is cleared on any error path
        clearTimeout(timeoutId);

        // Handle abort/timeout specifically
        if (error instanceof Error && error.name === "AbortError") {
            const timeoutError = new OpenRouterTimeoutError(
                `OpenRouter API request timed out after ${FETCH_TIMEOUT_MS}ms`
            );
            console.error("Image analysis timeout:", timeoutError.message);
            throw timeoutError;
        }

        console.error("Image analysis failed:", error);
        throw error;
    }
}

export function calculateSensitivityScore(analysis: ContentAnalysisResult): number {
    let score = 0;

    if (analysis.nudity === "partial") score += 0.4;
    if (analysis.nudity === "full") score += 0.9;

    if (analysis.sexual_content === "suggestive") score += 0.3;
    if (analysis.sexual_content === "explicit") score += 0.9;

    if (analysis.violence === "mild") score += 0.2;
    if (analysis.violence === "graphic") score += 0.7;

    return Math.min(score, 1);
}
