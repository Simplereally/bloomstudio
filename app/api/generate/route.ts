import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { PollinationsAPI } from "@/lib/pollinations-api"
import { hasSecretKey, getAuthorizationHeader } from "@/lib/auth"
import {
    ServerGenerateRequestSchema,
    type ServerGenerateSuccess,
    type ServerGenerateError,
} from "@/lib/schemas/server-generate.schema"
import { GeneratedImageSchema } from "@/lib/schemas/pollinations.schema"

/**
 * POST /api/generate
 *
 * Server-side image generation endpoint that proxies to gen.pollinations.ai
 * using the secret key from environment variables.
 *
 * Benefits:
 * - Uses secret key for unlimited rate limits
 * - Hides API key from client
 * - Server-side validation with Zod
 */
export async function POST(request: NextRequest): Promise<NextResponse<ServerGenerateSuccess | ServerGenerateError>> {
    try {
        // Check if secret key is configured
        if (!hasSecretKey()) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "CONFIGURATION_ERROR",
                        message: "Server-side generation is not configured. Missing POLLINATIONS_SECRET_KEY.",
                    },
                },
                { status: 503 }
            )
        }

        // Parse and validate request body
        const body = await request.json()
        const validatedParams = ServerGenerateRequestSchema.parse(body)

        // Build the generation URL
        const generationUrl = PollinationsAPI.buildImageUrl(validatedParams)

        // Get the secret key authorization header
        const secretKey = process.env.POLLINATIONS_SECRET_KEY
        const authHeader = getAuthorizationHeader(secretKey)

        // Make the request to Pollinations API
        const response = await fetch(generationUrl, {
            method: "GET",
            headers: {
                ...(authHeader && { Authorization: authHeader }),
            },
            cache: "no-store",
        })

        // Log response details for debugging
        console.log("[/api/generate] Pollinations response:", {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            contentType: response.headers.get("content-type"),
            contentLength: response.headers.get("content-length"),
        })

        if (!response.ok) {
            // Try to parse error from upstream
            let errorMessage = `Generation failed with status ${response.status}`
            let errorCode = "UPSTREAM_ERROR"

            try {
                const errorData = await response.json()
                if (errorData?.error?.message) {
                    errorMessage = errorData.error.message
                }
                if (errorData?.error?.code) {
                    errorCode = errorData.error.code
                }
            } catch {
                // Response is not JSON, use default message
            }

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: errorCode,
                        message: errorMessage,
                        details: { status: response.status },
                    },
                },
                { status: response.status }
            )
        }

        // IMPORTANT: Consume the response body to ensure the image is fully generated
        // and cached by Pollinations before returning the URL to the client.
        // Without this, the client may get a 401 when trying to load the image
        // because it hasn't been cached for unauthenticated access yet.
        const imageBuffer = await response.arrayBuffer()
        const base64Image = Buffer.from(imageBuffer).toString("base64")
        const contentType = response.headers.get("content-type") || "image/jpeg"
        const dataUrl = `data:${contentType};base64,${base64Image}`

        // Build the generated image response
        const generatedImage = GeneratedImageSchema.parse({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            url: dataUrl,
            prompt: validatedParams.prompt,
            params: validatedParams,
            timestamp: Date.now(),
        })

        return NextResponse.json({
            success: true,
            data: generatedImage,
        })
    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid request parameters",
                        details: {
                            issues: error.issues.map((issue) => ({
                                path: issue.path.join("."),
                                message: issue.message,
                            })),
                        },
                    },
                },
                { status: 400 }
            )
        }

        // Handle JSON parse errors
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INVALID_JSON",
                        message: "Request body must be valid JSON",
                    },
                },
                { status: 400 }
            )
        }

        // Handle unexpected errors
        console.error("[/api/generate] Unexpected error:", error)

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

/**
 * GET /api/generate
 *
 * Returns information about the generation endpoint.
 */
export async function GET(): Promise<NextResponse> {
    return NextResponse.json({
        endpoint: "/api/generate",
        method: "POST",
        description: "Server-side image generation using Pollinations API",
        configured: hasSecretKey(),
    })
}
