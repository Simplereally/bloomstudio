import { httpRouter } from "convex/server"
import { components } from "./_generated/api"
import { registerRoutes } from "@convex-dev/stripe"
import type Stripe from "stripe"
import {
    claimBatchItemHttp,
    claimModerationHttp,
    claimSecondaryAssetsHttp,
    completeBatchItemHttp,
    completePromptInferenceHttp,
    completeSecondaryAssetsHttp,
    completeVisionAnalysisHttp,
    continueBatchItemHttp,
    continueModerationHttp,
    continueSecondaryAssetsHttp,
    failBatchItemHttp,
    releaseBatchItemHttp,
    failPromptInferenceHttp,
    failSecondaryAssetsHttp,
    claimSingleGenerationHttp,
    continueSingleGenerationHttp,
    completeSingleGenerationHttp,
    failSingleGenerationHttp,
    failVisionAnalysisHttp,
    recordProviderRateLimitHttp,
} from "./cloudflareWorkerHttp"

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

http.route({
    path: "/workers/single-generation/claim",
    method: "POST",
    handler: claimSingleGenerationHttp,
})

http.route({
    path: "/workers/single-generation/continue",
    method: "POST",
    handler: continueSingleGenerationHttp,
})

http.route({
    path: "/workers/single-generation/complete",
    method: "POST",
    handler: completeSingleGenerationHttp,
})

http.route({
    path: "/workers/single-generation/fail",
    method: "POST",
    handler: failSingleGenerationHttp,
})

http.route({
    path: "/workers/batch-item/claim",
    method: "POST",
    handler: claimBatchItemHttp,
})

http.route({
    path: "/workers/batch-item/continue",
    method: "POST",
    handler: continueBatchItemHttp,
})

http.route({
    path: "/workers/batch-item/complete",
    method: "POST",
    handler: completeBatchItemHttp,
})

http.route({
    path: "/workers/batch-item/release",
    method: "POST",
    handler: releaseBatchItemHttp,
})

http.route({
    path: "/workers/batch-item/fail",
    method: "POST",
    handler: failBatchItemHttp,
})

http.route({
    path: "/workers/secondary-assets/claim",
    method: "POST",
    handler: claimSecondaryAssetsHttp,
})

http.route({
    path: "/workers/secondary-assets/continue",
    method: "POST",
    handler: continueSecondaryAssetsHttp,
})

http.route({
    path: "/workers/secondary-assets/complete",
    method: "POST",
    handler: completeSecondaryAssetsHttp,
})

http.route({
    path: "/workers/secondary-assets/fail",
    method: "POST",
    handler: failSecondaryAssetsHttp,
})

http.route({
    path: "/workers/moderation/claim",
    method: "POST",
    handler: claimModerationHttp,
})

http.route({
    path: "/workers/moderation/continue",
    method: "POST",
    handler: continueModerationHttp,
})

http.route({
    path: "/workers/moderation/prompt-inference/complete",
    method: "POST",
    handler: completePromptInferenceHttp,
})

http.route({
    path: "/workers/moderation/prompt-inference/fail",
    method: "POST",
    handler: failPromptInferenceHttp,
})

http.route({
    path: "/workers/moderation/vision-analysis/complete",
    method: "POST",
    handler: completeVisionAnalysisHttp,
})

http.route({
    path: "/workers/moderation/vision-analysis/fail",
    method: "POST",
    handler: failVisionAnalysisHttp,
})

http.route({
    path: "/workers/provider-health/rate-limit",
    method: "POST",
    handler: recordProviderRateLimitHttp,
})

export default http
