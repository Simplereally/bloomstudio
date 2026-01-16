"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { analyzePromptWithCerebras, decideSensitivity } from "./lib/promptInference";

export const analyzePromptImage = internalAction({
    args: {
        imageId: v.id("generatedImages"),
        prompt: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            console.log(`[PromptInference] Analyzing image ${args.imageId}`);
            const inference = await analyzePromptWithCerebras(args.prompt);

            const decision = decideSensitivity(inference);

            const promptInferenceData = {
                category: inference.category,
                confidence: inference.confidence,
                reasoning: inference.reasoning,
                provider: "cerebras/llama3.1-8b",
                analyzedAt: Date.now(),
            };

            if (decision.action === "escalate_to_vision") {
                console.log(`[PromptInference] Ambiguous (${inference.category} ${inference.confidence}), escalating to vision.`);
                // 1. Save metadata and current confidence (prevents seeing Gate 1's '0' while waiting for vision)
                await ctx.runMutation(internal.generatedImages.updateImagePromptInference, {
                    imageId: args.imageId,
                    promptInference: promptInferenceData,
                    confidence: inference.confidence,
                });

                // 2. Schedule vision analysis
                await ctx.scheduler.runAfter(0, internal.contentAnalysis.analyzeImage, {
                    imageId: args.imageId,
                });
            } else {
                console.log(`[PromptInference] Decided: ${decision.action}`);
                const isSensitive = decision.action === "tag_sensitive";
                
                // Save metadata AND finalize sensitivity
                await ctx.runMutation(internal.generatedImages.updateImagePromptInference, {
                    imageId: args.imageId,
                    promptInference: promptInferenceData,
                    isSensitive,
                    // If tagging safe, confidence is 0 for safety.
                    // If tagging sensitive, confidence is LLM confidence.
                    confidence: isSensitive ? inference.confidence : 0
                });
            }

        } catch (error) {
            console.error(`[PromptInference] Failed for ${args.imageId}:`, error);
            // Default-fail safe: if prompt inference errors, do not mark content safe; keep it pending and let vision resolve it.
            
            console.log(`[PromptInference] Fallback to vision due to error.`);
            await ctx.scheduler.runAfter(0, internal.contentAnalysis.analyzeImage, {
                imageId: args.imageId,
            });
        }
    },
});
