/**
 * Internal queries and mutations for generated images.
 * Used by cron jobs and other internal functions.
 */
import { v } from "convex/values"
import { internalMutation, internalQuery } from "../_generated/server"

/**
 * Internal query to get image data for analysis.
 * Bypasses visibility checks.
 */
export const getByIdInternal = internalQuery({
    args: { imageId: v.id("generatedImages") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.imageId);
    },
});

/**
 * Internal mutation to update the image with analysis results.
 */
export const updateImageSensitivity = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        isSensitive: v.boolean(),
        confidence: v.number(),
        contentAnalysis: v.object({
            nudity: v.optional(v.string()),
            sexual: v.optional(v.string()),
            violence: v.optional(v.string()),
            analyzedAt: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        // Update main record with lightweight flags
        await ctx.db.patch(args.imageId, {
            isSensitive: args.isSensitive,
            // If vision found it sensitive, update source
            sensitiveSource: "vision_analysis",
            sensitiveConfidence: args.confidence,
        });

        // Update details record with heavy analysis object
        const details = await ctx.db
            .query("generatedImageDetails")
            .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
            .unique();

        if (details) {
            await ctx.db.patch(details._id, {
                contentAnalysis: args.contentAnalysis,
            });
        } else {
            // Create details if missing (legacy data)
            await ctx.db.insert("generatedImageDetails", {
                imageId: args.imageId,
                generationParams: {}, // Required field, placeholder for legacy
                contentAnalysis: args.contentAnalysis,
            });
        }
    },
});

/**
 * Internal mutation to update image with prompt inference results.
 */
export const updateImagePromptInference = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        promptInference: v.object({
            category: v.string(),
            confidence: v.number(),
            reasoning: v.string(),
            provider: v.string(),
            analyzedAt: v.number(),
        }),
        isSensitive: v.optional(v.boolean()), // If decided
        confidence: v.optional(v.number()), // If decided
    },
    handler: async (ctx, args) => {
        // 1. Update main record if sensitivity decision was made
        if (args.isSensitive !== undefined) {
             const updates: Record<string, unknown> = {
                isSensitive: args.isSensitive,
                sensitiveSource: "prompt_inference",
            };
            
            if (args.confidence !== undefined) {
                updates.sensitiveConfidence = args.confidence;
            }
            
            await ctx.db.patch(args.imageId, updates);
        }

        // 2. Update details record with inference data
        const details = await ctx.db
            .query("generatedImageDetails")
            .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
            .unique();

        if (details) {
            await ctx.db.patch(details._id, {
                promptInference: args.promptInference,
            });
        } else {
            // Create details if missing (legacy data)
            await ctx.db.insert("generatedImageDetails", {
                imageId: args.imageId,
                generationParams: {}, // Required field, placeholder for legacy
                promptInference: args.promptInference,
            });
        }
    },
});

/**
 * Find images that haven't been tagged yet for the cron job.
 * Using 'isSensitive' == null (or undefined for legacy)
 */
export const getUnanalyzedImages = internalQuery({
    args: { limit: v.number() },
    handler: async (ctx, args) => {
        // We want images where isSensitive is NULL (pending) or UNDEFINED (legacy).
        // Index `by_sensitivity` contains keys for `isSensitive` values.
        // However, standard indexing of `null` allows efficient lookup.

        // Priority 1: Check explicit nulls (new schema)
        let pending = await ctx.db
            .query("generatedImages")
            .withIndex("by_sensitivity", q => q.eq("isSensitive", null))
            .take(args.limit);

        // Priority 2: Legacy undefined (backlog) - Only if we need more items
        if (pending.length < args.limit) {
            const legacyPending = await ctx.db
                .query("generatedImages")
                // Scan recent first to clear new stuff, or old first? 
                // Default order is sufficient.
                .filter(q => q.eq(q.field("isSensitive"), undefined))
                .take(args.limit - pending.length);

            pending = [...pending, ...legacyPending];
        }

        return pending;
    },
});
