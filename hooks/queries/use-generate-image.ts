"use client"

/**
 * useGenerateImage Hook
 *
 * Hook for server-side image generation using Convex actions.
 * Uses the user's stored Pollinations API key for authentication.
 * 
 * This is a "fire and forget" pattern - the generation happens on Convex servers.
 * The hook tracks generation status and calls callbacks when complete.
 */

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type {
    GeneratedImage,
    ImageGenerationParams,
    VideoGenerationParams,
} from "@/lib/schemas/pollinations.schema"
import { ConvexError } from "convex/values"
import { useMutation, useQuery } from "convex/react"
import * as React from "react"

/**
 * Extract error code from a ConvexError's data payload.
 * Returns the code if present, otherwise undefined.
 */
function getConvexErrorCode(err: unknown): string | undefined {
    if (err instanceof ConvexError) {
        const data = err.data as { code?: string } | string
        if (typeof data === "object" && data !== null && "code" in data) {
            return data.code
        }
    }
    return undefined
}

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
        params: ImageGenerationParams | VideoGenerationParams
    ) => void
}

/**
 * Return type for useGenerateImage hook
 */
export interface UseGenerateImageReturn {
    /** Trigger image generation */
    generate: (params: ImageGenerationParams | VideoGenerationParams) => void

    /** Trigger image generation and return a promise */
    generateAsync: (params: ImageGenerationParams | VideoGenerationParams) => Promise<GeneratedImage>

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

/**
 * Hook for generating images via Convex server-side processing.
 *
 * Uses the user's stored Pollinations API key for authentication.
 * Generation happens on Convex servers - users can close their browser
 * and the generation will still complete.
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
 *   model: 'zimage',
 * })
 * ```
 */
export function useGenerateImage(
    options: UseGenerateImageOptions = {}
): UseGenerateImageReturn {
    const startGeneration = useMutation(api.singleGeneration.startGeneration)

    // Track generation state
    const [generationId, setGenerationId] = React.useState<Id<"pendingGenerations"> | null>(null)
    const [currentParams, setCurrentParams] = React.useState<ImageGenerationParams | VideoGenerationParams | null>(null)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [isError, setIsError] = React.useState(false)
    const [error, setError] = React.useState<ServerGenerationError | null>(null)
    const [data, setData] = React.useState<GeneratedImage | undefined>(undefined)

    // Watch the generation status
    const generationStatus = useQuery(
        api.singleGeneration.getGenerationStatus,
        generationId ? { generationId } : "skip"
    )

    // Get the generated image when complete
    const generatedImageId = generationStatus?.status === "completed" ? generationStatus.imageId : undefined
    const generatedImage = useQuery(
        api.generatedImages.getById,
        generatedImageId ? { imageId: generatedImageId } : "skip"
    )

    // Handle generation completion
    React.useEffect(() => {
        if (!generationStatus || !currentParams) return

        if (generationStatus.status === "completed" && generatedImage) {
            // Build the GeneratedImage object from Convex data
            const image: GeneratedImage = {
                id: generatedImage._id,
                url: generatedImage.url,
                prompt: generatedImage.prompt,
                params: generatedImage.generationParams || currentParams,
                timestamp: generatedImage.createdAt,
                r2Key: generatedImage.r2Key,
                sizeBytes: generatedImage.sizeBytes,
                contentType: generatedImage.contentType,
            }

            setData(image)
            setIsSuccess(true)
            setIsGenerating(false)
            setGenerationId(null)

            options.onSuccess?.(image, currentParams)
            options.onSettled?.(image, null, currentParams)
        } else if (generationStatus.status === "failed") {
            const err = new ServerGenerationError(
                generationStatus.errorMessage || "Generation failed",
                "GENERATION_FAILED"
            )
            setError(err)
            setIsError(true)
            setIsGenerating(false)
            setGenerationId(null)

            options.onError?.(err, currentParams)
            options.onSettled?.(undefined, err, currentParams)
        }
    }, [generationStatus, generatedImage, currentParams, options])

    // Generate function
    const generate = React.useCallback(
        async (params: ImageGenerationParams | VideoGenerationParams) => {
            // Reset state
            setIsSuccess(false)
            setIsError(false)
            setError(null)
            setData(undefined)
            setIsGenerating(true)
            setCurrentParams(params)

            await options.onMutate?.(params)

            try {
                const id = await startGeneration({
                    generationParams: {
                        prompt: params.prompt,
                        negativePrompt: params.negativePrompt,
                        model: params.model,
                        width: params.width,
                        height: params.height,
                        seed: params.seed,
                        enhance: params.enhance,
                        private: params.private,
                        safe: params.safe,
                        image: params.image,
                        // @ts-ignore - Video params
                        duration: params.duration,
                        // @ts-ignore - Video params
                        audio: params.audio,
                        // @ts-ignore - Video params
                        aspectRatio: params.aspectRatio,
                        // @ts-ignore - Video params
                        lastFrameImage: params.lastFrameImage,
                    },
                })
                setGenerationId(id)
            } catch (err) {
                // Extract error code from ConvexError or fall back to generic
                const errorCode = getConvexErrorCode(err) ?? "START_FAILED"
                const message = err instanceof Error ? err.message : "Failed to start generation"

                const serverError = new ServerGenerationError(
                    message,
                    errorCode
                )
                setError(serverError)
                setIsError(true)
                setIsGenerating(false)
                options.onError?.(serverError, params)
                options.onSettled?.(undefined, serverError, params)
            }
        },
        [startGeneration, options]
    )

    // Generate async function (returns a promise)
    const generateAsync = React.useCallback(
        (params: ImageGenerationParams | VideoGenerationParams): Promise<GeneratedImage> => {
            return new Promise((resolve, reject) => {
                // Store the resolve/reject callbacks
                const originalOnSuccess = options.onSuccess
                const originalOnError = options.onError

                // Temporarily override callbacks
                options.onSuccess = (image, p) => {
                    originalOnSuccess?.(image, p)
                    resolve(image)
                }
                options.onError = (err, p) => {
                    originalOnError?.(err, p)
                    reject(err)
                }

                generate(params)

                // Restore original callbacks after a tick
                setTimeout(() => {
                    options.onSuccess = originalOnSuccess
                    options.onError = originalOnError
                }, 0)
            })
        },
        [generate, options]
    )

    // Reset function
    const reset = React.useCallback(() => {
        setGenerationId(null)
        setCurrentParams(null)
        setIsGenerating(false)
        setIsSuccess(false)
        setIsError(false)
        setError(null)
        setData(undefined)
    }, [])

    return {
        generate,
        generateAsync,
        isGenerating,
        isSuccess,
        isError,
        error,
        data,
        reset,
        progress: isGenerating ? -1 : isSuccess ? 100 : 0,
    }
}

/**
 * Type guard for ServerGenerationError
 */
export function isServerGenerationError(error: unknown): error is ServerGenerationError {
    return error instanceof ServerGenerationError
}
