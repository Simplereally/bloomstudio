/**
 * Stripe Helper Functions
 *
 * Utility functions for Stripe integration.
 * Uses lookup keys for dynamic price resolution (Stripe best practice).
 */

import Stripe from "stripe"

/**
 * Plan types supported by the subscription system.
 */
export type PlanType = "monthly" | "annual"

/**
 * Lookup key constants for Stripe prices.
 * These should match the lookup_keys set in Stripe Dashboard.
 */
export const PRICE_LOOKUP_KEYS = {
    monthly: "pro_monthly",
    annual: "pro_annual",
} as const satisfies Record<PlanType, string>

/**
 * Get the Stripe lookup key for a given plan type.
 */
export function getLookupKeyForPlan(planType: PlanType): string {
    return PRICE_LOOKUP_KEYS[planType]
}

/**
 * Result of a price lookup operation.
 */
export type PriceLookupResult =
    | { success: true; priceId: string; price: Stripe.Price }
    | { success: false; error: string }

/**
 * Fetch a Stripe price by its lookup key.
 *
 * This is the recommended Stripe pattern for dynamic pricing:
 * - Set lookup_key on prices in Stripe Dashboard
 * - Fetch by lookup_key at checkout time
 * - Transfer lookup_key when creating new prices
 *
 * @param stripe - Stripe client instance
 * @param lookupKey - The lookup key to search for
 * @returns Price lookup result with priceId or error
 */
export async function fetchPriceByLookupKey(
    stripe: Stripe,
    lookupKey: string
): Promise<PriceLookupResult> {
    try {
        const prices = await stripe.prices.list({
            lookup_keys: [lookupKey],
            active: true,
            limit: 1,
        })

        if (!prices.data.length) {
            return {
                success: false,
                error: `No active Stripe price found for lookup key "${lookupKey}". ` +
                    `Create a price in Stripe Dashboard with this lookup key.`,
            }
        }

        const price = prices.data[0]
        return {
            success: true,
            priceId: price.id,
            price,
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return {
            success: false,
            error: `Failed to fetch price from Stripe: ${message}`,
        }
    }
}

/**
 * Resolve the Stripe price ID for a subscription plan.
 *
 * Combines plan type → lookup key → price ID resolution.
 *
 * @param stripe - Stripe client instance
 * @param planType - The plan type (monthly or annual)
 * @returns Price lookup result
 */
export async function resolvePriceForPlan(
    stripe: Stripe,
    planType: PlanType
): Promise<PriceLookupResult> {
    const lookupKey = getLookupKeyForPlan(planType)
    return fetchPriceByLookupKey(stripe, lookupKey)
}

/**
 * Create a configured Stripe client.
 *
 * @param secretKey - Stripe secret key from environment
 * @returns Configured Stripe client
 * @throws Error if secret key is missing
 */
export function createStripeClient(secretKey: string | undefined): Stripe {
    if (!secretKey) {
        throw new Error(
            "STRIPE_SECRET_KEY is missing in environment variables. " +
            "Please add it in your Convex dashboard."
        )
    }

    return new Stripe(secretKey, {
        apiVersion: "2025-12-15.clover",
    })
}

/**
 * Extract a user-friendly error message from an unknown error.
 */
export function getStripeErrorMessage(err: unknown): string {
    if (err instanceof Stripe.errors.StripeError) {
        return err.message
    }
    if (err instanceof Error) {
        return err.message
    }
    return "Unknown error occurred"
}
