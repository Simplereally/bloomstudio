"use client"

/**
 * Upgrade Modal
 *
 * An elegant modal that appears when a user's trial has expired.
 * Provides a refined upgrade flow to the Pro subscription.
 */
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/convex/_generated/api"
import { STRIPE_CONFIG, isStripeConfigured } from "@/lib/config/stripe"
import { useAction } from "convex/react"
import {
    ArrowRight,
    Images,
    Loader2,
    Palette,
    RefreshCw,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

interface UpgradeModalProps {
    /** Whether the modal is open */
    isOpen: boolean
    /** Callback when modal is closed */
    onClose: () => void
}

const proFeatures = [
    { icon: Images, label: "900", description: "NanoBanana images/month" },
    { icon: Palette, label: "10+", description: "AI models included" },
    { icon: RefreshCw, label: "Daily", description: "quota refresh" },
]

/**
 * Modal dialog for upgrading to Pro subscription.
 * Displayed when trial limits are reached or user explicitly requests upgrade.
 */
export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const createCheckout = useAction(api.stripe.createSubscriptionCheckout)

    const handleUpgrade = async () => {
        // Check Stripe configuration
        if (!isStripeConfigured()) {
            console.error("Stripe configuration missing: NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID not set")
            toast.error("Payment unavailable", {
                description: "Please try again later or contact support.",
            })
            return
        }

        setIsLoading(true)

        try {
            const { url } = await createCheckout({
                priceId: STRIPE_CONFIG.prices.proMonthly,
                isAnnual: false,
                successUrl: `${window.location.origin}/studio?upgraded=true`,
                cancelUrl: `${window.location.origin}/pricing?canceled=true`,
            })

            // Redirect to Stripe Checkout
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
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/50 bg-card shadow-2xl">
                {/* Subtle accent line at top */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                <div className="px-6 pt-5 pb-4">
                    <DialogHeader className="space-y-2">
                        <p className="text-[10px] font-medium tracking-widest uppercase text-primary/80">
                            Trial Ended
                        </p>
                        <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                            Continue Creating
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Unlock unlimited creative potential with Pro.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Feature grid */}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                        {proFeatures.map((feature) => {
                            const Icon = feature.icon
                            return (
                                <div
                                    key={feature.label}
                                    className="flex flex-col items-center text-center py-3 px-2 rounded-lg bg-muted/30 border border-border/30"
                                >
                                    <Icon className="w-4 h-4 text-primary/70 mb-2" strokeWidth={1.5} />
                                    <p className="text-base font-semibold text-foreground tabular-nums leading-none">
                                        {feature.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {feature.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Pricing */}
                    <div className="mt-5 text-center">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-3xl font-semibold tracking-tight text-foreground">$5</span>
                            <span className="text-sm text-muted-foreground">/month</span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            Go to {" "}
                            <a href="/pricing" className="text-primary hover:underline">
                                Pricing
                            </a>
                            {" "}to see how we offer more value than competitors.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 space-y-2">
                        <Button
                            onClick={handleUpgrade}
                            disabled={isLoading}
                            className="w-full h-10 font-medium transition-all duration-200"
                            size="default"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Redirecting...
                                </>
                            ) : (
                                <>
                                    Upgrade to Pro
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>

                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-full py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                            Not now
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-muted/20 border-t border-border/30">
                    <p className="text-center text-xs text-muted-foreground">
                        Cancel anytime · Powered by{" "}
                        <a
                            href="https://stripe.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#635BFF] hover:underline font-medium"
                        >
                            Stripe
                        </a>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
