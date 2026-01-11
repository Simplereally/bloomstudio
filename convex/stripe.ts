import { action, query } from "./_generated/server"
import { components } from "./_generated/api"
import { StripeSubscriptions } from "@convex-dev/stripe"
import { v } from "convex/values"
import { getSubscriptionStatus } from "./lib/subscription"
import Stripe from "stripe"

const stripeClient = new StripeSubscriptions(components.stripe, {})

/**
 * Create a checkout session for a Pro subscription
 * Uses raw Stripe SDK to enable promotion codes support
 */
export const createSubscriptionCheckout = action({
    args: {
        priceId: v.string(),
        isAnnual: v.boolean(),
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

        // Get or create a Stripe customer (still use the component for this)
        const customer = await stripeClient.getOrCreateCustomer(ctx, {
            userId: identity.subject,
            email: identity.email,
            name: identity.name,
        })

        // Determine success/cancel URLs
        // Use provided URLs or fallback to environment (mostly for backward compatibility/prod)
        const successUrl = args.successUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?success=true`
        const cancelUrl = args.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`

        // Create checkout session using raw Stripe SDK for promotion code support
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-12-15.clover",
        })

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customer.customerId,
            line_items: [
                {
                    price: args.priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            allow_promotion_codes: true, // 🎉 Enable promo codes!
            subscription_data: {
                metadata: {
                    userId: identity.subject,
                    isAnnual: args.isAnnual.toString(),
                },
            },
        })

        return {
            sessionId: session.id,
            url: session.url,
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
