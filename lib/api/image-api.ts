/**
 * Image API Service
 *
 * Centralized API functions for image operations.
 * These functions are designed to be used with TanStack Query hooks.
 * Following SRP: This module handles only image-related API operations.
 */

import { PollinationsAPI } from "@/lib/pollinations-api"
import type { ImageGenerationParams, GeneratedImage } from "@/types/pollinations"

/**
 * Response type for image generation operations
 */
export interface GenerateImageResponse {
    image: GeneratedImage
    cached: boolean
}

/**
 * Error type for API operations
 */
export interface ApiError {
    message: string
    code?: string
    status?: number
}

/**
 * Generates an image using the Pollinations API.
 *
 * @param params - Image generation parameters
 * @returns Promise resolving to the generated image data
 * @throws ApiError if generation fails
 */
export async function generateImage(
    params: ImageGenerationParams
): Promise<GeneratedImage> {
    const url = PollinationsAPI.buildImageUrl(params)

    try {
        // Fetch the image to trigger generation and ensure it's ready
        const response = await fetch(url, {
            method: "GET",
            // No-store to ensure we trigger generation, not hit cache
            cache: "no-store",
        })

        if (!response.ok) {
            const error: ApiError = {
                message: `Image generation failed with status ${response.status}`,
                status: response.status,
                code: "GENERATION_FAILED",
            }
            throw error
        }

        // Return the image metadata
        const generatedImage: GeneratedImage = {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            url,
            prompt: params.prompt,
            params,
            timestamp: Date.now(),
        }

        return generatedImage
    } catch (error) {
        // Re-throw ApiError as-is
        if (isApiError(error)) {
            throw error
        }

        // Wrap unknown errors
        const apiError: ApiError = {
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred during image generation",
            code: "UNKNOWN_ERROR",
        }
        throw apiError
    }
}

/**
 * Downloads an image as a blob.
 *
 * @param imageUrl - URL of the image to download
 * @returns Promise resolving to the image blob
 */
export async function downloadImage(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl)

    if (!response.ok) {
        throw {
            message: "Failed to download image",
            status: response.status,
            code: "DOWNLOAD_FAILED",
        } as ApiError
    }

    return response.blob()
}

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as ApiError).message === "string"
    )
}
