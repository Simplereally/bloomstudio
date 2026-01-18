"use node"

import { internalAction, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { analyzeImageContent, calculateSensitivityScore, VisionAnalysisError } from "./lib/visionAnalysis";
import { analyzePromptWithCerebras, decideSensitivity } from "./lib/promptInference";

/** Delay between requests in ms (targets ~28 RPM for Groq) */
const DELAY_BETWEEN_REQUESTS_MS = 2100;

/** Max images per batch (95% of Groq's 30 RPM limit) */
const MAX_BATCH_SIZE = 28;

/**
 * Analyze a single image. Called internally by analyzeRecentImages.
 * Returns true if analysis succeeded, false if rate-limited (should stop batch).
 */
async function analyzeOneImage(
    ctx: ActionCtx,
    imageId: Id<"generatedImages">,
    imageUrl: string,
    onRateLimited: (provider: "groq" | "openrouter", errorBody: string) => Promise<void>
): Promise<{ success: boolean; rateLimited: boolean }> {
    try {
        const analysis = await analyzeImageContent(imageUrl, { onRateLimited });
        const sensitivityScore = calculateSensitivityScore(analysis);
        // Threshold updated: >= 0.8 required to mark as sensitive (was 0.5)
        const isSensitive = sensitivityScore >= 0.8;

        await ctx.runMutation(internal.generatedImages.updateImageSensitivity, {
            imageId,
            isSensitive,
            confidence: isSensitive ? sensitivityScore * (analysis.confidence || 1) : 0,
            contentAnalysis: {
                nudity: analysis.nudity,
                sexual: analysis.sexual_content,
                violence: analysis.violence,
                analyzedAt: Date.now(),
            },
        });

        return { success: true, rateLimited: false };
    } catch (error) {
        if (error instanceof VisionAnalysisError && error.rateLimitedProviders.length > 0) {
            return { success: false, rateLimited: true };
        }
        console.error(`[Vision] Failed: ${imageId}`);
        return { success: false, rateLimited: false };
    }
}

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Format time until reset for logging
 */
function formatResetTime(resetAt: number | undefined, now: number): string {
    if (!resetAt || resetAt <= now) return "available";
    const mins = Math.ceil((resetAt - now) / 60000);
    if (mins >= 60) return `${Math.floor(mins / 60)}h${mins % 60}m`;
    return `${mins}m`;
}

/**
 * Standalone action for analyzing a single image (for manual/testing use).
 */
export const analyzeImage = internalAction({
    args: { imageId: v.id("generatedImages") },
    handler: async (ctx, args) => {
        const providersAvailable = await ctx.runQuery(
            internal.lib.providerHealthFunctions.checkProvidersAvailable, {}
        );
        if (!providersAvailable) return;

        const image = await ctx.runQuery(internal.generatedImages.getByIdInternal, {
            imageId: args.imageId,
        });
        if (!image?.url) return;

        await analyzeOneImage(
            ctx,
            args.imageId,
            image.url,
            async (provider, errorBody) => {
                await ctx.runMutation(
                    internal.lib.providerHealthFunctions.recordRateLimit,
                    { provider, errorBody }
                );
            }
        );
    },
});

/**
 * Cron job: Analyze unanalyzed images sequentially.
 * Stops immediately when rate limits are hit.
 */
export const analyzeRecentImages = internalAction({
    args: {},
    handler: async (ctx) => {
        // Check provider availability
        const providersAvailable = await ctx.runQuery(
            internal.lib.providerHealthFunctions.checkProvidersAvailable, {}
        );

        if (!providersAvailable) {
            const now = Date.now();
            const [groq, openrouter] = await Promise.all([
                ctx.runQuery(internal.lib.providerHealthFunctions.getHealth, { provider: "groq" }),
                ctx.runQuery(internal.lib.providerHealthFunctions.getHealth, { provider: "openrouter" }),
            ]);
            console.log(`[Vision] Rate-limited (Groq: ${formatResetTime(groq?.rateLimitedUntil, now)}, OpenRouter: ${formatResetTime(openrouter?.rateLimitedUntil, now)})`);
            return;
        }

        // Refresh expired limits
        await ctx.runMutation(internal.lib.providerHealthFunctions.refreshExpiredLimits, {});

        // Fetch unanalyzed images
        const images = await ctx.runQuery(
            internal.generatedImages.getUnanalyzedImages,
            { limit: MAX_BATCH_SIZE }
        );

        if (images.length === 0) return;

        console.log(`[Vision] Processing ${images.length} images`);

        // Rate limit callback - records immediately and signals to stop
        let allProvidersRateLimited = false;
        const recordRateLimit = async (provider: "groq" | "openrouter", errorBody: string) => {
            await ctx.runMutation(
                internal.lib.providerHealthFunctions.recordRateLimit,
                { provider, errorBody }
            );
        };

        // Process images sequentially with delay
        let processed = 0;


        for (const image of images) {
            if (!image.url) continue;

            // Phase III: Attempt Prompt Inference first (if not already done)
            // Note: We skip the check for existing promptInference to avoid an extra DB call.
            // If it was already done, re-running it is acceptable redundancy for this background job.
            if (image.prompt) {
                try {
                    const inference = await analyzePromptWithCerebras(image.prompt);
                    const decision = decideSensitivity(inference);

                    const promptInferenceData = {
                        category: inference.category,
                        confidence: inference.confidence,
                        reasoning: inference.reasoning,
                        provider: "cerebras/llama3.1-8b",
                        analyzedAt: Date.now(),
                    };

                    const isFinal = decision.action !== "escalate_to_vision";
                    const isSensitive = decision.action === "tag_sensitive";

                    await ctx.runMutation(internal.generatedImages.updateImagePromptInference, {
                        imageId: image._id,
                        promptInference: promptInferenceData,
                        isSensitive: isFinal ? isSensitive : undefined,
                        // If tagging safe, confidence is 0. 
                        // If tagging sensitive OR escalating, use LLM confidence.
                        confidence: isFinal && !isSensitive ? 0 : inference.confidence,
                    });

                    if (isFinal) {
                        console.log(`[Vision] Skipped vision for ${image._id} (Resolved by Prompt Inference: ${decision.action})`);
                        processed++;
                        continue;
                    }

                    console.log(`[Vision] Prompt Inference ambiguous for ${image._id}, proceeding to vision...`);

                } catch (error) {
                    console.error(`[Vision] Prompt Inference failed for ${image._id}, falling back to vision:`, error);
                }
            }

            const result = await analyzeOneImage(ctx, image._id, image.url, recordRateLimit);

            if (result.rateLimited) {
                // Check if BOTH providers are now rate-limited
                const stillAvailable = await ctx.runQuery(
                    internal.lib.providerHealthFunctions.checkProvidersAvailable, {}
                );
                if (!stillAvailable) {
                    allProvidersRateLimited = true;
                    console.log(`[Vision] Rate limit hit after ${processed} images, stopping batch`);
                    break;
                }
            }

            if (result.success) {
                processed++;
            }

            // Delay before next request (except for last image)
            if (images.indexOf(image) < images.length - 1 && !allProvidersRateLimited) {
                await sleep(DELAY_BETWEEN_REQUESTS_MS);
            }
        }

        if (processed > 0) {
            console.log(`[Vision] Completed: ${processed}/${images.length} analyzed`);
        }

        // Recursive Scheduling: If we processed a full batch and didn't hit rate limits,
        // schedule the next batch immediately to drain the backlog.
        if (!allProvidersRateLimited && images.length === MAX_BATCH_SIZE) {
            console.log("[Vision] More images pending, scheduling next batch immediately...");
            await ctx.scheduler.runAfter(0, internal.contentAnalysis.analyzeRecentImages, {});
        }
    },
});
