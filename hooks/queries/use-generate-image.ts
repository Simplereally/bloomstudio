"use client"

/**
 * useGenerateImage Hook
 *
 * Hook for server-side image generation using Convex actions.
 * Uses the client-provided Pollinations API key from BYOP context.
 * 
 * BYOP (Bring Your Own Pollen) Flow:
 * 1. Hook reads API key from PollenAuth context (sourced from encrypted Convex storage)
 * 2. API key is passed to the Convex mutation
 * 3. Mutation schedules server-side processing with the key
 * 4. Generation happens on Convex servers - users can close their browser
 */

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { usePollenApiKey, usePollenAuthActions, useNeedsReconnect } from "@/lib/pollen-auth"
import { usePollenBalance } from "@/hooks/use-pollen-balance"
import type {
    GeneratedImage,
    ImageGenerationParams,
    VideoGenerationParams,
} from "@/lib/schemas/pollinations.schema"
import { ConvexError } from "convex/values"
import { useAction, useConvex, useMutation, useQuery } from "convex/react"
import * as React from "react"

const SINGLE_GENERATION_DISPATCH_INTERVAL_MS = 100

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
interface ActiveGenerationEntry {
    id: Id<"pendingGenerations">
    params: ImageGenerationParams | VideoGenerationParams
    resolve?: (image: GeneratedImage) => void
    reject?: (error: ServerGenerationError) => void
}

interface PendingDispatchEntry {
    generationId: Id<"pendingGenerations">
    apiKey: string
}

export interface UseGenerateImageReturn {
    /** Trigger image generation */
    generate: (params: ImageGenerationParams | VideoGenerationParams) => void

    /** Trigger image generation and return a promise */
    generateAsync: (params: ImageGenerationParams | VideoGenerationParams) => Promise<GeneratedImage>

    /** Cancel a specific in-flight generation */
    cancelGenerationById: (generationId: Id<"pendingGenerations">) => Promise<void>

    /** Cancel the latest tracked in-flight generation */
    cancelCurrentGeneration: () => Promise<void>

    /** Latest tracked generation ID (if any) */
    currentGenerationId: Id<"pendingGenerations"> | null

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
    const cancelGeneration = useMutation(api.singleGeneration.cancelGeneration)
    const dispatchGeneration = useAction(api.singleGeneration.dispatchGeneration)

    // Get API key from BYOP context
    const apiKey = usePollenApiKey()
    const { authorize } = usePollenAuthActions()
    const { setNeedsReconnect } = useNeedsReconnect()

    // Get balance invalidation function for post-generation refresh
    const { invalidateBalance } = usePollenBalance()

    // Stable ref for callbacks — avoids stale closures and effect re-fires
    const callbacksRef = React.useRef(options)
    React.useEffect(() => {
        callbacksRef.current = options
    })

    const convex = useConvex()

    // Track generation state
    const [activeGenerations, setActiveGenerations] = React.useState<ActiveGenerationEntry[]>([])
    const [currentGenerationId, setCurrentGenerationId] = React.useState<Id<"pendingGenerations"> | null>(null)
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [isError, setIsError] = React.useState(false)
    const [error, setError] = React.useState<ServerGenerationError | null>(null)
    const [data, setData] = React.useState<GeneratedImage | undefined>(undefined)

    const activeGenerationsRef = React.useRef(activeGenerations)
    React.useEffect(() => {
        activeGenerationsRef.current = activeGenerations
    }, [activeGenerations])

    const pendingDispatchesRef = React.useRef<PendingDispatchEntry[]>([])
    const dispatchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const scheduleDispatchQueue = React.useCallback(() => {
        if (dispatchTimerRef.current !== null) {
            return
        }

        const flushNext = () => {
            const next = pendingDispatchesRef.current.shift()
            if (!next) {
                dispatchTimerRef.current = null
                return
            }

            void Promise.resolve(
                dispatchGeneration({
                    generationId: next.generationId,
                    apiKey: next.apiKey,
                })
            ).catch((dispatchError) => {
                console.error("Failed to dispatch generation immediately:", dispatchError)
            })

            dispatchTimerRef.current = setTimeout(
                flushNext,
                SINGLE_GENERATION_DISPATCH_INTERVAL_MS
            )
        }

        flushNext()
    }, [dispatchGeneration])

    const enqueueGenerationDispatch = React.useCallback(
        (entry: PendingDispatchEntry) => {
            pendingDispatchesRef.current.push(entry)
            scheduleDispatchQueue()
        },
        [scheduleDispatchQueue]
    )

    React.useEffect(() => {
        return () => {
            if (dispatchTimerRef.current !== null) {
                clearTimeout(dispatchTimerRef.current)
                dispatchTimerRef.current = null
            }
        }
    }, [])

    const activeGenerationIds = React.useMemo(
        () => activeGenerations.map((entry) => entry.id),
        [activeGenerations]
    )

    const isGenerating = activeGenerationIds.length > 0

    // Watch statuses for all active generations in one query.
    // The server query throws TOO_MANY_IDS for >100 IDs, so we cap
    // the polling window to the 100 most-recently started generations
    // (last elements in the array, which are appended in start order).
    const MAX_POLLED_IDS = 100
    const polledGenerationIds = React.useMemo(
        () =>
            activeGenerationIds.length > MAX_POLLED_IDS
                ? activeGenerationIds.slice(-MAX_POLLED_IDS)
                : activeGenerationIds,
        [activeGenerationIds]
    )

    const generationStatuses = useQuery(
        api.singleGeneration.getGenerationsStatus,
        polledGenerationIds.length > 0
            ? { generationIds: polledGenerationIds }
            : "skip"
    )

    const processingGenerationIdsRef = React.useRef<Set<string>>(new Set())

    // Handle completion for every active generation
    React.useEffect(() => {
        if (!generationStatuses || generationStatuses.length === 0) return

        let cancelled = false

        const processStatuses = async () => {
            for (const generationStatus of generationStatuses) {
                const generationId = generationStatus._id
                const processingKey = generationId as string

                if (processingGenerationIdsRef.current.has(processingKey)) {
                    continue
                }

                if (
                    generationStatus.status !== "completed" &&
                    generationStatus.status !== "failed" &&
                    generationStatus.status !== "cancelled"
                ) {
                    continue
                }

                const entry = activeGenerationsRef.current.find((item) => item.id === generationId)
                if (!entry) {
                    continue
                }

                processingGenerationIdsRef.current.add(processingKey)

                try {
                    if (generationStatus.status === "completed") {
                        if (!generationStatus.imageId) {
                            const err = new ServerGenerationError(
                                "Generation completed but no image ID was returned",
                                "MISSING_IMAGE_ID"
                            )

                            if (!cancelled) {
                                setError(err)
                                setIsError(true)
                            }

                            callbacksRef.current.onError?.(err, entry.params)
                            callbacksRef.current.onSettled?.(undefined, err, entry.params)
                            entry.reject?.(err)
                        } else {
                            let generatedImage: Awaited<
                                ReturnType<typeof convex.query<typeof api.generatedImages.getById>>
                            >
                            let fetchFailed = false

                            try {
                                generatedImage = await convex.query(api.generatedImages.getById, {
                                    imageId: generationStatus.imageId,
                                })
                            } catch (queryError) {
                                fetchFailed = true
                                const message =
                                    queryError instanceof Error
                                        ? queryError.message
                                        : "Failed to fetch generated image"
                                const err = new ServerGenerationError(
                                    message,
                                    "IMAGE_FETCH_FAILED"
                                )

                                if (!cancelled) {
                                    setError(err)
                                    setIsError(true)
                                }

                                callbacksRef.current.onError?.(err, entry.params)
                                callbacksRef.current.onSettled?.(undefined, err, entry.params)
                                entry.reject?.(err)
                                generatedImage = null
                            }

                            if (!fetchFailed && generatedImage === null) {
                                const err = new ServerGenerationError(
                                    "Generation completed but image could not be found",
                                    "IMAGE_NOT_FOUND"
                                )

                                if (!cancelled) {
                                    setError(err)
                                    setIsError(true)
                                }

                                callbacksRef.current.onError?.(err, entry.params)
                                callbacksRef.current.onSettled?.(undefined, err, entry.params)
                                entry.reject?.(err)
                            } else if (generatedImage) {
                                const image: GeneratedImage = {
                                    id: generatedImage._id,
                                    url: generatedImage.url,
                                    prompt: generatedImage.prompt,
                                    params: entry.params as GeneratedImage["params"],
                                    timestamp: generatedImage.createdAt,
                                    r2Key: generatedImage.r2Key,
                                    sizeBytes: generatedImage.sizeBytes,
                                    contentType: generatedImage.contentType,
                                }

                                if (!cancelled) {
                                    setData(image)
                                    setIsSuccess(true)
                                    invalidateBalance()
                                }

                                callbacksRef.current.onSuccess?.(image, entry.params)
                                callbacksRef.current.onSettled?.(image, null, entry.params)
                                entry.resolve?.(image)
                            }
                        }
                    } else if (generationStatus.status === "failed") {
                        const errorCode = generationStatus.errorCode
                        let codeString = "GENERATION_FAILED"

                        if (errorCode === 401) {
                            codeString = "AUTH_ERROR"
                            setNeedsReconnect(true)
                        } else if (errorCode === 402) {
                            codeString = "BUDGET_EXHAUSTED"
                        } else if (errorCode === 403) {
                            codeString = "MODEL_ACCESS_DENIED"
                        }

                        const err = new ServerGenerationError(
                            generationStatus.errorMessage || "Generation failed",
                            codeString,
                            errorCode
                        )

                        if (!cancelled) {
                            setError(err)
                            setIsError(true)
                            invalidateBalance()
                        }

                        callbacksRef.current.onError?.(err, entry.params)
                        callbacksRef.current.onSettled?.(undefined, err, entry.params)
                        entry.reject?.(err)
                    } else {
                        callbacksRef.current.onSettled?.(undefined, null, entry.params)
                        entry.reject?.(
                            new ServerGenerationError(
                                "Generation cancelled",
                                "CANCELLED"
                            )
                        )
                    }
                } finally {
                    if (!cancelled) {
                        setActiveGenerations((prev) => {
                            const remaining = prev.filter((item) => item.id !== generationId)

                            setCurrentGenerationId((prevId) => {
                                if (prevId !== generationId) return prevId
                                // The current ID just finished — fall back to the latest remaining
                                return remaining.length > 0
                                    ? remaining[remaining.length - 1].id
                                    : null
                            })

                            return remaining
                        })
                    }
                    processingGenerationIdsRef.current.delete(processingKey)
                }
            }
        }

        void processStatuses()

        return () => {
            cancelled = true
        }
    }, [generationStatuses, convex, invalidateBalance, setNeedsReconnect])

    const startTrackedGeneration = React.useCallback(
        async (
            params: ImageGenerationParams | VideoGenerationParams,
            deferred?: {
                resolve: (image: GeneratedImage) => void
                reject: (error: ServerGenerationError) => void
            }
        ) => {
            setIsSuccess(false)
            setIsError(false)
            setError(null)

            try {
                await callbacksRef.current.onMutate?.(params)
            } catch (onMutateError) {
                const message = onMutateError instanceof Error ? onMutateError.message : "onMutate callback failed"
                const err = new ServerGenerationError(message, "MUTATE_CALLBACK_FAILED")
                setError(err)
                setIsError(true)
                callbacksRef.current.onError?.(err, params)
                callbacksRef.current.onSettled?.(undefined, err, params)
                deferred?.reject(err)
                return
            }

            if (!apiKey) {
                const err = new ServerGenerationError(
                    "Not connected to Pollinations. Please connect to Pollinations first.",
                    "NOT_AUTHORIZED"
                )
                setError(err)
                setIsError(true)
                callbacksRef.current.onError?.(err, params)
                callbacksRef.current.onSettled?.(undefined, err, params)
                deferred?.reject(err)
                authorize()
                return
            }

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
                        duration: "duration" in params ? params.duration : undefined,
                        audio: "audio" in params ? params.audio : undefined,
                        aspectRatio: "aspectRatio" in params ? params.aspectRatio : undefined,
                        lastFrameImage: "lastFrameImage" in params ? params.lastFrameImage : undefined,
                    },
                    apiKey,
                })

                setCurrentGenerationId(id)
                setActiveGenerations((prev) => [
                    ...prev,
                    {
                        id,
                        params,
                        resolve: deferred?.resolve,
                        reject: deferred?.reject,
                    },
                ])

                enqueueGenerationDispatch({
                    generationId: id,
                    apiKey,
                })
            } catch (err) {
                const errorCode = getConvexErrorCode(err) ?? "START_FAILED"
                const message = err instanceof Error ? err.message : "Failed to start generation"
                const serverError = new ServerGenerationError(message, errorCode)

                setError(serverError)
                setIsError(true)
                callbacksRef.current.onError?.(serverError, params)
                callbacksRef.current.onSettled?.(undefined, serverError, params)
                deferred?.reject(serverError)
            }
        },
        [apiKey, authorize, enqueueGenerationDispatch, startGeneration]
    )

    const generate = React.useCallback(
        (params: ImageGenerationParams | VideoGenerationParams) => {
            void startTrackedGeneration(params)
        },
        [startTrackedGeneration]
    )

    const generateAsync = React.useCallback(
        (params: ImageGenerationParams | VideoGenerationParams): Promise<GeneratedImage> => {
            return new Promise((resolve, reject) => {
                void startTrackedGeneration(params, { resolve, reject })
            })
        },
        [startTrackedGeneration]
    )

    const cancelGenerationById = React.useCallback(
        async (id: Id<"pendingGenerations">) => {
            let result: { success: boolean }
            try {
                result = await cancelGeneration({ generationId: id })
            } catch (err) {
                // Server call failed — do NOT remove local entries so UI stays consistent
                const message = err instanceof Error ? err.message : "Failed to cancel generation"
                throw new ServerGenerationError(message, "CANCEL_FAILED")
            }

            if (!result.success) {
                // Generation was already completed/failed/cancelled — don't tear down local state
                return
            }

            const entry = activeGenerationsRef.current.find((item) => item.id === id)
            if (entry) {
                callbacksRef.current.onSettled?.(undefined, null, entry.params)
                entry.reject?.(
                    new ServerGenerationError("Generation cancelled", "CANCELLED")
                )
            }

            setActiveGenerations((prev) => {
                const remaining = prev.filter((item) => item.id !== id)

                setCurrentGenerationId((prevId) => {
                    if (prevId !== id) return prevId
                    return remaining.length > 0
                        ? remaining[remaining.length - 1].id
                        : null
                })

                return remaining
            })
        },
        [cancelGeneration]
    )

    const cancelCurrentGeneration = React.useCallback(async () => {
        if (!currentGenerationId) return
        await cancelGenerationById(currentGenerationId)
    }, [cancelGenerationById, currentGenerationId])

    const reset = React.useCallback(() => {
        // Fire-and-forget server cancellation for each active generation
        for (const entry of activeGenerationsRef.current) {
            void cancelGeneration({ generationId: entry.id }).catch(() => {
                // Ignore cancellation failures during reset
            })
            entry.reject?.(
                new ServerGenerationError("Generation cancelled", "CANCELLED")
            )
        }

        setActiveGenerations([])
        setCurrentGenerationId(null)
        setIsSuccess(false)
        setIsError(false)
        setError(null)
        setData(undefined)
    }, [cancelGeneration])

    return {
        generate,
        generateAsync,
        cancelGenerationById,
        cancelCurrentGeneration,
        currentGenerationId,
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
