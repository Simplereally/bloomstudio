/**
 * Image API Service
 *
 * Centralized API functions for image operations.
 * Designed to be used with TanStack Query hooks.
 * Following SRP: handles only image-related API operations.
 */

import {
    AllErrorCodes,
    ApiErrorCodeConst,
    ClientErrorCodeConst,
    PollinationsApiError,
} from "@/lib/errors"
import { PollinationsAPI } from "@/lib/pollinations-api"
import {
    GeneratedImageSchema,
    ImageGenerationParamsSchema,
    type ApiError,
    type GeneratedImage,
    type ImageGenerationParams,
} from "@/lib/schemas/pollinations.schema"

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
            throw await PollinationsApiError.fromResponse(response)
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

        // Use the enhanced error class for all other errors
        throw PollinationsApiError.fromError(error)
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
            ClientErrorCodeConst.GENERATION_FAILED,
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

// Re-export error class and types
export { AllErrorCodes, ApiErrorCodeConst, ClientErrorCodeConst as ClientErrorCode, ClientErrorCodeConst, PollinationsApiError }
export type { ApiError }

