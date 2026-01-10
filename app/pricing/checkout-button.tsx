"use client"

/**
 * Client-side checkout button and toast handling for the pricing page.
 * This is a minimal client component that handles:
 * - Stripe checkout flow
 * - URL search params for success/canceled states
 * - Loading states during checkout
 *
 * All static content is rendered in the parent Server Component for SEO.
 */

import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { STRIPE_CONFIG, isStripeConfigured } from "@/lib/config/stripe"
import { ArrowRight, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { type TierName } from "./pricing-data"

interface CheckoutButtonProps {
    tierName: TierName
    cta: string
    highlighted: boolean
    variant: "default" | "outline"
}

export function CheckoutButton({ tierName, cta, highlighted, variant }: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { isSignedIn } = useUser()
    const createCheckout = useAction(api.stripe.createSubscriptionCheckout)

    async function handleCheckout() {
        if (tierName === "Starter") {
            window.location.href = "/studio"
            return
        }

        if (tierName === "Competitors") {
            const el = document.getElementById("comparison-table")
            el?.scrollIntoView({ behavior: "smooth" })
            return
        }

        // Require sign-in for checkout
        if (!isSignedIn) {
            toast.error("Please sign in first", {
                description: "You need to be signed in to subscribe.",
            })
            window.location.href = "/sign-in?redirect_url=/pricing"
            return
        }

        // Check Stripe configuration
        if (!isStripeConfigured()) {
            console.error("Stripe configuration missing: NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID not set")
            toast.error("Payment unavailable", {
                description: "Please try again later or contact support.",
            })
            return
        }

        // Pro tier - create Stripe checkout session via Convex
        setIsLoading(true)

        try {
            const { url } = await createCheckout({
                priceId: STRIPE_CONFIG.prices.proMonthly,
                isAnnual: false,
                successUrl: `${window.location.origin}/studio?upgraded=true`,
                cancelUrl: `${window.location.origin}/pricing?canceled=true`,
            })

            if (url) {
                window.location.href = url
            } else {
                throw new Error("No checkout URL returned")
            }
        } catch (error) {
            console.error("Checkout error:", error)
            toast.error("Checkout failed", {
                description: "Please try again later or contact support.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Scroll to comparison for competitors
    if (tierName === "Competitors") {
        return (
            <Button
                className="w-full mb-8"
                variant="outline"
                size="lg"
                onClick={handleCheckout}
            >
                {cta}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        )
    }

    return (
        <Button
            className={`w-full mb-8 ${
                highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : tierName === "Starter"
                        ? "bg-green-700 text-white hover:bg-green-800 border-none shadow-md shadow-green-900/20"
                        : ""
            }`}
            variant={variant}
            size="lg"
            onClick={handleCheckout}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    {cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </>
            )}
        </Button>
    )
}

/**
 * Handles toast notifications for payment success/cancel states.
 * Reads URL search params and shows appropriate toast messages.
 */
export function PaymentToastHandler() {
    const searchParams = useSearchParams()

    useEffect(() => {
        if (searchParams.get("success") === "true") {
            toast.success("Payment successful! Welcome to Pro.", {
                description: "Your account has been upgraded.",
            })
        }
        if (searchParams.get("canceled") === "true") {
            toast.info("Payment canceled", {
                description: "No charges were made.",
            })
        }
    }, [searchParams])

    return null
}
