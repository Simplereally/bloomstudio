/**
 * Suggestions API Route
 *
 * Server-side endpoint for generating contextual prompt suggestions.
 * Designed for high-frequency, low-latency calls.
 *
 * Security:
 * - Requires authentication (returns 401 if not authenticated)
 * - Rate limited to 20 requests per minute per user (returns 429 if exceeded)
 */

import { auth } from "@clerk/nextjs/server"
import { fetchMutation } from "convex/nextjs"
import { generateSuggestions } from "@/lib/prompt-enhancement"
import { NextRequest, NextResponse } from "next/server"
import { api } from "@/convex/_generated/api"

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
      endpoint: "suggestions",
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

    const body = (await request.json()) as SuggestionsRequest

    // Validate request - allow empty prompt (returns empty suggestions)
    const prompt = body.prompt?.trim() ?? ""

    // Generate suggestions (returns empty array for short prompts)
    const result = await generateSuggestions(prompt, {
      abortSignal: request.signal,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          suggestions: result.suggestions,
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

