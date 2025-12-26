/**
 * Convex Database Schema
 *
 * Defines the database tables and their structures.
 */
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
    /**
     * Users table - stores user information and encrypted API keys
     */
    users: defineTable({
        /** Clerk user ID (subject claim from JWT) */
        clerkId: v.string(),
        /** User email from Clerk identity */
        email: v.optional(v.string()),
        /** User's full name from Clerk identity */
        name: v.optional(v.string()),
        /** User's profile picture URL from Clerk identity */
        pictureUrl: v.optional(v.string()),
        /** Encrypted Pollinations API key */
        pollinationsApiKey: v.optional(v.string()),
        /** Timestamp of record creation */
        createdAt: v.number(),
        /** Timestamp of last update */
        updatedAt: v.number(),
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"]),

    /**
     * Generated images - AI-created images from the studio
     */
    generatedImages: defineTable({
        /** Clerk user ID who owns this image */
        ownerId: v.string(),

        /** Visibility: 'public' (in feed) or 'unlisted' (URL-only access) */
        visibility: v.union(v.literal("public"), v.literal("unlisted")),

        /** R2 object key (path within bucket) */
        r2Key: v.string(),

        /** Full public URL to the image */
        url: v.string(),

        /** Generated identifier */
        filename: v.string(),

        /** MIME type (image/jpeg, image/png, image/webp) */
        contentType: v.string(),

        /** File size in bytes */
        sizeBytes: v.number(),

        /** Image dimensions */
        width: v.optional(v.number()),
        height: v.optional(v.number()),

        /** The prompt used to generate the image */
        prompt: v.string(),

        /** Negative prompt if used */
        negativePrompt: v.optional(v.string()),

        /** Model used for generation */
        model: v.string(),

        /** Seed used for generation (-1 if random) */
        seed: v.optional(v.number()),

        /** Full generation parameters for reproducibility */
        generationParams: v.optional(v.any()),

        /** Timestamp of creation */
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_visibility", ["visibility", "createdAt"])
        .index("by_r2_key", ["r2Key"]),

    /**
     * Reference images - user uploads for image-to-image generation
     * Always private (no visibility field)
     */
    referenceImages: defineTable({
        /** Clerk user ID who owns this image */
        ownerId: v.string(),

        /** R2 object key (path within bucket) */
        r2Key: v.string(),

        /** Full public URL to the image */
        url: v.string(),

        /** Original filename */
        filename: v.string(),

        /** MIME type (image/jpeg, image/png, image/webp) */
        contentType: v.string(),

        /** File size in bytes */
        sizeBytes: v.number(),

        /** Image dimensions */
        width: v.optional(v.number()),
        height: v.optional(v.number()),

        /** Timestamp of creation */
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_r2_key", ["r2Key"]),
})
