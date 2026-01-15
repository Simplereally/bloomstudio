"use node"

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { analyzeImageContent, calculateSensitivityScore } from "./lib/openrouter";

/**
 * Action to analyze an image using an external vision model.
 * This is run asynchronously via the scheduler.
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
            // Analyze with vision model
            const analysis = await analyzeImageContent(image.url);
            const sensitivityScore = calculateSensitivityScore(analysis);

            // Determine if sensitive based on score (>= 0.5)
            const isSensitive = sensitivityScore >= 0.5;

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
        let unanalyzedImages;
        try {
            unanalyzedImages = await ctx.runQuery(
                internal.generatedImages.getUnanalyzedImages,
                { limit: 20 }
            );
        } catch (error) {
            console.error("Failed to fetch unanalyzed images:", error);
            return;
        }

        for (const image of unanalyzedImages) {
            try {
                await ctx.scheduler.runAfter(0, internal.contentAnalysis.analyzeImage, {
                    imageId: image._id,
                });
            } catch (error) {
                console.error(`Failed to schedule analysis for image ${image._id}:`, error);
            }
        }
    },
});
