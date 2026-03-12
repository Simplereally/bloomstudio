import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Prompt inference now only schedules external worker execution.
 * The heavy LLM call runs in Cloudflare so Convex does not pay for provider wait time.
 */
export const analyzePromptImage = internalAction({
    args: {
        imageId: v.id("generatedImages"),
        prompt: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.prompt || args.prompt.trim().length === 0) {
            await ctx.scheduler.runAfter(0, internal.contentAnalysis.analyzeImage, {
                imageId: args.imageId,
            });
            return;
        }

        await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchPromptInference, {
            imageId: args.imageId,
        });
    },
});
