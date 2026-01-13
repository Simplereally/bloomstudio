"use client"

/**
 * useImageModels Hook
 *
 * Returns available image models from the static MODEL_REGISTRY.
 * No API fetching - uses the centralized model configuration as the source of truth.
 */

import { useMemo } from "react"
import {
    MODEL_REGISTRY,
    type ModelDefinition,
    getModel as getModelFromRegistry,
} from "@/lib/config/models"

/**
 * Options for the useImageModels hook
 */
export interface UseImageModelsOptions {
    /**
     * Filter to only include specific model types
     * @default "image"
     */
    type?: "image" | "video" | "all"
}

/**
 * Return type for useImageModels hook
 */
export interface UseImageModelsReturn {
    /**
     * List of available image models
     */
    models: ModelDefinition[]

    /**
     * Always false - no loading state since data is static
     */
    isLoading: false

    /**
     * Always false - no error state since data is static
     */
    isError: false

    /**
     * Always null - no error since data is static
     */
    error: null

    /**
     * No-op function for API compatibility
     */
    refetch: () => Promise<void>

    /**
     * Get a model by ID
     */
    getModel: (modelId: string) => ModelDefinition | undefined
}

/**
 * Hook for accessing available image models from the static MODEL_REGISTRY.
 * 
 * This replaces the previous API-fetching approach with static configuration,
 * ensuring consistent model metadata (display names, constraints, etc.) that
 * doesn't depend on external API responses.
 *
 * @example
 * ```tsx
 * const { models, getModel } = useImageModels()
 *
 * // In a select component
 * models.map(model => (
 *   <option key={model.id} value={model.id}>
 *     {model.displayName} - {model.description}
 *   </option>
 * ))
 * ```
 */
export function useImageModels(
    options: UseImageModelsOptions = {}
): UseImageModelsReturn {
    const { type = "image" } = options

    // Memoize the model list to prevent unnecessary re-renders
    // Sort alphabetically by displayName, with image models first then video models
    const models = useMemo(() => {
        const allModels = Object.values(MODEL_REGISTRY)

        // Sort function: first by type (image before video), then alphabetically by displayName
        const sortModels = (a: ModelDefinition, b: ModelDefinition) => {
            // Type priority: image = 0, video = 1
            const typeOrder = { image: 0, video: 1 }
            const typeComparison = typeOrder[a.type] - typeOrder[b.type]
            if (typeComparison !== 0) return typeComparison

            // Alphabetically by displayName within the same type
            return a.displayName.localeCompare(b.displayName)
        }

        if (type === "all") {
            return [...allModels].sort(sortModels)
        }

        return allModels.filter(model => model.type === type).sort(sortModels)
    }, [type])

    // Memoize the getModel function
    const getModel = useMemo(
        () => (modelId: string) => getModelFromRegistry(modelId),
        []
    )

    // No-op refetch for API compatibility
    const refetch = async () => {
        // No-op - data is static, no refetching needed
    }

    return {
        models,
        isLoading: false,
        isError: false,
        error: null,
        refetch,
        getModel,
    }
}
