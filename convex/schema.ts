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
        /**
         * Encrypted Pollinations API key for cross-device persistence.
         * Stored using AES-256-GCM encryption (IV + Ciphertext + AuthTag).
         * Decrypted key is synced to localStorage on login.
         */
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
        /**
         * Content filter preference:
         * - 'block': Do not show sensitive content at all
         * - 'blur': Show sensitive content with a blur overlay (default)
         * - 'allow': Show sensitive content without overlay
         */
        contentFilterPreference: v.optional(
            v.union(
                v.literal("block"),
                v.literal("blur"),
                v.literal("allow")
            )
        ),
        /**
         * Default value for the "Private Mode" toggle in the studio.
         * When true, new generations default to private (unlisted) visibility.
         * Defaults to false if not set.
         */
        defaultPrivate: v.optional(v.boolean()),
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

        /** R2 object key for video preview (scaled/compressed for feeds) */
        previewR2Key: v.optional(v.string()),

        /** Full public URL to the video preview */
        previewUrl: v.optional(v.string()),

        /** Worker-plane secondary asset dispatch state for video derivatives. */
        secondaryAssetsDispatchStatus: v.optional(v.union(
            v.literal("pending"),
            v.literal("dispatched"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed"),
            v.literal("cancelled")
        )),
        secondaryAssetsDispatchAttempts: v.optional(v.number()),
        secondaryAssetsDispatchedAt: v.optional(v.number()),
        secondaryAssetsLastDispatchError: v.optional(v.string()),
        secondaryAssetsClaimToken: v.optional(v.string()),
        secondaryAssetsWorkerAttempt: v.optional(v.number()),
        secondaryAssetsUpdatedAt: v.optional(v.number()),

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

        // --- Sensitive Content Fields ---

        /** Whether the content is flagged as sensitive/NSFW. null = pending/untagged. */
        isSensitive: v.optional(v.union(v.boolean(), v.null())),

        /** Source of the sensitivity tagging */
        sensitiveSource: v.optional(v.union(
            v.literal("prompt_analysis"),
            v.literal("vision_analysis"),
            v.literal("manual_review"),
            v.literal("user_report"),
            v.literal("prompt_inference")
        )),

        /** Confidence score of the automated detection (0-1) */
        sensitiveConfidence: v.optional(v.number()),

        /** Current moderation worker stage coordinating prompt inference vs vision analysis. */
        moderationStage: v.optional(v.union(
            v.literal("prompt_inference"),
            v.literal("vision_analysis")
        )),

        /** Worker-plane moderation dispatch state. */
        moderationDispatchStatus: v.optional(v.union(
            v.literal("pending"),
            v.literal("dispatched"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed"),
            v.literal("cancelled")
        )),
        moderationDispatchAttempts: v.optional(v.number()),
        moderationDispatchedAt: v.optional(v.number()),
        moderationLastDispatchError: v.optional(v.string()),
        moderationClaimToken: v.optional(v.string()),
        moderationWorkerAttempt: v.optional(v.number()),
        moderationProviderRequestId: v.optional(v.string()),
        moderationUpdatedAt: v.optional(v.number()),

        /** Timestamp of creation */
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_visibility", ["visibility", "createdAt"])
        .index("by_r2_key", ["r2Key"])
        // NEW: Composite indexes for filtered queries
        .index("by_owner_visibility", ["ownerId", "visibility", "createdAt"])
        .index("by_owner_model", ["ownerId", "model", "createdAt"])
        .index("by_owner_visibility_model", ["ownerId", "visibility", "model", "createdAt"])
        // Index for "Block" preference (Safe only) or finding pending (isSensitive=null)
        .index("by_visibility_sensitive", ["visibility", "isSensitive", "createdAt"])
        // Index for scanning by sensitivity (e.g. finding pending)
        .index("by_sensitivity", ["isSensitive", "createdAt"])
        .index("by_moderation_dispatch_status", ["moderationDispatchStatus", "moderationUpdatedAt"])
        .index("by_moderation_status_sensitivity", ["moderationDispatchStatus", "isSensitive", "moderationUpdatedAt"])
        .index("by_secondary_assets_dispatch_status", ["secondaryAssetsDispatchStatus", "secondaryAssetsUpdatedAt"]),

    /**
     * Generated Image Details - Heavy fields split from the main table (P0 Optimization)
     * Stores generation parameters and analysis data that are only needed for detail views.
     */
    generatedImageDetails: defineTable({
        /** Reference to the parent image */
        imageId: v.id("generatedImages"),

        /**
         * Full generation parameters for reproducibility.
         * Can be 10-50KB for complex workflows.
         */
        generationParams: v.any(),

        /** Detailed analysis of the content */
        contentAnalysis: v.optional(v.object({
            nudity: v.optional(v.string()), // none, partial, full
            sexual: v.optional(v.string()), // none, suggestive, explicit
            violence: v.optional(v.string()), // none, mild, graphic
            analyzedAt: v.number(),
        })),

        /** Phase III: Prompt Inference Metadata */
        promptInference: v.optional(v.object({
            category: v.string(), // "explicit" | "suggestive" | "safe"
            confidence: v.number(),
            reasoning: v.string(),
            provider: v.string(),
            analyzedAt: v.number(),
        })),
    })
        .index("by_image", ["imageId"]),

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
            v.literal("failed"),
            v.literal("cancelled")
        ),
        /** Generation parameters */
        generationParams: v.any(),
        /** Error message if failed */
        errorMessage: v.optional(v.string()),
        /** HTTP error code from Pollinations API (401=auth, 402=budget, 403=access) */
        errorCode: v.optional(v.number()),
        /** ID of the generated image (when completed) */
        imageId: v.optional(v.id("generatedImages")),
        /** Number of retry attempts made (for transient failures) */
        retryCount: v.optional(v.number()),
        /**
         * Worker-plane dispatch state.
         * Kept separate from the user-facing lifecycle so Cloudflare handoff
         * can be observed and retried without changing the UX contract.
         */
        dispatchStatus: v.optional(v.union(
            v.literal("pending"),
            v.literal("dispatched"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed"),
            v.literal("cancelled")
        )),
        dispatchAttempts: v.optional(v.number()),
        dispatchedAt: v.optional(v.number()),
        lastDispatchError: v.optional(v.string()),
        claimToken: v.optional(v.string()),
        workerAttempt: v.optional(v.number()),
        providerRequestId: v.optional(v.string()),
        /** Timestamp of creation */
        createdAt: v.number(),
        /** Timestamp of last update */
        updatedAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_status", ["status", "createdAt"])
        .index("by_dispatch_status", ["dispatchStatus", "updatedAt"])
        // Optimization for getActiveGenerations (avoid .collect() scan)
        .index("by_owner_status", ["ownerId", "status", "createdAt"]),

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
        /** 
         * Number of items currently in-flight (scheduled but not yet completed).
         * This helps track requests that will still complete after pause/cancel.
         */
        inFlightCount: v.optional(v.number()),
        /** Adaptive inter-item delay (ms) used to reduce provider retry pressure. */
        adaptiveDelayMs: v.optional(v.number()),
        /** Shared generation parameters for all images */
        generationParams: v.any(),
        /** Pollinations API key for BYOP flow (passed from client, stored for processor actions) */
        apiKey: v.optional(v.string()),
        /** IDs of successfully generated images */
        imageIds: v.array(v.id("generatedImages")),
        settledItemIndexes: v.optional(v.array(v.number())),
        /** Number of retry attempts for current item (for transient failures) */
        currentItemRetryCount: v.optional(v.number()),
        /** Last HTTP error code from Pollinations API (401=auth, 402=budget, 403=access) */
        lastErrorCode: v.optional(v.number()),
        /** Timestamp of creation */
        createdAt: v.number(),
        /** Timestamp of last update */
        updatedAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_status", ["status", "createdAt"])
        // Optimization for getActiveGenerations (avoid .collect() scan)
        .index("by_owner_status", ["ownerId", "status", "createdAt"]),

    /**
     * Batch generation items - first-class rows for each item in a batch job.
     * This avoids using the parent batch job doc as both aggregate state and queue state.
     */
    batchItems: defineTable({
        /** Parent batch job */
        batchJobId: v.id("batchJobs"),
        /** Clerk user ID who owns this item */
        ownerId: v.string(),
        /** Zero-based item position within the batch */
        itemIndex: v.number(),
        /** Item lifecycle status */
        status: v.union(
            v.literal("pending"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed"),
            v.literal("cancelled")
        ),
        /** Worker-plane dispatch status */
        dispatchStatus: v.union(
            v.literal("pending"),
            v.literal("dispatched"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed"),
            v.literal("cancelled")
        ),
        /** Number of dispatch attempts from Convex to Cloudflare */
        dispatchAttempts: v.optional(v.number()),
        /** Last time this item was dispatched */
        dispatchedAt: v.optional(v.number()),
        /** Last dispatch error message */
        lastDispatchError: v.optional(v.string()),
        /** Worker claim token for idempotent finalize/fail callbacks */
        claimToken: v.optional(v.string()),
        /** Worker attempt count for reclaim/retry handling */
        workerAttempt: v.optional(v.number()),
        /** Pollinations/provider request ID if available */
        providerRequestId: v.optional(v.string()),
        /** Final generated image ID */
        imageId: v.optional(v.id("generatedImages")),
        /** Final error message */
        errorMessage: v.optional(v.string()),
        /** Final provider error code */
        errorCode: v.optional(v.number()),
        /** Number of retries used by the worker */
        retryCount: v.optional(v.number()),
        /** Timestamp of creation */
        createdAt: v.number(),
        /** Timestamp of last update */
        updatedAt: v.number(),
    })
        .index("by_batch_item", ["batchJobId", "itemIndex"])
        .index("by_batch_status", ["batchJobId", "status", "itemIndex"])
        .index("by_owner_status", ["ownerId", "status", "createdAt"])
        .index("by_dispatch_status", ["dispatchStatus", "updatedAt"]),

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

    /**
     * Provider health tracking - monitors rate limit status for vision analysis providers
     * Prevents wasteful API calls when providers are rate-limited
     */
    providerHealth: defineTable({
        /** Provider identifier */
        provider: v.union(v.literal("groq"), v.literal("openrouter")),
        /** Whether the provider is currently available for requests */
        isAvailable: v.boolean(),
        /** Unix timestamp (ms) when the rate limit resets and provider becomes available */
        rateLimitedUntil: v.optional(v.number()),
        /** Last error message received from the provider */
        lastError: v.optional(v.string()),
        /** Unix timestamp (ms) of the last health check */
        lastChecked: v.number(),
        /** Number of remaining requests in the current window (if known) */
        remainingRequests: v.optional(v.number()),
        /** Maximum requests allowed in the window (if known) */
        requestLimit: v.optional(v.number()),
    }).index("by_provider", ["provider"]),

    /**
     * Background job scheduler state for deduplicating self-rescheduling actions.
     */
    backgroundJobState: defineTable({
        /** Stable logical job name, e.g. moderation recovery. */
        jobName: v.string(),
        /** Next scheduled execution time in unix ms. */
        nextRunAt: v.optional(v.number()),
        /** Token passed to the scheduled action so stale runs can no-op. */
        scheduledToken: v.optional(v.string()),
        /** Most recent execution start time in unix ms. */
        lastRunAt: v.optional(v.number()),
        /** Last mutation time for debugging. */
        updatedAt: v.number(),
    }).index("by_job_name", ["jobName"]),

    /**
     * Music generations - AI-generated music tracks from the music studio
     * Persists generation history with reaction tracking (like/dislike).
     */
    musicGenerations: defineTable({
        /** Clerk user ID who owns this generation */
        ownerId: v.string(),
        /** The prompt used to generate the track */
        prompt: v.string(),
        /** User-editable track title (auto-derived from prompt on creation) */
        title: v.optional(v.string()),
        /** Model used for generation (e.g. "suno-v5", "suno-v4.5", "elevenmusic") */
        model: v.string(),
        /** Whether instrumental mode was used */
        instrumental: v.boolean(),
        /** Optional lyrics provided by the user */
        lyrics: v.optional(v.string()),
        /** Estimated track duration in seconds (parsed from response blob size) */
        estimatedDuration: v.optional(v.number()),
        /** R2 object key for the audio file */
        r2Key: v.optional(v.string()),
        /** Public URL for the persisted audio file (served from R2 CDN) */
        audioUrl: v.optional(v.string()),
        /** Audio file size in bytes */
        audioSizeBytes: v.optional(v.number()),
        /** User reaction: "like", "dislike", or null (no reaction) */
        reaction: v.optional(v.union(v.literal("like"), v.literal("dislike"))),
        /** Timestamp of creation */
        createdAt: v.number(),
    })
        .index("by_owner", ["ownerId", "createdAt"])
        .index("by_owner_reaction", ["ownerId", "reaction", "createdAt"]),

})
