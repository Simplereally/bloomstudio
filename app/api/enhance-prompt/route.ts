/**
 * Enhance Prompt API Route
 *
 * Server-side endpoint for prompt enhancement using OpenRouter.
 * Handles both prompt and negative prompt enhancement requests.
 *
 * Security:
 * - Requires authentication (returns 401 if not authenticated)
 * - Rate limited to 10 requests per minute per user (returns 429 if exceeded)
 */

import { auth } from "@clerk/nextjs/server"
import { fetchMutation } from "convex/nextjs"
import {
  enhanceNegativePrompt,
  enhancePrompt,
  PromptEnhancementError,
} from "@/lib/prompt-enhancement"
import { NextRequest, NextResponse } from "next/server"
import { api } from "@/convex/_generated/api"

/**
 * Request body schema
 */
interface EnhancePromptRequest {
  /** The main prompt (required for both types) */
  prompt: string
  /** Existing negative prompt (optional, used for negative type) */
  negativePrompt?: string
  /** Type of enhancement: 'prompt' or 'negative' */
  type: "prompt" | "negative"
}

/**
 * Success response schema
 */
interface EnhancePromptSuccessResponse {
  success: true
  data: {
    enhancedText: string
  }
}

/**
 * Error response schema
 */
interface EnhancePromptErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

type EnhancePromptResponse = EnhancePromptSuccessResponse | EnhancePromptErrorResponse

/**
 * POST /api/enhance-prompt
 *
 * Enhances an image generation prompt or negative prompt using LLM.
 * Uses the request.signal to handle client disconnection/cancellation.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<EnhancePromptResponse>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      )
    }

    // Rate limit check
    const rateLimitResult = await fetchMutation(api.rateLimits.checkRateLimit, {
      userId,
      endpoint: "enhance-prompt",
    })

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetAt),
          },
        }
      )
    }

    const body = (await request.json()) as EnhancePromptRequest

    // Validate request
    if (!body.prompt?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Prompt is required",
          },
        },
        { status: 400 }
      )
    }

    if (!body.type || !["prompt", "negative"].includes(body.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Type must be 'prompt' or 'negative'",
          },
        },
        { status: 400 }
      )
    }

    // Perform enhancement based on type
    // Pass the request signal for cancellation support
    const result = body.type === "prompt"
      ? await enhancePrompt(body.prompt, { abortSignal: request.signal })
      : await enhanceNegativePrompt(body.prompt, body.negativePrompt, { abortSignal: request.signal })

    return NextResponse.json(
      {
        success: true,
        data: {
          enhancedText: result.enhancedText,
        },
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetAt),
        },
      }
    )
  } catch (error) {
    // Handle cancellation
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CANCELLED",
            message: "Request was cancelled",
          },
        },
        { status: 499 } // Client Closed Request
      )
    }

    // Handle known enhancement errors
    if (error instanceof PromptEnhancementError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status ?? 500 }
      )
    }

    // Handle unknown errors
    console.error("Enhance prompt error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    )
  }
}

