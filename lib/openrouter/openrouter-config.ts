/**
 * OpenRouter Configuration
 *
 * Centralized configuration for OpenRouter AI integration.
 * Provides model selection and API key management.
 */

/**
 * Available models for prompt enhancement.
 * Developer-controlled selection - users don't choose the model.
 */
export const OPENROUTER_MODELS = {
  /** Fast, cost-effective model for prompt enhancement */
  PROMPT_ENHANCEMENT: "xiaomi/mimo-v2-flash:free",
} as const

export type OpenRouterModel =
  (typeof OPENROUTER_MODELS)[keyof typeof OPENROUTER_MODELS]

/**
 * OpenRouter configuration
 */
export const OPENROUTER_CONFIG = {
  /** App identification headers for OpenRouter dashboard */
  siteUrl: "https://pixelstream.app",
  siteName: "PixelStream",
} as const

/**
 * Get OpenRouter API key from environment.
 * Only available server-side.
 */
export function getOpenRouterApiKey(): string | undefined {
  if (typeof window !== "undefined") {
    console.warn("OpenRouter API key should only be accessed server-side")
    return undefined
  }
  return process.env.OPENROUTER_API_KEY
}

/**
 * Check if OpenRouter API key is configured
 */
export function hasOpenRouterApiKey(): boolean {
  return !!getOpenRouterApiKey()
}
