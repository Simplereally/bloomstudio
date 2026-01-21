/**
 * Types, validators and constants for generated images.
 */
import { v } from "convex/values"
import type { Doc } from "../_generated/dataModel"

/**
 * Maximum number of items allowed in bulk operations to avoid hitting Convex limits.
 * Convex has limits on transaction size and number of reads/writes per transaction.
 */
export const MAX_BULK_OPERATION_SIZE = 100

export const generationParamsValidator = v.object({
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    model: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    seed: v.optional(v.number()),
    enhance: v.optional(v.boolean()),
    private: v.optional(v.boolean()),
    safe: v.optional(v.boolean()),
    image: v.optional(v.string()),
    duration: v.optional(v.number()),
    audio: v.optional(v.boolean()),
    aspectRatio: v.optional(v.string()),
    lastFrameImage: v.optional(v.string()),
})

/** Image with enriched owner display information */
export type EnrichedImage = Doc<"generatedImages"> & {
    ownerName: string
    ownerPictureUrl: string | null
}

/** 
 * Optimized public feed image data for unauthenticated display.
 * Includes only fields needed for feed cards - excludes heavy generationParams.
 * Uses full-size images for quality - thumbnails are too small for feed card dimensions.
 */
export type PublicFeedImage = {
    _id: Doc<"generatedImages">["_id"]
    _creationTime: number
    /** Full-size URL for proper display quality at feed card dimensions */
    url: string
    /** Original full-size URL (for lightbox/download) */
    originalUrl: string
    visibility: "public" | "unlisted"
    createdAt: number
    model: string
    /** Prompt for display (users can copy) */
    prompt: string
    /** Dimensions for aspect ratio calculation */
    width: number | undefined
    height: number | undefined
    /** Seed for display badges */
    seed: number | undefined
    /** MIME type for video detection */
    contentType: string
    /** Owner display name */
    ownerName: string
    /** Owner avatar URL */
    ownerPictureUrl: string | null
    /** Whether content is sensitive */
    isSensitive: boolean
}

/** Lightweight thumbnail data for gallery display (excludes heavy fields like generationParams) */
export type ThumbnailImage = {
    _id: Doc<"generatedImages">["_id"]
    _creationTime: number
    /** URL to display - uses thumbnailUrl if available, otherwise falls back to original */
    url: string
    /** Original full-size URL (for lightbox/download) */
    originalUrl: string
    visibility: "public" | "unlisted"
    createdAt: number
    // Include model for filtering badge display (small field)
    model: string
    // Include contentType for video detection
    contentType: string
}

/** Display-ready image data for history page (includes display fields, excludes generationParams) */
export type DisplayImage = {
    _id: Doc<"generatedImages">["_id"]
    _creationTime: number
    url: string
    visibility: "public" | "unlisted"
    createdAt: number
    model: string
    prompt: string
    width: number | undefined
    height: number | undefined
    seed: number | undefined
    contentType: string
}

/**
 * Determines query strategy for getMyImages based on filter combination.
 * Returns a discriminated union indicating which query path to use.
 */
export type MyImagesQueryStrategy =
    | { type: "no_filters" }
    | { type: "single_model_only"; model: string }
    | { type: "visibility_only"; visibility: "public" | "unlisted" }
    | { type: "visibility_single_model"; visibility: "public" | "unlisted"; model: string }
    | { type: "multi_model_filter"; visibility: "public" | "unlisted" | null; models: string[] }

/**
 * Determines query strategy for getMyImagesWithDisplayData based on filter combination.
 * Returns a discriminated union indicating which query path to use.
 */
export type DisplayDataQueryStrategy =
    | { type: "no_filters" }
    | { type: "single_model_only"; model: string }
    | { type: "visibility_only"; visibility: "public" | "unlisted" }
    | { type: "visibility_single_model"; visibility: "public" | "unlisted"; model: string }
    | { type: "multi_model_filter"; visibility: "public" | "unlisted" | null; models: string[] }
