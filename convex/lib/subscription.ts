/**
 * Subscription Helper Functions
 * 
 * Utilities for checking user subscription status and trial eligibility.
 */

import { components } from "../_generated/api"
import { QueryCtx, MutationCtx } from "../_generated/server"

/** Trial duration in milliseconds (24 hours) */
const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000

/**
 * Check if a user has an active Pro subscription.
 */
export async function hasActiveSubscription(
    ctx: QueryCtx | MutationCtx,
    userId: string
): Promise<boolean> {
    const subscriptions = await ctx.runQuery(
        components.stripe.public.listSubscriptionsByUserId,
        { userId }
    )

    return subscriptions.some((sub) => sub.status === "active")
}

/**
 * Check if a user is within their trial period.
 * Trial is 24 hours from account creation.
 */
export async function isInTrialPeriod(
    ctx: QueryCtx | MutationCtx,
    clerkId: string
): Promise<boolean> {
    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .unique()

    if (!user) {
        return false
    }

    const trialExpiresAt = user.createdAt + TRIAL_DURATION_MS
    return Date.now() < trialExpiresAt
}

/** Result when user is allowed to generate */
type GenerationAllowed = { allowed: true }

/** Result when user is denied generation access */
type GenerationDenied = { allowed: false; reason: string }

/** Discriminated union for generation access check result */
export type CanGenerateResult = GenerationAllowed | GenerationDenied

/**
 * Check if a user can generate images.
 * Returns true if they have an active subscription OR are in their trial period.
 */
export async function canUserGenerate(
    ctx: QueryCtx | MutationCtx,
    clerkId: string
): Promise<CanGenerateResult> {
    // Check for active subscription first (faster path for paying users)
    const hasSubscription = await hasActiveSubscription(ctx, clerkId)
    if (hasSubscription) {
        return { allowed: true }
    }

    // Check if in trial period
    const inTrial = await isInTrialPeriod(ctx, clerkId)
    if (inTrial) {
        return { allowed: true }
    }

    return {
        allowed: false,
        reason: "Your 24-hour trial has expired. Upgrade to Pro for $5/month to continue generating images.",
    }
}

/**
 * Get the user's subscription status for display purposes.
 */
export async function getSubscriptionStatus(
    ctx: QueryCtx | MutationCtx,
    clerkId: string
): Promise<{
    status: "pro" | "trial" | "expired"
    trialExpiresAt?: number
}> {
    // Check subscription first
    const hasSubscription = await hasActiveSubscription(ctx, clerkId)
    if (hasSubscription) {
        return { status: "pro" }
    }

    // Get user for trial info
    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .unique()

    if (!user) {
        return { status: "expired" }
    }

    const trialExpiresAt = user.createdAt + TRIAL_DURATION_MS
    const now = Date.now()

    if (now < trialExpiresAt) {
        return { status: "trial", trialExpiresAt }
    }

    return { status: "expired", trialExpiresAt }
}
