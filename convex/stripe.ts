import { action, query } from "./_generated/server"
import { components } from "./_generated/api"
import { StripeSubscriptions } from "@convex-dev/stripe"
import { v } from "convex/values"
import { getSubscriptionStatus } from "./lib/subscription"

const stripeClient = new StripeSubscriptions(components.stripe, {})

/**
 * Create a checkout session for a Pro subscription
 */
export const createSubscriptionCheckout = action({
    args: {
        priceId: v.string(),
        isAnnual: v.boolean(),
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

        // Get or create a Stripe customer
        const customer = await stripeClient.getOrCreateCustomer(ctx, {
            userId: identity.subject,
            email: identity.email,
            name: identity.name,
        })

        // Determine success/cancel URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

        // Create checkout session
        return await stripeClient.createCheckoutSession(ctx, {
            priceId: args.priceId,
            customerId: customer.customerId,
            mode: "subscription",
            successUrl: `${baseUrl}/studio?upgraded=true`,
            cancelUrl: `${baseUrl}/pricing?canceled=true`,
            subscriptionMetadata: {
                userId: identity.subject,
                isAnnual: args.isAnnual.toString(),
            },
        })
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
    args: {},
    returns: v.object({
        url: v.string(),
    }),
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

        // Get customer for user
        const customer = await stripeClient.getOrCreateCustomer(ctx, {
            userId: identity.subject,
            email: identity.email,
            name: identity.name,
        })

        // Create portal session
        const session = await stripeClient.createCustomerPortalSession(ctx, {
            customerId: customer.customerId,
            returnUrl: `${baseUrl}/pricing`,
        })

        return { url: session.url }
    },
})
