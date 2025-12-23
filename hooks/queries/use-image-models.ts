"use client"

/**
 * useImageModels Hook
 *
 * TanStack Query hook for fetching available image models from the API.
 * Provides caching, automatic refetching, and error handling.
 */

import { useQuery } from "@tanstack/react-query"
import { fetchImageModels } from "@/lib/api/models-api"
import { queryKeys } from "@/lib/query"
import type { ImageModelInfo } from "@/lib/schemas/pollinations.schema"
import type { PollinationsApiError } from "@/lib/api/image-api"

/**
 * Options for the useImageModels hook
 */
export interface UseImageModelsOptions {
    /**
     * Whether to fetch models on mount
     * @default true
     */
    enabled?: boolean

    /**
     * Stale time in milliseconds
     * @default 5 minutes
     */
    staleTime?: number
}

/**
 * Return type for useImageModels hook
 */
export interface UseImageModelsReturn {
    /**
     * List of available image models
     */
    models: ImageModelInfo[]

    /**
     * Whether the query is loading
     */
    isLoading: boolean

    /**
     * Whether there was an error fetching models
     */
    isError: boolean

    /**
     * Error object if fetch failed
     */
    error: PollinationsApiError | null

    /**
     * Refetch models
     */
    refetch: () => Promise<void>

    /**
     * Get a model by name or alias
     */
    getModel: (nameOrAlias: string) => ImageModelInfo | undefined
}

/**
 * Hook for fetching available image models from the Pollinations API.
 *
 * @example
 * ```tsx
 * const { models, isLoading, getModel } = useImageModels()
 *
 * // In a select component
 * models.map(model => (
 *   <option key={model.name} value={model.name}>
 *     {model.name} - {model.description}
 *   </option>
 * ))
 * ```
 */
export function useImageModels(
    options: UseImageModelsOptions = {}
): UseImageModelsReturn {
    const {
        enabled = true,
        staleTime = 5 * 60 * 1000, // 5 minutes
    } = options

    const query = useQuery<ImageModelInfo[], PollinationsApiError>({
        queryKey: queryKeys.models.image,
        queryFn: fetchImageModels,
        enabled,
        staleTime,
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    })

    const models = query.data ?? []

    const getModel = (nameOrAlias: string): ImageModelInfo | undefined => {
        return models.find(
            (m) => m.name === nameOrAlias || m.aliases.includes(nameOrAlias)
        )
    }

    const refetch = async () => {
        await query.refetch()
    }

    return {
        models,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch,
        getModel,
    }
}
