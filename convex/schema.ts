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
        /** User-chosen or auto-generated display username (privacy-preserving) */
        username: v.optional(v.string()),
        /** User's profile picture URL from Clerk identity */
        pictureUrl: v.optional(v.string()),
        /** Encrypted Pollinations API key */
        pollinationsApiKey: v.optional(v.string()),
        /** Timestamp of record creation */
        createdAt: v.number(),
        /** Timestamp of last update */
        updatedAt: v.number(),
        /** Count of followers */
        followersCount: v.optional(v.number()),
        /** Count of following */
        followingCount: v.optional(v.number()),
        /** Count of public images */
        imagesCount: v.optional(v.number()),
    })
        .index("by_clerk_id", ["clerkId"])
        .index("by_email", ["email"])
        .index("by_username", ["username"]),

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

        /** R2 object key for thumbnail (128x128, compressed) */
        thumbnailR2Key: v.optional(v.string()),

        /** Full public URL to the thumbnail */
        thumbnailUrl: v.optional(v.string()),

        /** Generated identifier */
        filename: v.string(),

        /** MIME type (image/jpeg, image/png, image/webp) */
        contentType: v.string(),

        /** File size in bytes */
        sizeBytes: v.number(),

        /** Image dimensions */
        width: v.optional(v.number()),
        height: v.optional(v.number()),

        /** Aspect ratio (max/min of dimensions) for filtering extreme ratios */
        aspectRatio: v.optional(v.number()),

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
        .index("by_r2_key", ["r2Key"])
        // NEW: Composite indexes for filtered queries
        .index("by_owner_visibility", ["ownerId", "visibility", "createdAt"])
        .index("by_owner_model", ["ownerId", "model", "createdAt"])
        .index("by_owner_visibility_model", ["ownerId", "visibility", "model", "createdAt"]),

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

    /**
     * Follows table - tracks user relationships
     */
    follows: defineTable({
        /** Clerk user ID of the follower */
        followerId: v.string(),
        /** Clerk user ID of the user being followed */
        followeeId: v.string(),
        /** Timestamp of when the follow occurred */
        createdAt: v.number(),
    })
        .index("by_follower", ["followerId"])
        .index("by_followee", ["followeeId"])
        .index("by_both", ["followerId", "followeeId"]),

    /**
     * Favorites table - tracks user's favorited images
     */
    favorites: defineTable({
        /** Clerk user ID of the user who favorited */
        userId: v.string(),
        /** ID of the favorited image */
        imageId: v.id("generatedImages"),
        /** Timestamp of when the favorite occurred */
        createdAt: v.number(),
    })
        .index("by_user", ["userId", "createdAt"])
        .index("by_image", ["imageId"])
        .index("by_user_image", ["userId", "imageId"]),

    /**
     * Pending single image generations - tracks async single image generation
     */
    pendingGenerations: defineTable({
        /** Clerk user ID who owns this generation */
        ownerId: v.string(),
        /** Job status */
        status: v.union(
            v.literal("pending"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed")
        ),
        /** Generation parameters */
        generationParams: v.any(),
        /** Error message if failed */
        errorMessage: v.optional(v.string()),
        /** ID of the generated image (when completed) */
        imageId: v.optional(v.id("generatedImages")),
        /** Number of retry attempts made (for transient failures) */
        retryCount: v.optional(v.number()),
        /** Timestamp of creation */
        createdAt: v.number(),
        /** Timestamp of last update */
        updatedAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_status", ["status", "createdAt"]),

    /**
     * Batch generation jobs - tracks async batch image generation
     */
    batchJobs: defineTable({
        /** Clerk user ID who owns this batch job */
        ownerId: v.string(),
        /** Job status */
        status: v.union(
            v.literal("pending"),
            v.literal("processing"),
            v.literal("paused"),
            v.literal("completed"),
            v.literal("cancelled"),
            v.literal("failed")
        ),
        /** Total number of images to generate */
        totalCount: v.number(),
        /** Number of successfully generated images */
        completedCount: v.number(),
        /** Number of failed generations */
        failedCount: v.number(),
        /** Current item index being processed */
        currentIndex: v.number(),
        /** Shared generation parameters for all images */
        generationParams: v.any(),
        /** IDs of successfully generated images */
        imageIds: v.array(v.id("generatedImages")),
        /** Number of retry attempts for current item (for transient failures) */
        currentItemRetryCount: v.optional(v.number()),
        /** Timestamp of creation */
        createdAt: v.number(),
        /** Timestamp of last update */
        updatedAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_status", ["status", "createdAt"]),

    /**
     * Prompts table - shared prompts that can be saved to user libraries
     * A single prompt is stored once, but many users can reference it
     */
    prompts: defineTable({
        /** Title of the prompt */
        title: v.string(),
        /** The actual prompt content */
        content: v.string(),
        /** Type of prompt */
        type: v.union(v.literal("positive"), v.literal("negative")),
        /** Tags for categorization and search (lowercased, comma-separated internally) */
        tags: v.array(v.string()),
        /** Category for grouping */
        category: v.optional(v.string()),
        /** Hash of content for efficient duplicate detection */
        contentHash: v.string(),
        /** Number of users who have this in their library (for cleanup) */
        referenceCount: v.number(),
        /** Timestamp of creation */
        createdAt: v.number(),
    })
        .index("by_content_hash", ["contentHash"])
        .index("by_type", ["type", "createdAt"])
        .index("by_category", ["category", "createdAt"])
        .searchIndex("search_prompts", {
            searchField: "content",
            filterFields: ["type", "category"],
        }),

    /**
     * User prompt library - join table linking users to their saved prompts
     */
    userPromptLibrary: defineTable({
        /** Clerk user ID */
        userId: v.string(),
        /** Reference to the prompt */
        promptId: v.id("prompts"),
        /** Timestamp of when user added to library */
        createdAt: v.number(),
    })
        .index("by_user", ["userId", "createdAt"])
        .index("by_prompt", ["promptId"])
        .index("by_user_prompt", ["userId", "promptId"]),

    /**
     * Rate limits table - tracks API rate limiting per user/endpoint
     * Uses a sliding window algorithm to count requests within a time window.
     */
    rateLimits: defineTable({
        /** Unique key combining endpoint and user ID, e.g. "enhance-prompt:user_123" */
        key: v.string(),
        /** Number of requests made in the current window */
        count: v.number(),
        /** Timestamp when the current window started */
        windowStart: v.number(),
    }).index("by_key", ["key"])
        .index("by_windowStart", ["windowStart"]),
})
