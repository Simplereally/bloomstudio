"use client"

/**
 * useGenerateImage Hook
 *
 * TanStack Query mutation hook for image generation.
 * Provides optimistic updates, error handling, and cache management.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { generateImage, type ApiError } from "@/lib/api"
import { queryKeys } from "@/lib/query"
import type { ImageGenerationParams, GeneratedImage } from "@/types/pollinations"

/**
 * Options for the useGenerateImage hook
 */
export interface UseGenerateImageOptions {
    /**
     * Callback fired when generation starts
     */
    onMutate?: (params: ImageGenerationParams) => void

    /**
     * Callback fired on successful generation
     */
    onSuccess?: (image: GeneratedImage, params: ImageGenerationParams) => void

    /**
     * Callback fired on generation error
     */
    onError?: (error: ApiError, params: ImageGenerationParams) => void

    /**
     * Callback fired after mutation settles (success or error)
     */
    onSettled?: (
        image: GeneratedImage | undefined,
        error: ApiError | null,
        params: ImageGenerationParams
    ) => void
}

/**
 * Return type for useGenerateImage hook
 */
export interface UseGenerateImageReturn {
    /**
     * Trigger image generation
     */
    generate: (params: ImageGenerationParams) => void

    /**
     * Trigger image generation and return a promise
     */
    generateAsync: (params: ImageGenerationParams) => Promise<GeneratedImage>

    /**
     * Whether generation is in progress
     */
    isGenerating: boolean

    /**
     * Whether the last generation was successful
     */
    isSuccess: boolean

    /**
     * Whether the last generation failed
     */
    isError: boolean

    /**
     * Error from the last failed generation
     */
    error: ApiError | null

    /**
     * The last successfully generated image
     */
    data: GeneratedImage | undefined

    /**
     * Reset the mutation state
     */
    reset: () => void
}

/**
 * Hook for generating images with TanStack Query.
 *
 * Provides:
 * - Automatic loading state management
 * - Error handling with typed errors
 * - Optional callbacks for side effects
 * - Integration with the query cache
 *
 * @example
 * ```tsx
 * const { generate, isGenerating, error } = useGenerateImage({
 *   onSuccess: (image) => {
 *     console.log('Generated:', image.url)
 *   }
 * })
 *
 * // Trigger generation
 * generate({ prompt: 'A beautiful sunset', model: 'flux' })
 * ```
 */
export function useGenerateImage(
    options: UseGenerateImageOptions = {}
): UseGenerateImageReturn {
    const queryClient = useQueryClient()

    const mutation = useMutation<
        GeneratedImage,
        ApiError,
        ImageGenerationParams
    >({
        mutationFn: generateImage,

        onMutate: (params) => {
            options.onMutate?.(params)
        },

        onSuccess: (image, params) => {
            // Invalidate image list queries to include the new image
            queryClient.invalidateQueries({
                queryKey: queryKeys.images.all,
            })

            options.onSuccess?.(image, params)
        },

        onError: (error, params) => {
            options.onError?.(error, params)
        },

        onSettled: (image, error, params) => {
            options.onSettled?.(image, error, params)
        },
    })

    return {
        generate: mutation.mutate,
        generateAsync: mutation.mutateAsync,
        isGenerating: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        error: mutation.error,
        data: mutation.data,
        reset: mutation.reset,
    }
}
