import { action, query } from "./_generated/server"
import { components } from "./_generated/api"
import { StripeSubscriptions } from "@convex-dev/stripe"
import { v } from "convex/values"
import { getSubscriptionStatus } from "./lib/subscription"
import {
    createStripeClient,
    getStripeErrorMessage,
    resolvePriceForPlan,
    type PlanType,
} from "./lib/stripeHelpers"

const stripeClient = new StripeSubscriptions(components.stripe, {})

/**
 * Create a checkout session for a Pro subscription.
 *
 * Uses Stripe lookup keys to dynamically resolve prices at checkout time.
 * This is the recommended Stripe pattern:
 * - Prices are configured in Stripe Dashboard with lookup_key
 * - No hardcoded price IDs in environment variables
 * - Price changes in Dashboard take effect immediately
 *
 * Required Stripe Dashboard setup:
 * - Create a price with lookup_key: "pro_monthly"
 * - Create a price with lookup_key: "pro_annual"
 *
 * Uses raw Stripe SDK to enable promotion codes support.
 */
export const createSubscriptionCheckout = action({
    args: {
        planType: v.union(v.literal("monthly"), v.literal("annual")),
        successUrl: v.optional(v.string()),
        cancelUrl: v.optional(v.string()),
    },
    returns: v.object({
        sessionId: v.string(),
        url: v.union(v.string(), v.null()),
    }),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        // Get or create a Stripe customer (use the component for this)
        const customer = await stripeClient.getOrCreateCustomer(ctx, {
            userId: identity.subject,
            email: identity.email,
            name: identity.name,
        })

        // Determine success/cancel URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const successUrl = args.successUrl || `${baseUrl}/pricing?success=true`
        const cancelUrl = args.cancelUrl || `${baseUrl}/pricing?canceled=true`

        // Create Stripe client
        const stripe = createStripeClient(process.env.STRIPE_SECRET_KEY)

        // Resolve price via lookup key (Stripe Dashboard is source of truth)
        const priceResult = await resolvePriceForPlan(stripe, args.planType as PlanType)
        if (!priceResult.success) {
            throw new Error(priceResult.error)
        }

        try {
            const session = await stripe.checkout.sessions.create({
                mode: "subscription",
                customer: customer.customerId,
                line_items: [
                    {
                        price: priceResult.priceId,
                        quantity: 1,
                    },
                ],
                success_url: successUrl,
                cancel_url: cancelUrl,
                allow_promotion_codes: true,
                subscription_data: {
                    metadata: {
                        userId: identity.subject,
                        isAnnual: (args.planType === "annual").toString(),
                    },
                },
            })

            return {
                sessionId: session.id,
                url: session.url,
            }
        } catch (err: unknown) {
            const message = getStripeErrorMessage(err)
            console.error("Stripe checkout session creation failed:", err)
            throw new Error(`Stripe checkout failed: ${message}`)
        }
    },
})

/**
 * Get subscriptions for the current user
 */
export const getUserSubscriptions = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) return []

        return await ctx.runQuery(
            components.stripe.public.listSubscriptionsByUserId,
            { userId: identity.subject }
        )
    },
})

/**
 * Get the current user's subscription status (pro/trial/expired)
 * Used by the client to show upgrade prompts
 */
export const getUserSubscriptionStatus = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return { status: "expired" as const }
        }

        return await getSubscriptionStatus(ctx, identity.subject)
    },
})

/**
 * Create a customer portal session for managing billing
 */
export const createPortalSession = action({
    args: {
        returnUrl: v.optional(v.string()),
    },
    returns: v.object({
        url: v.string(),
    }),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const returnUrl = args.returnUrl || `${baseUrl}/pricing`

        // Get customer for user
        const customer = await stripeClient.getOrCreateCustomer(ctx, {
            userId: identity.subject,
            email: identity.email,
            name: identity.name,
        })

        // Create portal session
        const session = await stripeClient.createCustomerPortalSession(ctx, {
            customerId: customer.customerId,
            returnUrl,
        })

        return { url: session.url }
    },
})
