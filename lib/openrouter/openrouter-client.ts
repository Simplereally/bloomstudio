/**
 * OpenRouter Client
 *
 * Provides a configured OpenRouter client for AI completions.
 * Uses the Vercel AI SDK provider for OpenRouter.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateText, streamText } from "ai"
import {
  getOpenRouterApiKey,
  OPENROUTER_CONFIG,
  OPENROUTER_MODELS,
  type OpenRouterModel,
} from "./openrouter-config"

/**
 * Creates an OpenRouter client with the configured API key.
 * Should only be called server-side.
 */
export function createOpenRouterClient() {
  const apiKey = getOpenRouterApiKey()

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set")
  }

  return createOpenRouter({
    apiKey,
  })
}

/**
 * Options for text generation
 */
export interface GenerateOptions {
  /** The model to use */
  model?: OpenRouterModel
  /** System prompt */
  system?: string
  /** User prompt */
  prompt: string
  /** Maximum tokens to generate */
  maxOutputTokens?: number
  /** Temperature for randomness (0-2) */
  temperature?: number
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal
}

/**
 * Generate text using OpenRouter (non-streaming, returns complete text).
 * Internally uses streaming for responsiveness but buffers the result.
 */
export async function generate(options: GenerateOptions): Promise<string> {
  const openrouter = createOpenRouterClient()

  const model = options.model ?? OPENROUTER_MODELS.PROMPT_ENHANCEMENT

  const result = await generateText({
    model: openrouter(model),
    system: options.system,
    prompt: options.prompt,
    maxOutputTokens: options.maxOutputTokens ?? 1024,
    temperature: options.temperature ?? 0.7,
    abortSignal: options.abortSignal,
    headers: {
      "HTTP-Referer": OPENROUTER_CONFIG.siteUrl,
      "X-Title": OPENROUTER_CONFIG.siteName,
    },
  })

  return result.text
}

/**
 * Generate text using OpenRouter with streaming.
 * Useful when you need to process tokens as they arrive.
 */
export async function generateStream(options: GenerateOptions) {
  const openrouter = createOpenRouterClient()

  const model = options.model ?? OPENROUTER_MODELS.PROMPT_ENHANCEMENT

  const result = streamText({
    model: openrouter(model),
    system: options.system,
    prompt: options.prompt,
    maxOutputTokens: options.maxOutputTokens ?? 1024,
    temperature: options.temperature ?? 0.7,
    abortSignal: options.abortSignal,
    headers: {
      "HTTP-Referer": OPENROUTER_CONFIG.siteUrl,
      "X-Title": OPENROUTER_CONFIG.siteName,
    },
  })

  return result
}

/**
 * Error class for OpenRouter API errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message)
    this.name = "OpenRouterError"
  }
}
