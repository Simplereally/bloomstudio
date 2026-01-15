"use node"

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { analyzeImageContent, calculateSensitivityScore } from "./lib/visionAnalysis";

/**
 * Action to analyze an image using an external vision model.
 * This is run asynchronously via the scheduler.
 * 
 * Uses Groq as primary provider (1,000 RPD free tier) with
 * OpenRouter as fallback (multiple free vision models).
 */
export const analyzeImage = internalAction({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args) => {
        // Use internal query from generatedImages to get image data safely
        const image = await ctx.runQuery(internal.generatedImages.getByIdInternal, {
            imageId: args.imageId,
        });

        if (!image || !image.url) {
            console.log(`Image ${args.imageId} not found or no URL`);
            return;
        }

        try {
            // Analyze with vision model (Groq primary, OpenRouter fallback)
            const analysis = await analyzeImageContent(image.url);
            const sensitivityScore = calculateSensitivityScore(analysis);

            // Determine if sensitive based on score (>= 0.5)
            const isSensitive = sensitivityScore >= 0.5;

            console.log(`[Content Analysis] Image ${args.imageId}: sensitive=${isSensitive}, score=${sensitivityScore}, provider=${analysis.provider}`);

            // Update image with analysis results via internal mutation
            await ctx.runMutation(internal.generatedImages.updateImageSensitivity, {
                imageId: args.imageId,
                isSensitive,
                confidence: isSensitive ? sensitivityScore * (analysis.confidence || 1) : 0,
                contentAnalysis: {
                    nudity: analysis.nudity,
                    sexual: analysis.sexual_content,
                    violence: analysis.violence,
                    analyzedAt: Date.now(),
                },
            });
        } catch (error) {
            console.error(`Failed to analyze image ${args.imageId}:`, error);
        }
    },
});

export const analyzeRecentImages = internalAction({
    args: {},
    handler: async (ctx) => {
        // Groq Free Tier Rate Limits (Llama-4-Scout):
        // 1. Requests Per Minute (RPM): 30
        // 2. Tokens Per Minute (TPM):  30,000 (approx)
        // 3. Requests Per Day (RPD):   1,000
        //
        // Strategy: Maximize throughput for backlog clearing (95% of RPM limit).
        //
        // Math:
        // - Target RPM = 30 * 0.95 = 28.5 -> Floor to 28 requests/min
        // - Token Safety = 28 req * ~1k tokens/req = 28k TPM (within 30k limit)
        // - Daily Limit = At 28 RPM, strict daily limit (1k) is reached in ~35 mins.
        //                 We rely on the OpenRouter fallback when Groq quota is exhausted.
        const GROQ_RPM = 30;
        const UTILIZATION_TARGET = 0.95;
        const MAX_BATCH_SIZE = Math.floor(GROQ_RPM * UTILIZATION_TARGET); // 28

        let unanalyzedImages;
        try {
            unanalyzedImages = await ctx.runQuery(
                internal.generatedImages.getUnanalyzedImages,
                { limit: MAX_BATCH_SIZE }
            );
        } catch (error) {
            console.error("Failed to fetch unanalyzed images:", error);
            return;
        }

        if (unanalyzedImages.length === 0) return;

        // Distribute requests evenly over the minute to avoid bursting and maximize RPM compliance.
        // We use a 59s window to ensure all requests execute within the minute interval
        // without overlapping into the next cron job's window.
        const TOTAL_WINDOW_MS = 59 * 1000;
        const delayPerImage = Math.floor(TOTAL_WINDOW_MS / unanalyzedImages.length);

        console.log(`[Content Analysis] Scheduling ${unanalyzedImages.length} images (Target: ${MAX_BATCH_SIZE}/min) with ${delayPerImage}ms delay`);

        for (let i = 0; i < unanalyzedImages.length; i++) {
            const image = unanalyzedImages[i];
            const delay = i * delayPerImage;

            try {
                await ctx.scheduler.runAfter(delay, internal.contentAnalysis.analyzeImage, {
                    imageId: image._id,
                });
            } catch (error) {
                console.error(`Failed to schedule analysis for image ${image._id}:`, error);
            }
        }
    },
});
