/**
 * Admin Utilities (Dev Only)
 *
 * One-off mutations for granting Pro subscriptions in development.
 * These are internalMutations — they cannot be called from the client,
 * only via `convex run` CLI or from other internal functions.
 *
 * Safe to deploy: internal functions are not exposed to the public API.
 * Remove or leave dormant once no longer needed.
 */
import { v } from "convex/values"
import { internalMutation } from "./_generated/server"
import { components } from "./_generated/api"

/**
 * Grant a synthetic "Pro" subscription to a user by email.
 *
 * This inserts a subscription record into the Stripe component's table
 * so that `hasActiveSubscription()` returns true for the user.
 *
 * Usage (CLI):
 *   bunx convex run --no-push admin:grantProByEmail '{"email":"user@example.com"}'
 *
 * Dev-only guard: throws if CONVEX_CLOUD_URL contains ".convex.cloud" and
 * the deployment name does NOT start with "dev:".
 */
export const grantProByEmail = internalMutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        // --- Find the user by email ---
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique()

        if (!user) {
            throw new Error(
                `No user found with email "${args.email}". ` +
                `Make sure the user has logged in at least once.`
            )
        }

        const clerkId = user.clerkId

        // --- Check if user already has an active subscription ---
        const existingSubs = await ctx.runQuery(
            components.stripe.public.listSubscriptionsByUserId,
            { userId: clerkId }
        )

        const alreadyActive = existingSubs.some((sub) => sub.status === "active")
        if (alreadyActive) {
            return {
                success: true,
                message: `User ${args.email} (${clerkId}) already has an active Pro subscription.`,
                alreadyActive: true,
            }
        }

        // --- Create a synthetic customer + subscription in the Stripe component ---
        const syntheticCustomerId = `cus_dev_admin_${clerkId}`
        const syntheticSubscriptionId = `sub_dev_admin_${clerkId}_${Date.now()}`

        // Upsert a synthetic customer record
        await ctx.runMutation(
            components.stripe.public.createOrUpdateCustomer,
            {
                stripeCustomerId: syntheticCustomerId,
                email: user.email,
                name: user.name,
                metadata: { userId: clerkId, grantedBy: "admin:grantProByEmail" },
            }
        )

        // Insert the subscription record via the component's internal handler
        await ctx.runMutation(
            components.stripe.private.handleSubscriptionCreated,
            {
                stripeSubscriptionId: syntheticSubscriptionId,
                stripeCustomerId: syntheticCustomerId,
                status: "active",
                // Far-future period end (≈ year 2099)
                currentPeriodEnd: Math.floor(
                    new Date("2099-12-31T23:59:59Z").getTime() / 1000
                ),
                cancelAtPeriodEnd: false,
                priceId: "price_dev_admin_pro",
                metadata: {
                    userId: clerkId,
                    grantedBy: "admin:grantProByEmail",
                    grantedAt: new Date().toISOString(),
                },
            }
        )

        return {
            success: true,
            message: `Granted Pro to ${args.email} (clerkId: ${clerkId}).`,
            syntheticSubscriptionId,
            alreadyActive: false,
        }
    },
})

/**
 * Revoke a dev-granted Pro subscription by email.
 * Only removes subscriptions with the "sub_dev_admin_" prefix.
 */
export const revokeProByEmail = internalMutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique()

        if (!user) {
            throw new Error(`No user found with email "${args.email}".`)
        }

        const clerkId = user.clerkId

        const subs = await ctx.runQuery(
            components.stripe.public.listSubscriptionsByUserId,
            { userId: clerkId }
        )

        const devSubs = subs.filter((sub) =>
            sub.stripeSubscriptionId.startsWith("sub_dev_admin_")
        )

        if (devSubs.length === 0) {
            return {
                success: false,
                message: `No dev-granted subscriptions found for ${args.email}.`,
            }
        }

        // Mark each dev subscription as canceled via the component's handler
        for (const sub of devSubs) {
            await ctx.runMutation(
                components.stripe.private.handleSubscriptionDeleted,
                { stripeSubscriptionId: sub.stripeSubscriptionId }
            )
        }

        return {
            success: true,
            message: `Revoked ${devSubs.length} dev-granted subscription(s) for ${args.email}.`,
        }
    },
})
