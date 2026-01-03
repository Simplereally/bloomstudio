/**
 * Enhance Prompt API Route
 *
 * Server-side endpoint for prompt enhancement using OpenRouter.
 * Handles both prompt and negative prompt enhancement requests.
 */

import {
    enhanceNegativePrompt,
    enhancePrompt,
    PromptEnhancementError,
} from "@/lib/prompt-enhancement"
import { NextRequest, NextResponse } from "next/server"

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

    return NextResponse.json({
      success: true,
      data: {
        enhancedText: result.enhancedText,
      },
    })
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
