/**
 * Query Key Factory
 *
 * Centralized query key management using the factory pattern.
 * This ensures type-safe, consistent, and predictable cache keys.
 *
 * Pattern: https://tkdodo.eu/blog/effective-react-query-keys
 */

import type { ImageGenerationParams, ImageModel } from "@/types/pollinations"

/**
 * Query key factory for all application queries.
 * Using const assertions for full type inference.
 */
export const queryKeys = {
    /**
     * Image-related queries
     */
    images: {
        /** Base key for all image queries */
        all: ["images"] as const,

        /** List of generated images with optional filters */
        list: (filters?: { model?: ImageModel; limit?: number }) =>
            [...queryKeys.images.all, "list", filters] as const,

        /** Single image by ID */
        detail: (id: string) =>
            [...queryKeys.images.all, "detail", id] as const,

        /** Image generation with specific params (for optimistic updates) */
        generation: (params: ImageGenerationParams) =>
            [...queryKeys.images.all, "generation", params] as const,
    },

    /**
     * Model-related queries
     */
    models: {
        /** Base key for all model queries */
        all: ["models"] as const,

        /** List of available image models */
        imageModels: () => [...queryKeys.models.all, "image"] as const,

        /** List of available text models */
        textModels: () => [...queryKeys.models.all, "text"] as const,

        /** Single model details */
        detail: (id: string) => [...queryKeys.models.all, "detail", id] as const,
    },

    /**
     * User-related queries (for future auth integration)
     */
    user: {
        /** Base key for all user queries */
        all: ["user"] as const,

        /** User preferences */
        preferences: () => [...queryKeys.user.all, "preferences"] as const,

        /** User's saved prompts */
        savedPrompts: () => [...queryKeys.user.all, "savedPrompts"] as const,

        /** User's generation history */
        history: (page?: number) =>
            [...queryKeys.user.all, "history", page] as const,
    },

    /**
     * Configuration queries
     */
    config: {
        /** Base key for all config queries */
        all: ["config"] as const,

        /** API configuration */
        api: () => [...queryKeys.config.all, "api"] as const,

        /** Feature flags */
        features: () => [...queryKeys.config.all, "features"] as const,
    },
} as const

/**
 * Type helper to extract query key types
 */
export type QueryKeys = typeof queryKeys

/**
 * Helper to create invalidation patterns
 */
export const invalidationPatterns = {
    /** Invalidate all image-related queries */
    allImages: () => queryKeys.images.all,

    /** Invalidate all user-related queries */
    allUser: () => queryKeys.user.all,

    /** Invalidate all model-related queries */
    allModels: () => queryKeys.models.all,
} as const
