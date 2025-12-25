"use client"

/**
 * useGenerateImage Hook
 *
 * TanStack Query mutation hook for server-side image generation.
 * Calls /api/generate which uses the secret key for authentication.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMutation as useConvexMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { queryKeys } from "@/lib/query"
import type {
    ImageGenerationParams,
    GeneratedImage,
} from "@/lib/schemas/pollinations.schema"
import type {
    ServerGenerateResponse,
    ServerGenerateError,
} from "@/lib/schemas/server-generate.schema"

/**
 * Custom error class for server generation errors
 */
export class ServerGenerationError extends Error {
    constructor(
        message: string,
        public code: string,
        public status?: number,
        public details?: Record<string, unknown>
    ) {
        super(message)
        this.name = "ServerGenerationError"
    }
}

/**
 * Options for the useGenerateImage hook
 */
export interface UseGenerateImageOptions {
    /** Callback fired when generation starts */
    onMutate?: (params: ImageGenerationParams) => void | Promise<void>

    /** Callback fired on successful generation */
    onSuccess?: (image: GeneratedImage, params: ImageGenerationParams) => void

    /** Callback fired on generation error */
    onError?: (error: ServerGenerationError, params: ImageGenerationParams) => void

    /** Callback fired after mutation settles (success or error) */
    onSettled?: (
        image: GeneratedImage | undefined,
        error: ServerGenerationError | null,
        params: ImageGenerationParams
    ) => void
}

/**
 * Return type for useGenerateImage hook
 */
export interface UseGenerateImageReturn {
    /** Trigger image generation */
    generate: (params: ImageGenerationParams) => void

    /** Trigger image generation and return a promise */
    generateAsync: (params: ImageGenerationParams) => Promise<GeneratedImage>

    /** Whether generation is in progress */
    isGenerating: boolean

    /** Whether the last generation was successful */
    isSuccess: boolean

    /** Whether the last generation failed */
    isError: boolean

    /** Error from the last failed generation */
    error: ServerGenerationError | null

    /** The last successfully generated image */
    data: GeneratedImage | undefined

    /** Reset the mutation state */
    reset: () => void

    /** Generation progress percentage (for UI feedback) */
    progress: number
}

/** Maximum number of images to keep in history */
const MAX_HISTORY_SIZE = 50

/**
 * Generates an image via the server-side API route.
 */
async function generateImageServer(params: ImageGenerationParams): Promise<GeneratedImage> {
    const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    })

    const data: ServerGenerateResponse = await response.json()

    if (!data.success) {
        const errorData = data as ServerGenerateError
        throw new ServerGenerationError(
            errorData.error.message,
            errorData.error.code,
            response.status,
            errorData.error.details as Record<string, unknown> | undefined
        )
    }

    return data.data
}

/**
 * Hook for generating images via the server-side API route.
 *
 * Provides:
 * - Server-side generation using secret key
 * - Unlimited rate limits (with secret key)
 * - Automatic loading state management
 * - Error handling with typed ServerGenerationError
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
 * generate({
 *   prompt: 'A beautiful sunset',
 *   model: 'flux',
 *   quality: 'hd'
 * })
 * ```
 */
export function useGenerateImage(
    options: UseGenerateImageOptions = {}
): UseGenerateImageReturn {
    const queryClient = useQueryClient()
    const createGeneratedImage = useConvexMutation(api.generatedImages.create)

    const mutation = useMutation<
        GeneratedImage,
        ServerGenerationError,
        ImageGenerationParams
    >({
        mutationFn: generateImageServer,

        onMutate: async (params) => {
            await options.onMutate?.(params)
        },

        onSuccess: async (image, params) => {
            // Invalidate image-related queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.images.all,
            })

            // Add to generation history cache
            queryClient.setQueryData<GeneratedImage[]>(
                queryKeys.images.history,
                (old = []) => [image, ...old].slice(0, MAX_HISTORY_SIZE)
            )

            // Store in Convex if r2Key is present (indicates successful storage)
            if (image.r2Key) {
                try {
                    await createGeneratedImage({
                        visibility: "unlisted", // Default to unlisted
                        r2Key: image.r2Key,
                        url: image.url,
                        filename: image.id,
                        contentType: image.contentType || "image/jpeg",
                        sizeBytes: image.sizeBytes || 0,
                        prompt: image.prompt,
                        model: params.model || "flux",
                        seed: image.params.seed, // Use the seed from the result
                        generationParams: image.params,
                    })
                } catch (error) {
                    console.error("Failed to store image metadata in Convex:", error)
                }
            }

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
        progress: mutation.isPending ? -1 : mutation.isSuccess ? 100 : 0,
    }
}

/**
 * Type guard for ServerGenerationError
 */
export function isServerGenerationError(error: unknown): error is ServerGenerationError {
    return error instanceof ServerGenerationError
}
