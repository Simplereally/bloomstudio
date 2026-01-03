import { httpRouter } from "convex/server"
import { components } from "./_generated/api"
import { registerRoutes } from "@convex-dev/stripe"
import type Stripe from "stripe"

const http = httpRouter()

// Register Stripe webhook handler at /stripe/webhook
// The @convex-dev/stripe component automatically handles:
// - customer.created/updated
// - customer.subscription.created/updated/deleted
// - checkout.session.completed
// - payment_intent.succeeded/failed
// - invoice.created/paid/failed
registerRoutes(http, components.stripe, {
    webhookPath: "/stripe/webhook",

    // Custom handlers run AFTER default processing
    events: {
        "customer.subscription.created": async (_ctx, event: Stripe.CustomerSubscriptionCreatedEvent) => {
            const subscription = event.data.object
            console.log(`✅ New subscription created: ${subscription.id} (status: ${subscription.status})`)
        },
        "customer.subscription.updated": async (_ctx, event: Stripe.CustomerSubscriptionUpdatedEvent) => {
            const subscription = event.data.object
            console.log(`📝 Subscription updated: ${subscription.id} (status: ${subscription.status})`)
        },
        "customer.subscription.deleted": async (_ctx, event: Stripe.CustomerSubscriptionDeletedEvent) => {
            const subscription = event.data.object
            console.log(`❌ Subscription canceled: ${subscription.id}`)
        },
    },

    // Log all events for debugging
    onEvent: async (_ctx, event: Stripe.Event) => {
        console.log(`[Stripe] ${event.type} (${event.id})`)
    },
})

export default http
