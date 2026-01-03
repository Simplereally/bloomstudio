/**
 * Stripe Configuration
 *
 * Price IDs should be created in Stripe Dashboard and set via environment variables.
 * This ensures subscriptions are properly tracked by @convex-dev/stripe component.
 */

export const STRIPE_CONFIG = {
    prices: {
        /**
         * Pro subscription price ID from Stripe Dashboard
         * Create a product in Stripe → Add a recurring price → Copy the price ID (price_xxx)
         */
        proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
        proAnnual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
    },
} as const

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
    return Boolean(STRIPE_CONFIG.prices.proMonthly)
}
