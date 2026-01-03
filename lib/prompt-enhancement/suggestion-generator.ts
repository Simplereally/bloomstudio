/**
 * Prompt Suggestions Generator
 *
 * Service layer for generating contextual prompt suggestions using LLM.
 * Provides real-time suggestions based on user input.
 */

import { generate, OPENROUTER_MODELS } from "@/lib/openrouter"

/**
 * System prompt for generating suggestions
 * Note: "detailed thinking off" disables Nemotron's chain-of-thought reasoning
 */
const SUGGESTIONS_SYSTEM = `detailed thinking off
You are a prompt suggestion assistant for an AI image generation tool.
Return ONLY 3 comma-separated enhancement phrases to compliment the core idea the user is trying to express. No duplicates from input. No explanations.
Rules: 2-4 words each, visually descriptive, no quotes, no numbering.`

/**
 * User prompt template for generating suggestions
 */
function buildSuggestionsPrompt(prompt: string): string {
  return `3 NEW enhancement phrases for this prompt (no words from prompt): "${prompt}"
Format: phrase1,phrase2,phrase3`
}

/**
 * Options for suggestion generation
 */
export interface SuggestionOptions {
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal
}

/**
 * Result of suggestion generation
 */
export interface SuggestionResult {
  /** Array of 3 suggestion phrases */
  suggestions: string[]
}

/**
 * Generates contextual prompt suggestions based on user input.
 *
 * @param prompt - The current prompt text to generate suggestions for
 * @param options - Generation options including abort signal
 * @returns Array of 3 suggestion phrases
 */
export async function generateSuggestions(
  prompt: string,
  options?: SuggestionOptions
): Promise<SuggestionResult> {
  // Return empty for very short prompts
  if (!prompt.trim() || prompt.trim().length < 3) {
    return { suggestions: [] }
  }

  try {
    const response = await generate({
      model: OPENROUTER_MODELS.SUGGESTIONS,
      system: SUGGESTIONS_SYSTEM,
      prompt: buildSuggestionsPrompt(prompt.trim()),
      abortSignal: options?.abortSignal,
      temperature: 0.8, // Slightly higher for creative variety
      maxOutputTokens: 10000, // Needs buffer since reasoning tokens still count even when "disabled"
      disableReasoning: true, // Skip chain-of-thought, just answer directly
    })

    // Parse the comma-separated response
    const suggestions = response
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50) // Filter out empty or too long
      .slice(0, 3) // Ensure max 3

    console.log("[Suggestions] Parsed:", suggestions)

    return { suggestions }
  } catch (error) {
    // Rethrow abort errors for proper cancellation handling
    if (error instanceof Error && (error.name === "AbortError" || error.message.includes("ResponseAborted"))) {
      throw error
    }
    // Log other errors but return empty to avoid breaking the UI
    console.error("Suggestion generation error:", error)
    return { suggestions: [] }
  }
}
