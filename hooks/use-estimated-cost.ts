"use client";

/**
 * useEstimatedCost Hook
 *
 * Calculates the estimated pollen cost for a generation based on model pricing.
 * Used to warn users before generation if the cost exceeds their balance.
 *
 * @example
 * ```tsx
 * const { estimatedCost, canAfford, willDepleteBalance } = useEstimatedCost({
 *   modelId: "gptimage-large",
 *   balance: 1.5,
 *   // For video:
 *   durationSeconds: 5,
 * });
 *
 * if (willDepleteBalance) {
 *   // Show warning dialog
 * }
 * ```
 */

import { useMemo } from "react";
import { getModel } from "@/lib/config/models";
import type { ModelPricingDefinition } from "@/lib/schemas/pollinations-pricing.schema";

/**
 * Threshold for warning - if remaining balance after generation is below this,
 * show a warning to the user.
 */
export const LOW_BALANCE_AFTER_GENERATION_THRESHOLD = 0.5;

export interface UseEstimatedCostOptions {
    /** Model ID to estimate cost for */
    modelId: string;
    /** Current pollen balance (null if not loaded) */
    balance: number | null;
    /** Number of images to generate (for batch mode) */
    imageCount?: number;
    /** Duration in seconds (for video models) */
    durationSeconds?: number;
}

export interface UseEstimatedCostReturn {
    /** Estimated pollen cost for this generation */
    estimatedCost: number | null;
    /** Whether user can afford this generation */
    canAfford: boolean;
    /** Whether this generation will leave balance below threshold */
    willDepleteBalance: boolean;
    /** Remaining balance after generation (null if can't calculate) */
    remainingAfter: number | null;
    /** Human-readable cost string */
    formattedCost: string | null;
    /** Model pricing definition (for display) */
    pricing: ModelPricingDefinition | undefined;
}

/**
 * Estimates the pollen cost for a generation.
 *
 * Uses the model's pricing definition to calculate:
 * - For image models: perImage price × imageCount
 * - For token-based models: rough estimate based on output tokens
 * - For video models: perSecond × duration OR token-based estimate scaled by duration
 */
export function estimateCost(
    pricing: ModelPricingDefinition | undefined,
    options: { imageCount?: number; durationSeconds?: number; defaultDuration?: number }
): number | null {
    if (!pricing) return null;

    const { imageCount = 1, durationSeconds = 5, defaultDuration = 5 } = options;

    // Image models
    if (pricing.type === "image") {
        if (pricing.imagePricing) {
            return pricing.imagePricing.perImage * imageCount;
        }
        // Token-based image models (GPT, NanoBanana)
        // Rough estimate: use approximatePerPollen as the efficiency indicator
        if (pricing.tokenPricing) {
            // 1 pollen / approximatePerPollen images = cost per image
            return (1 / pricing.approximatePerPollen) * imageCount;
        }
    }

    // Video models
    if (pricing.type === "video") {
        if (pricing.videoPricing?.perSecond) {
            return pricing.videoPricing.perSecond * durationSeconds;
        }
        // Token-based video models - scale by duration relative to model's default
        // This ensures a 10s video shows ~2x the cost of a 5s video
        if (pricing.videoPricing?.videoOutputPerMillion) {
            const baseCost = 1 / pricing.approximatePerPollen;
            const durationScale = durationSeconds / defaultDuration;
            return baseCost * durationScale;
        }
    }

    return null;
}

/**
 * Hook for calculating estimated generation cost and comparing to balance
 */
export function useEstimatedCost({
    modelId,
    balance,
    imageCount = 1,
    durationSeconds = 5,
}: UseEstimatedCostOptions): UseEstimatedCostReturn {
    return useMemo(() => {
        const model = getModel(modelId);
        const pricing = model?.modelPricing;
        // Get model's default duration for scaling token-based video costs
        const defaultDuration = model?.durationConstraints?.defaultDuration;

        // Calculate estimated cost
        const estimatedCost = estimateCost(pricing, { imageCount, durationSeconds, defaultDuration });

        // Can't calculate - balance or pricing not available
        if (estimatedCost === null || balance === null) {
            return {
                estimatedCost: null,
                canAfford: true, // Assume they can afford if we can't calculate
                willDepleteBalance: false,
                remainingAfter: null,
                formattedCost: null,
                pricing,
            };
        }

        const remainingAfter = balance - estimatedCost;
        const canAfford = remainingAfter >= 0;
        const willDepleteBalance = remainingAfter < LOW_BALANCE_AFTER_GENERATION_THRESHOLD;

        // Format cost for display
        const formattedCost = estimatedCost < 0.001
            ? "<0.001"
            : estimatedCost < 0.01
                ? estimatedCost.toFixed(4)
                : estimatedCost.toFixed(2);

        return {
            estimatedCost,
            canAfford,
            willDepleteBalance,
            remainingAfter,
            formattedCost,
            pricing,
        };
    }, [modelId, balance, imageCount, durationSeconds]);
}

/**
 * Formats remaining balance for display
 */
export function formatRemainingBalance(remaining: number | null): string | null {
    if (remaining === null) return null;
    if (remaining < 0) return "0.00";
    return remaining.toFixed(2);
}
