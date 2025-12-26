"use client"

/**
 * useGenerationHistory Hook
 *
 * Reactive hook for accessing generated image history from TanStack Query cache.
 * Reads from the client-side cache populated by useGenerateImage.
 * 
 * This is NOT a query hook - it's a cache subscription. The history cache
 * is written to by useGenerateImage and read reactively here.
 */

import { useSyncExternalStore, useCallback, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query"
import type { GeneratedImage } from "@/lib/schemas/pollinations.schema"

/**
 * Return type for useGenerationHistory hook
 */
export interface UseGenerationHistoryReturn {
    /** List of generated images (newest first) */
    history: GeneratedImage[]
    /** Number of images in history */
    count: number
    /** Get a specific image by ID */
    getById: (id: string) => GeneratedImage | undefined
    /** Clear all history */
    clear: () => void
    /** Remove a specific image from history */
    remove: (id: string) => void
}

const EMPTY_ARRAY: GeneratedImage[] = []

/**
 * Hook for accessing generated image history from the query cache.
 *
 * The history is populated by successful generations from useGenerateImage.
 * This hook subscribes to cache changes and provides utility methods.
 *
 * @example
 * ```tsx
 * const { history, count, getById, clear } = useGenerationHistory()
 *
 * // Display history
 * history.map(image => (
 *   <img key={image.id} src={image.url} alt={image.prompt} />
 * ))
 *
 * // Get specific image
 * const image = getById('img_123')
 *
 * // Clear history
 * <button onClick={clear}>Clear History</button>
 * ```
 */
export function useGenerationHistory(): UseGenerationHistoryReturn {
    const queryClient = useQueryClient()
    
    // Cache the last snapshot to maintain referential equality
    const snapshotRef = useRef<GeneratedImage[]>(EMPTY_ARRAY)

    // Subscribe to cache changes for reactivity
    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
                if (event.query.queryKey[0] === queryKeys.images.history[0] &&
                    event.query.queryKey[1] === queryKeys.images.history[1]) {
                    onStoreChange()
                }
            })
            return unsubscribe
        },
        [queryClient]
    )

    // Read current cache value, returning cached reference if unchanged
    const getSnapshot = useCallback(
        () => {
            const data = queryClient.getQueryData<GeneratedImage[]>(queryKeys.images.history)
            if (data !== undefined && data !== snapshotRef.current) {
                snapshotRef.current = data
            }
            return snapshotRef.current
        },
        [queryClient]
    )

    const history = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

    const getById = (id: string): GeneratedImage | undefined => {
        return history.find((img) => img.id === id)
    }

    const clear = (): void => {
        queryClient.setQueryData<GeneratedImage[]>(
            queryKeys.images.history,
            []
        )
    }

    const remove = (id: string): void => {
        queryClient.setQueryData<GeneratedImage[]>(
            queryKeys.images.history,
            (old = []) => old.filter((img) => img.id !== id)
        )
    }

    return {
        history,
        count: history.length,
        getById,
        clear,
        remove,
    }
}
