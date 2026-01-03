/**
 * Suggestions API Route
 *
 * Server-side endpoint for generating contextual prompt suggestions.
 * Designed for high-frequency, low-latency calls.
 */

import { generateSuggestions } from "@/lib/prompt-enhancement"
import { NextRequest, NextResponse } from "next/server"

/**
 * Request body schema
 */
interface SuggestionsRequest {
  /** The current prompt text to generate suggestions for */
  prompt: string
}

/**
 * Success response schema
 */
interface SuggestionsSuccessResponse {
  success: true
  data: {
    suggestions: string[]
  }
}

/**
 * Error response schema
 */
interface SuggestionsErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

type SuggestionsResponse = SuggestionsSuccessResponse | SuggestionsErrorResponse

/**
 * POST /api/suggestions
 *
 * Generates contextual prompt suggestions based on user input.
 * Optimized for speed with minimal processing.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SuggestionsResponse>> {
  try {
    const body = (await request.json()) as SuggestionsRequest

    // Validate request - allow empty prompt (returns empty suggestions)
    const prompt = body.prompt?.trim() ?? ""

    // Generate suggestions (returns empty array for short prompts)
    const result = await generateSuggestions(prompt, {
      abortSignal: request.signal,
    })

    return NextResponse.json({
      success: true,
      data: {
        suggestions: result.suggestions,
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

    // Handle unknown errors - return empty suggestions to avoid breaking UI
    console.error("Suggestions API error:", error)
    return NextResponse.json({
      success: true,
      data: {
        suggestions: [],
      },
    })
  }
}
