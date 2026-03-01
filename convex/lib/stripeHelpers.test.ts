/**
 * Tests for Stripe Helper Functions
 *
 * Tests the pure utility functions for Stripe price lookup.
 * Uses mocked Stripe client to avoid hitting real Stripe API.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import Stripe from "stripe"
import {
    getLookupKeyForPlan,
    fetchPriceByLookupKey,
    resolvePriceForPlan,
    createStripeClient,
    getStripeErrorMessage,
    PRICE_LOOKUP_KEYS,
    type PlanType,
} from "./stripeHelpers"

// Mock price fixtures
const mockMonthlyPrice: Stripe.Price = {
    id: "price_1ABC123monthly",
    object: "price",
    active: true,
    currency: "usd",
    unit_amount: 300,
    lookup_key: "pro_monthly",
    product: "prod_123",
    type: "recurring",
    recurring: {
        interval: "month",
        interval_count: 1,
        usage_type: "licensed",
        meter: null,
        trial_period_days: null,
    },
    billing_scheme: "per_unit",
    created: 1640000000,
    livemode: false,
    metadata: {},
    nickname: null,
    tax_behavior: null,
    tiers_mode: null,
    transform_quantity: null,
    unit_amount_decimal: "300",
    custom_unit_amount: null,
}

const mockAnnualPrice: Stripe.Price = {
    ...mockMonthlyPrice,
    id: "price_1ABC123annual",
    lookup_key: "pro_annual",
    unit_amount: 2400,
    recurring: {
        interval: "year",
        interval_count: 1,
        usage_type: "licensed",
        meter: null,
        trial_period_days: null,
    },
}

describe("PRICE_LOOKUP_KEYS", () => {
    it("has correct lookup key for monthly plan", () => {
        expect(PRICE_LOOKUP_KEYS.monthly).toBe("pro_monthly")
    })

    it("has correct lookup key for annual plan", () => {
        expect(PRICE_LOOKUP_KEYS.annual).toBe("pro_annual")
    })
})

describe("getLookupKeyForPlan", () => {
    it("returns pro_monthly for monthly plan", () => {
        expect(getLookupKeyForPlan("monthly")).toBe("pro_monthly")
    })

    it("returns pro_annual for annual plan", () => {
        expect(getLookupKeyForPlan("annual")).toBe("pro_annual")
    })

    it.each([
        ["monthly", "pro_monthly"],
        ["annual", "pro_annual"],
    ] as const)("maps %s plan to %s lookup key", (planType, expectedKey) => {
        expect(getLookupKeyForPlan(planType as PlanType)).toBe(expectedKey)
    })
})

describe("fetchPriceByLookupKey", () => {
    function createMockStripe(pricesData: Stripe.Price[] = []): Stripe {
        return {
            prices: {
                list: vi.fn().mockResolvedValue({
                    data: pricesData,
                    has_more: false,
                }),
            },
        } as unknown as Stripe
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns success with priceId when price found", async () => {
        const stripe = createMockStripe([mockMonthlyPrice])

        const result = await fetchPriceByLookupKey(stripe, "pro_monthly")

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.priceId).toBe("price_1ABC123monthly")
            expect(result.price).toEqual(mockMonthlyPrice)
        }
    })

    it("calls stripe.prices.list with correct parameters", async () => {
        const stripe = createMockStripe([mockMonthlyPrice])

        await fetchPriceByLookupKey(stripe, "pro_monthly")

        expect(stripe.prices.list).toHaveBeenCalledWith({
            lookup_keys: ["pro_monthly"],
            active: true,
            limit: 1,
        })
    })

    it("returns error when no price found for lookup key", async () => {
        const stripe = createMockStripe([])

        const result = await fetchPriceByLookupKey(stripe, "nonexistent_key")

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toContain("No active Stripe price found")
            expect(result.error).toContain("nonexistent_key")
        }
    })

    it("returns error when stripe API throws", async () => {
        const stripe = {
            prices: {
                list: vi.fn().mockRejectedValue(new Error("Network error")),
            },
        } as unknown as Stripe

        const result = await fetchPriceByLookupKey(stripe, "pro_monthly")

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toContain("Failed to fetch price from Stripe")
            expect(result.error).toContain("Network error")
        }
    })

    it("handles Stripe-specific errors", async () => {
        const stripeError = new Stripe.errors.StripeError({
            message: "Rate limited",
            type: "rate_limit_error",
        })
        const stripe = {
            prices: {
                list: vi.fn().mockRejectedValue(stripeError),
            },
        } as unknown as Stripe

        const result = await fetchPriceByLookupKey(stripe, "pro_monthly")

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toContain("Failed to fetch price from Stripe")
        }
    })

    it("handles unknown errors gracefully", async () => {
        const stripe = {
            prices: {
                list: vi.fn().mockRejectedValue("String error"),
            },
        } as unknown as Stripe

        const result = await fetchPriceByLookupKey(stripe, "pro_monthly")

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toContain("Unknown error")
        }
    })
})

describe("resolvePriceForPlan", () => {
    function createMockStripe(pricesData: Stripe.Price[] = []): Stripe {
        return {
            prices: {
                list: vi.fn().mockResolvedValue({
                    data: pricesData,
                    has_more: false,
                }),
            },
        } as unknown as Stripe
    }

    it("resolves monthly plan to correct price", async () => {
        const stripe = createMockStripe([mockMonthlyPrice])

        const result = await resolvePriceForPlan(stripe, "monthly")

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.priceId).toBe("price_1ABC123monthly")
        }
    })

    it("resolves annual plan to correct price", async () => {
        const stripe = createMockStripe([mockAnnualPrice])

        const result = await resolvePriceForPlan(stripe, "annual")

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.priceId).toBe("price_1ABC123annual")
        }
    })

    it("calls prices.list with pro_monthly for monthly plan", async () => {
        const stripe = createMockStripe([mockMonthlyPrice])

        await resolvePriceForPlan(stripe, "monthly")

        expect(stripe.prices.list).toHaveBeenCalledWith(
            expect.objectContaining({
                lookup_keys: ["pro_monthly"],
            })
        )
    })

    it("calls prices.list with pro_annual for annual plan", async () => {
        const stripe = createMockStripe([mockAnnualPrice])

        await resolvePriceForPlan(stripe, "annual")

        expect(stripe.prices.list).toHaveBeenCalledWith(
            expect.objectContaining({
                lookup_keys: ["pro_annual"],
            })
        )
    })

    it("returns error when price not found", async () => {
        const stripe = createMockStripe([])

        const result = await resolvePriceForPlan(stripe, "monthly")

        expect(result.success).toBe(false)
    })
})

describe("createStripeClient", () => {
    it("throws error when secret key is undefined", () => {
        expect(() => createStripeClient(undefined)).toThrow(
            "STRIPE_SECRET_KEY is missing"
        )
    })

    it("throws error when secret key is empty string", () => {
        expect(() => createStripeClient("")).toThrow(
            "STRIPE_SECRET_KEY is missing"
        )
    })

    it("returns Stripe instance when secret key provided", () => {
        const client = createStripeClient("sk_test_12345")

        expect(client).toBeInstanceOf(Stripe)
    })

    it("configures correct API version", () => {
        const client = createStripeClient("sk_test_12345")

        // Access internal config - this tests the configuration was applied
         
        expect((client as any)._api.version).toBe("2026-02-25.clover")
    })
})

describe("getStripeErrorMessage", () => {
    it("extracts message from standard Error", () => {
        const error = new Error("Something went wrong")

        expect(getStripeErrorMessage(error)).toBe("Something went wrong")
    })

    it("extracts message from Stripe error", () => {
        const error = new Stripe.errors.StripeError({
            message: "Card declined",
            type: "card_error",
        })

        expect(getStripeErrorMessage(error)).toBe("Card declined")
    })

    it("returns Unknown error for string", () => {
        expect(getStripeErrorMessage("string error")).toBe(
            "Unknown error occurred"
        )
    })

    it("returns Unknown error for null", () => {
        expect(getStripeErrorMessage(null)).toBe("Unknown error occurred")
    })

    it("returns Unknown error for undefined", () => {
        expect(getStripeErrorMessage(undefined)).toBe("Unknown error occurred")
    })

    it("returns Unknown error for object without message", () => {
        expect(getStripeErrorMessage({ code: 500 })).toBe(
            "Unknown error occurred"
        )
    })
})
