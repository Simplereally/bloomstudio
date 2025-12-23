/**
 * Image API Service
 *
 * Centralized API functions for image operations.
 * Designed to be used with TanStack Query hooks.
 * Following SRP: handles only image-related API operations.
 */

import { PollinationsAPI } from "@/lib/pollinations-api"
import {
    ImageGenerationParamsSchema,
    GeneratedImageSchema,
    type ImageGenerationParams,
    type GeneratedImage,
    type ApiError,
} from "@/lib/schemas/pollinations.schema"

/**
 * Custom error class for API errors with typed details
 */
export class PollinationsApiError extends Error {
    constructor(
        message: string,
        public code?: string,
        public status?: number,
        public details?: Record<string, unknown>
    ) {
        super(message)
        this.name = "PollinationsApiError"
    }
}

/**
 * Response type for image generation operations
 */
export interface GenerateImageResponse {
    image: GeneratedImage
    cached: boolean
}

/**
 * Generates an image using the Pollinations API.
 *
 * @param params - Image generation parameters (validated with Zod)
 * @returns Promise resolving to the generated image data
 * @throws PollinationsApiError if generation fails
 */
export async function generateImage(
    params: ImageGenerationParams
): Promise<GeneratedImage> {
    // Validate params with Zod schema
    const validatedParams = ImageGenerationParamsSchema.parse(params)
    const url = PollinationsAPI.buildImageUrl(validatedParams)

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: PollinationsAPI.getHeaders(),
            // No-store to ensure we trigger generation, not hit cache
            cache: "no-store",
        })

        if (!response.ok) {
            // Try to parse error response
            let errorData: ApiError | undefined
            try {
                errorData = await response.json()
            } catch {
                // Response is not JSON
            }

            throw new PollinationsApiError(
                errorData?.error?.message ??
                `Image generation failed with status ${response.status}`,
                errorData?.error?.code ?? "GENERATION_FAILED",
                response.status,
                errorData?.error?.details as Record<string, unknown> | undefined
            )
        }

        // Build and validate the generated image object
        const generatedImage: GeneratedImage = {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            url,
            prompt: validatedParams.prompt,
            params: validatedParams,
            timestamp: Date.now(),
        }

        return GeneratedImageSchema.parse(generatedImage)
    } catch (error) {
        // Re-throw PollinationsApiError as-is
        if (error instanceof PollinationsApiError) {
            throw error
        }

        // Wrap Zod validation errors
        if (error instanceof Error && error.name === "ZodError") {
            throw new PollinationsApiError(
                "Invalid image generation parameters",
                "VALIDATION_ERROR",
                400
            )
        }

        // Wrap unknown errors
        throw new PollinationsApiError(
            error instanceof Error
                ? error.message
                : "An unexpected error occurred during image generation",
            "UNKNOWN_ERROR"
        )
    }
}

/**
 * Downloads an image as a blob.
 *
 * @param imageUrl - URL of the image to download
 * @returns Promise resolving to the image blob
 */
export async function downloadImage(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl, {
        headers: PollinationsAPI.getHeaders(),
    })

    if (!response.ok) {
        throw new PollinationsApiError(
            "Failed to download image",
            "DOWNLOAD_FAILED",
            response.status
        )
    }

    return response.blob()
}

/**
 * Type guard for PollinationsApiError
 */
export function isApiError(error: unknown): error is PollinationsApiError {
    return error instanceof PollinationsApiError
}

// Re-export for backwards compatibility
export type { ApiError }
