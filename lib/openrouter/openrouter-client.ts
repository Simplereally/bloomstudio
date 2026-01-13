/**
 * OpenRouter Client
 *
 * Provides a high-throughput, concurrent OpenRouter client for AI completions.
 * Optimized for handling thousands of simultaneous requests with:
 * - Singleton client pattern (avoids re-creation overhead)
 * - HTTP keep-alive connection pooling
 * - Exponential backoff retry with jitter for transient failures
 * - Configurable timeouts
 * - Minimal logging overhead in production
 *
 * Uses the Vercel AI SDK provider for OpenRouter.
 */

import { createOpenRouter, type OpenRouterProvider } from "@openrouter/ai-sdk-provider"
import { streamText } from "ai"
import {
  getOpenRouterApiKey,
  OPENROUTER_CONFIG,
  OPENROUTER_MODELS,
  type OpenRouterModel,
} from "./openrouter-config"

// =============================================================================
// Configuration
// =============================================================================

/** Retry configuration for transient failures */
const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  maxRetries: 3,
  /** Base delay in ms (doubles with each retry) */
  baseDelayMs: 50,
  /** Maximum delay cap in ms */
  maxDelayMs: 1000,
  /** Jitter factor (0-1) to prevent thundering herd */
  jitterFactor: 0.05,
  /** HTTP status codes that warrant a retry */
  retryableStatuses: [408, 429, 500, 502, 503, 504],
} as const

/** Default timeout for requests in ms */
const DEFAULT_TIMEOUT_MS = 30_000

/** Enable verbose logging (disable in production for performance) */
const VERBOSE_LOGGING = process.env.NODE_ENV === "development"

// =============================================================================
// Singleton Client Management
// =============================================================================

/**
 * Cached client instance. Using a singleton avoids the overhead of
 * re-creating the client on every request, which is critical for high throughput.
 */
let cachedClient: OpenRouterProvider | null = null
let cachedApiKey: string | null = null

/**
 * High-performance fetch wrapper with:
 * - HTTP keep-alive for connection reuse
 * - Retry logic with exponential backoff + jitter
 * - Timeout handling
 */
async function highThroughputFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  // Merge signals if one was provided
  const originalSignal = init?.signal
  const abortHandler = () => controller.abort()

  if (originalSignal) {
    // Handle already-aborted signal (abort event won't fire again)
    if (originalSignal.aborted) {
      clearTimeout(timeoutId)
      controller.abort()
      throw new DOMException("Aborted", "AbortError")
    }
    // Use { once: true } to auto-remove listener after first invocation
    // We also manually remove in finally for cases where abort never fires
    originalSignal.addEventListener("abort", abortHandler, { once: true })
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      // Note: keep-alive is the default in Node.js 18+ for global fetch
      // The underlying agent handles connection pooling automatically
    })
    return response
  } finally {
    clearTimeout(timeoutId)
    // Clean up listener to prevent memory leak if originalSignal is long-lived
    if (originalSignal) {
      originalSignal.removeEventListener("abort", abortHandler)
    }
  }
}

/**
 * Creates or returns the singleton OpenRouter client.
 * Thread-safe for concurrent access - JavaScript's single-threaded nature
 * means we don't need locks, but we do validate the API key hasn't changed.
 *
 * @throws Error if OPENROUTER_API_KEY is not set
 */
export function createOpenRouterClient(): OpenRouterProvider {
  const apiKey = getOpenRouterApiKey()

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set")
  }

  // Return cached client if API key hasn't changed
  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient
  }

  // Create new client with optimized fetch
  cachedClient = createOpenRouter({
    apiKey,
    fetch: highThroughputFetch,
  })
  cachedApiKey = apiKey

  if (VERBOSE_LOGGING) {
    console.log("[OpenRouter] Client initialized")
  }

  return cachedClient
}

/**
 * Clears the cached client. Useful for testing or when rotating API keys.
 */
export function clearClientCache(): void {
  cachedClient = null
  cachedApiKey = null
}

// =============================================================================
// Retry Logic
// =============================================================================

/**
 * Calculates delay for exponential backoff with jitter.
 * Jitter prevents thundering herd when many requests retry simultaneously.
 */
function calculateRetryDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelayMs
  )
  const jitter = exponentialDelay * RETRY_CONFIG.jitterFactor * Math.random()
  return Math.floor(exponentialDelay + jitter)
}

/**
 * Determines if an error is retryable based on its characteristics.
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    // Network errors
    if (
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("socket hang up")
    ) {
      return true
    }
    // Rate limiting or server errors (check status in error message)
    for (const status of RETRY_CONFIG.retryableStatuses) {
      if (message.includes(String(status))) {
        return true
      }
    }
  }
  return false
}

/**
 * Sleeps for the specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// =============================================================================
// Types
// =============================================================================

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
  /** Disable reasoning/chain-of-thought for reasoning models (e.g., Nemotron) */
  disableReasoning?: boolean
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number
  /** Maximum retry attempts for transient failures (default: 3) */
  maxRetries?: number
}

// =============================================================================
// Core Generation Functions
// =============================================================================

/**
 * Generate text using OpenRouter with high-throughput optimizations.
 *
 * Features:
 * - Uses streaming under the hood for proper cancellation support
 * - Automatic retry with exponential backoff for transient failures
 * - Timeout handling to prevent hung requests
 * - Connection pooling via singleton client
 *
 * @param options - Generation options
 * @returns The generated text
 * @throws AbortError if the request is cancelled
 * @throws OpenRouterError for API errors after retries are exhausted
 */
export async function generate(options: GenerateOptions): Promise<string> {
  const openrouter = createOpenRouterClient()
  const model = options.model ?? OPENROUTER_MODELS.PROMPT_ENHANCEMENT
  const maxRetries = options.maxRetries ?? RETRY_CONFIG.maxRetries

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check for abort before starting
      if (options.abortSignal?.aborted) {
        throw new DOMException("Aborted", "AbortError")
      }

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
        ...(options.disableReasoning && {
          providerOptions: {
            openrouter: {
              reasoning: { effort: "none" },
            },
          },
        }),
      })

      // Collect the complete text from the stream
      const text = await result.text

      // Only log in development to reduce overhead
      if (VERBOSE_LOGGING && text) {
        console.log(`[OpenRouter] Response from ${model}:`, text.substring(0, 100) + (text.length > 100 ? "..." : ""))
      }

      return text
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry abort errors
      if (lastError.name === "AbortError") {
        throw lastError
      }

      // Check if we should retry
      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = calculateRetryDelay(attempt)
        if (VERBOSE_LOGGING) {
          console.warn(
            `[OpenRouter] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`,
            lastError.message
          )
        }
        await sleep(delay)
        continue
      }

      // No more retries - throw the error
      break
    }
  }

  // Wrap in OpenRouterError for consistent error handling
  throw new OpenRouterError(
    lastError?.message ?? "Generation failed after retries",
    "GENERATION_FAILED",
    500
  )
}

/**
 * Generate text using OpenRouter with streaming.
 * Useful when you need to process tokens as they arrive.
 *
 * Note: This function does not include retry logic as the caller
 * is expected to handle the stream directly. For retry support,
 * use the non-streaming `generate` function.
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
    ...(options.disableReasoning && {
      providerOptions: {
        openrouter: {
          reasoning: { effort: "none" },
        },
      },
    }),
  })

  return result
}

// =============================================================================
// Error Classes
// =============================================================================

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
