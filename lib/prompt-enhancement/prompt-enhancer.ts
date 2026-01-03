/**
 * Prompt Enhancer
 *
 * Service layer for enhancing image generation prompts using LLM.
 * Provides methods for both main prompts and negative prompts.
 */

import { generate } from "@/lib/openrouter"
import {
  NEGATIVE_PROMPT_ENHANCEMENT_SYSTEM,
  PROMPT_ENHANCEMENT_SYSTEM,
  buildNegativePromptEnhancementMessage,
  buildPromptEnhancementMessage,
} from "./enhancement-prompts"

/**
 * Options for prompt enhancement
 */
export interface EnhanceOptions {
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal
}

/**
 * Result of prompt enhancement
 */
export interface EnhanceResult {
  /** The enhanced prompt text */
  enhancedText: string
}

/**
 * Enhances an image generation prompt for better results.
 *
 * @param prompt - The original prompt to enhance
 * @param options - Enhancement options including abort signal
 * @returns The enhanced prompt text
 */
export async function enhancePrompt(
  prompt: string,
  options?: EnhanceOptions
): Promise<EnhanceResult> {
  if (!prompt.trim()) {
    throw new PromptEnhancementError(
      "Prompt cannot be empty",
      "EMPTY_PROMPT"
    )
  }

  try {
    const enhancedText = await generate({
      system: PROMPT_ENHANCEMENT_SYSTEM,
      prompt: buildPromptEnhancementMessage(prompt),
      abortSignal: options?.abortSignal,
      temperature: 0.7,
      maxOutputTokens: 512,
    })

    // Trim and strip wrapping quotes if present
    let cleanedText = enhancedText.trim()
    if ((cleanedText.startsWith('"') && cleanedText.endsWith('"')) ||
      (cleanedText.startsWith("'") && cleanedText.endsWith("'"))) {
      cleanedText = cleanedText.slice(1, -1).trim()
    }

    return { enhancedText: cleanedText }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new PromptEnhancementError(
        "Enhancement was cancelled",
        "CANCELLED"
      )
    }
    throw PromptEnhancementError.fromError(error)
  }
}

/**
 * Generates or enhances a negative prompt based on the main prompt context.
 *
 * @param mainPrompt - The main image generation prompt for context
 * @param existingNegativePrompt - Optional existing negative prompt to improve
 * @param options - Enhancement options including abort signal
 * @returns The enhanced/generated negative prompt text
 */
export async function enhanceNegativePrompt(
  mainPrompt: string,
  existingNegativePrompt?: string,
  options?: EnhanceOptions
): Promise<EnhanceResult> {
  if (!mainPrompt.trim()) {
    throw new PromptEnhancementError(
      "Main prompt is required for negative prompt generation",
      "EMPTY_MAIN_PROMPT"
    )
  }

  try {
    const enhancedText = await generate({
      system: NEGATIVE_PROMPT_ENHANCEMENT_SYSTEM,
      prompt: buildNegativePromptEnhancementMessage(mainPrompt, existingNegativePrompt),
      abortSignal: options?.abortSignal,
      temperature: 0.7,
      maxOutputTokens: 256,
    })

    // Trim and strip wrapping quotes if present
    let cleanedText = enhancedText.trim()
    if ((cleanedText.startsWith('"') && cleanedText.endsWith('"')) ||
      (cleanedText.startsWith("'") && cleanedText.endsWith("'"))) {
      cleanedText = cleanedText.slice(1, -1).trim()
    }

    return { enhancedText: cleanedText }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new PromptEnhancementError(
        "Enhancement was cancelled",
        "CANCELLED"
      )
    }
    throw PromptEnhancementError.fromError(error)
  }
}

/**
 * Error class for prompt enhancement errors
 */
export class PromptEnhancementError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message)
    this.name = "PromptEnhancementError"
  }

  static fromError(error: unknown): PromptEnhancementError {
    if (error instanceof PromptEnhancementError) {
      return error
    }
    if (error instanceof Error) {
      return new PromptEnhancementError(
        error.message,
        "ENHANCEMENT_FAILED"
      )
    }
    return new PromptEnhancementError(
      "An unknown error occurred during enhancement",
      "UNKNOWN_ERROR"
    )
  }
}
