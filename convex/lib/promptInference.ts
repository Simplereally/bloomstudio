"use node";

import { fetchWithRetry, DEFAULT_RETRY_CONFIG } from "./retry";

// =============================================================================
// Settings & Constants
// =============================================================================

const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";
const CEREBRAS_MODEL = "llama3.1-8b"; // Fast, cheap, capable enough for classification

export interface PromptInferenceResult {
  isSensitive: boolean;
  category: "explicit" | "suggestive" | "safe";
  confidence: number;
  reasoning: string;
}

// =============================================================================
// Prompt Template
// =============================================================================

const SYSTEM_PROMPT = `
# SYSTEM ROLE
You are a high-precision safety moderation agent for an AI image generation platform. 

# MISSION
Analyze the user's generation prompt provided at the end of this message. You must determine if the resulting image will likely contain NSFW (Not Safe For Work), sensitive, or explicit content.

# CLASSIFICATION RULES
1. **EXPLICIT**: Direct and clear requests for sexual acts, full genitalia, pornographic themes, or extreme graphic violence. 
2. **SUGGESTIVE**: "Bypassing" language, indirect requests for nudity (e.g., "scantily clad", "unzipping", "wet clothes"), provocative posing, or fetish-adjacent descriptions that walk the line of acceptability.
3. **SAFE**: Everything else, including artistic nudity in a clearly non-sexual/classical context or standard cinematic portraits.

# OUTPUT PROTOCOL
- You MUST respond ONLY with a raw JSON object. 
- Do NOT include any preamble, markdown formatting, or "Here is your analysis" text.
- If a prompt is ambiguous but leans towards provocative, classify as "SUGGESTIVE".

# REQUIRED JSON SCHEMA
{
  "isSensitive": boolean,
  "category": "explicit" | "suggestive" | "safe",
  "confidence": number, // (Range: 0.0 to 1.0)
  "reasoning": "string" // (A succinct 1-sentence justification)
}
`.trim();

// =============================================================================
// Core Logic
// =============================================================================

/**
 * Clean and parse the LLM output to ensure valid JSON.
 */
export function parseResult(rawText: string): PromptInferenceResult {
  try {
    // 1. Clean markdown code fences if present
    let cleanText = rawText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```/, "").replace(/```$/, "");
    }
    cleanText = cleanText.trim();

    // 2. Parse JSON
    const parsed = JSON.parse(cleanText);

    // 3. Validate Schema
    if (typeof parsed.isSensitive !== "boolean") {
      throw new Error("Missing or invalid 'isSensitive'");
    }
    if (typeof parsed.confidence !== "number" || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error("Missing or invalid 'confidence' (must be 0-1)");
    }
    if (typeof parsed.reasoning !== "string") {
      throw new Error("Missing or invalid 'reasoning'");
    }
    if (!["explicit", "suggestive", "safe"].includes(parsed.category)) {
      throw new Error("Invalid 'category'");
    }

    return {
      isSensitive: parsed.isSensitive,
      category: parsed.category,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Call Cerebras to analyze the prompt.
 */
export async function analyzePromptWithCerebras(prompt: string): Promise<PromptInferenceResult> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY is not configured");
  }

  const result = await fetchWithRetry(
    CEREBRAS_API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `\n# INPUT PROMPT\n${prompt}` },
        ],
        temperature: 0.1, // Low temp for deterministic classification
        max_tokens: 256,
        response_format: { type: "json_object" }, // Enforce JSON if supported, cleaner
      }),
    },
    (status) => status === 429 || status >= 500, // Retry on rate limits and server errors
    DEFAULT_RETRY_CONFIG,
    "[CerebrasPromptInference]"
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to call Cerebras API");
  }

  const json = await result.data.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from Cerebras");
  }

  console.log(`[PromptInference] Raw LLM Response: ${content}`);

  return parseResult(content);
}

// =============================================================================
// Decision Policy
// =============================================================================

export interface DecisionResult {
  action: "tag_sensitive" | "tag_safe" | "escalate_to_vision";
  inferenceResult: PromptInferenceResult;
}

/**
 * Apply the Phase III decision table logic.
 */
export function decideSensitivity(inference: PromptInferenceResult): DecisionResult {
  const { category, confidence } = inference;

  if (category === "explicit" && confidence >= 0.7) {
    return { action: "tag_sensitive", inferenceResult: inference };
  }
  if (category === "suggestive" && confidence >= 0.85) {
    return { action: "tag_sensitive", inferenceResult: inference };
  }
  if (category === "safe" && confidence >= 0.85) {
    return { action: "tag_safe", inferenceResult: inference };
  }

  return { action: "escalate_to_vision", inferenceResult: inference };
}
