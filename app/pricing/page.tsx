"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { STRIPE_CONFIG, isStripeConfigured } from "@/lib/config/stripe"
import {
    ArrowRight,
    Building2,
    Check,
    Crown,
    HelpCircle,
    Loader2,
    Sparkles
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { toast } from "sonner"

type TierName = "Starter" | "Pro" | "Competitors"

const tiers: Array<{
    name: TierName
    description: string
    price: number | null
    icon: typeof Sparkles
    highlighted: boolean
    badge?: string
    cta: string
    ctaVariant: "default" | "outline"
    features: string[]
}> = [
        {
            name: "Starter",
            description: "24-hour free trial — full access to everything",
            price: 0,
            icon: Sparkles,
            highlighted: false,
            cta: "Try free now",
            ctaVariant: "outline",
            features: [
                "Everything in Pro - for 24 hours"
            ],
        },
        {
            name: "Pro",
            description: "900 images/mo for less than a coffee",
            price: 5,
            icon: Crown,
            highlighted: true,
            badge: "15× More Than Leonardo",
            cta: "Upgrade to Pro",
            ctaVariant: "default",
            features: [
                "900 images/month (vs 60 on Leonardo)",
                "Daily resets — never lose unused quota",
                "All 10+ AI models included",
                "High resolution up to 2048×2048",
                "Advanced prompt enhancement",
                "1,000+ image batch queue",
                "Private generations",
                "NSFW Generations"
            ],
        },
        {
            name: "Competitors",
            description: "Leonardo.ai Apprentice tier",
            price: 12,
            icon: Building2,
            highlighted: false,
            cta: "Why Pay More?",
            ctaVariant: "outline",
            features: [
                "~60 images/month at this quality",
                "Token-based system (140/image)",
                "Monthly reset — use it or lose it",
                "Higher tiers: $30-60/mo",
                "Queue limited to 10 images",
                "Private generation = extra tokens",
            ],
        },
    ]

const faqs = [
    {
        question: "How does the free trial work?",
        answer:
            "Sign up and get 24 hours of full, unrestricted access to everything — all models, max resolution, batch generation. No credit card required. After 24 hours, upgrade to Pro for $5/month to continue.",
    },
    {
        question: "What happens after my trial expires?",
        answer:
            "You'll need to upgrade to Pro ($5/month) to continue generating images. Your account and any images you created during the trial remain accessible.",
    },
    {
        question: "What AI models are included?",
        answer:
            "We offer 10+ cutting-edge models including Flux, GPT-4 Image, Seedream, and more. Both trial and Pro users get access to all models.",
    },
    {
        question: "Why is this so much cheaper than competitors?",
        answer:
            "We built Bloomstudio to make AI image generation accessible to everyone. By keeping our infrastructure lean and focusing on what matters, we pass the savings to you.",
    },
    {
        question: "Can I cancel anytime?",
        answer:
            "Yes, cancel anytime with no questions asked. Your subscription runs until the end of the billing period, then you won't be charged again.",
    },
]

const featureComparison = [
    { feature: "Access duration", starter: "24 hours", pro: "Unlimited", competitors: "Unlimited" },
    { feature: "Monthly images", starter: false, pro: "900", competitors: "60 (at 140 tokens)" },
    { feature: "Monthly cost", starter: "$0", pro: "$5", competitors: "$12 / $30 / $60" },
    { feature: "Cost per image", starter: "Free", pro: "$0.005", competitors: "$0.14 – $0.20" },
    { feature: "AI Models", starter: "10+", pro: "10+", competitors: "10+" },
    { feature: "Max resolution", starter: "2048×2048", pro: "2048×2048", competitors: "Varies" },
    { feature: "Batch queue size", starter: "1,000+", pro: "1,000+", competitors: "10-20" },
    { feature: "Prompt enhancement", starter: true, pro: true, competitors: "Basic" },
    { feature: "Private gallery", starter: true, pro: true, competitors: "Varies" },
    { feature: "NSFW Generations", starter: true, pro: true, competitors: false },
]

function PricingContent() {
    const [loadingTier, setLoadingTier] = useState<TierName | null>(null)
    const { isSignedIn } = useUser()
    const searchParams = useSearchParams()
    const createCheckout = useAction(api.stripe.createSubscriptionCheckout)

    // Handle success/cancel from Stripe redirect
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

    async function handleCheckout(tierName: TierName) {
        if (tierName === "Starter") {
            // Free tier - just redirect to studio
            window.location.href = "/studio"
            return
        }

        if (tierName === "Competitors") {
            toast.info("Why pay more?", {
                description: "Competitors charge >2x more for fewer features.",
            })
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
            toast.error("Stripe not configured", {
                description: "Please set NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID in environment variables.",
            })
            return
        }

        // Pro tier - create Stripe checkout session via Convex
        setLoadingTier(tierName)

        try {
            const { url } = await createCheckout({
                priceId: STRIPE_CONFIG.prices.proMonthly,
                isAnnual: false,
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
                description: error instanceof Error ? error.message : "Please try again",
            })
        } finally {
            setLoadingTier(null)
        }
    }

    return (
        <div className="min-h-svh bg-background">
            {/* Hero + Value Proposition - Tight & Focused */}
            <section className="container mx-auto px-6 pt-16 pb-10 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                    Simple pricing. <span className="text-primary">Unbeatable value.</span>
                </h1>

                {/* Model reference tag */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="text-base text-muted-foreground">Let&apos;s use</span>
                    <Badge variant="outline" className="gap-2 px-3 py-1.5 border-border bg-card/50 text-base">
                        <Image src="/image-models/google.svg" alt="Google" width={18} height={18} className="opacity-80" />
                        <span className="font-semibold text-foreground">NanoBanana Pro</span>
                    </Badge>
                    <span className="text-base text-muted-foreground">as an example</span>
                </div>

                {/* The Core Value - Immediate Impact */}
                <div className="max-w-xl mx-auto mb-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/30">
                    <div className="flex items-center justify-center gap-6 mb-3">
                        <div className="text-center">
                            <div className="text-5xl sm:text-6xl font-black text-primary tabular-nums">900</div>
                            <div className="text-sm text-muted-foreground">images/month</div>
                        </div>
                        <div className="text-center pl-6 border-l border-border">
                            <div className="text-5xl sm:text-6xl font-black text-foreground">$5</div>
                            <div className="text-sm text-muted-foreground">/month</div>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        That&apos;s <span className="text-primary font-semibold">$0.005 per image</span> — Leonardo charges <span className="text-orange-500 font-semibold">$0.14–$0.20</span>
                    </p>
                </div>

                {/* Leonardo Tier Comparison */}
                <div className="max-w-3xl mx-auto mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">vs Leonardo.ai (at 140 tokens per image)</p>
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        {/* PixelStream */}
                        <div className="p-3 sm:p-4 rounded-xl bg-primary/10 border border-primary/30">
                            <div className="font-semibold text-primary mb-2 text-sm">PixelStream</div>
                            <div className="text-2xl sm:text-3xl font-black text-foreground leading-none">900 <span className="text-sm font-medium text-muted-foreground">images</span></div>
                            <div className="text-base font-semibold text-foreground mt-2">$5/mo</div>
                            <div className="text-xs font-bold text-primary mt-1">Best Value</div>
                        </div>
                        {/* Leonardo Apprentice - bad value */}
                        <div className="p-3 sm:p-4 rounded-xl bg-red-500/8 border border-red-400/25">
                            <div className="font-medium text-red-400 mb-2 text-sm">Apprentice</div>
                            <div className="text-2xl sm:text-3xl font-black text-red-400/80 leading-none">60 <span className="text-sm font-medium text-muted-foreground">images</span></div>
                            <div className="text-base font-semibold text-red-400 mt-2">$12/mo</div>
                            <div className="text-xs font-bold text-red-500 mt-1">Wow, 36× worse</div>
                        </div>
                        {/* Leonardo Artisan - bad value */}
                        <div className="p-3 sm:p-4 rounded-xl bg-red-500/8 border border-red-400/25">
                            <div className="font-medium text-red-400 mb-2 text-sm">Artisan</div>
                            <div className="text-2xl sm:text-3xl font-black text-red-400/80 leading-none">178 <span className="text-sm font-medium text-muted-foreground">images</span></div>
                            <div className="text-base font-semibold text-red-400 mt-2">$30/mo</div>
                            <div className="text-xs font-bold text-red-500 mt-1">Still 30× worse?</div>
                        </div>
                        {/* Leonardo Maestro - bad value */}
                        <div className="p-3 sm:p-4 rounded-xl bg-red-500/8 border border-red-400/25">
                            <div className="font-medium text-red-400 mb-2 text-sm">Maestro</div>
                            <div className="text-2xl sm:text-3xl font-black text-red-400/80 leading-none">428 <span className="text-sm font-medium text-muted-foreground">images</span></div>
                            <div className="text-base font-semibold text-red-400 mt-2">$60/mo</div>
                            <div className="text-xs font-bold text-red-500 mt-1">Oh no… 25× worse</div>
                        </div>
                    </div>
                    <div className="mt-5 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Even Leonardo&apos;s <span className="text-orange-400 font-semibold">$60/mo Maestro</span> tier gives you:</p>
                        <p className="text-base md:text-lg font-semibold">
                            <span className="text-foreground">Less than half the images</span>
                            <span className="text-muted-foreground/50 mx-2">—</span>
                            <span className="text-orange-400">at 12× the price</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Pricing Cards Section */}
            <section className="container mx-auto px-6 pb-16 text-center">
                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {tiers.map((tier) => {
                        const Icon = tier.icon
                        const isLoading = loadingTier === tier.name

                        return (
                            <div
                                key={tier.name}
                                className={`relative rounded-2xl p-8 text-left transition-all duration-300 ${tier.highlighted
                                    ? "bg-gradient-to-b from-primary/10 via-card to-card border-2 border-primary/50 shadow-xl shadow-primary/10 scale-[1.02]"
                                    : "bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 hover:shadow-lg"
                                    }`}
                            >
                                {tier.badge && (
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                                        {tier.badge}
                                    </Badge>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tier.highlighted ? "bg-primary/20" : "bg-muted"
                                            }`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 ${tier.highlighted ? "text-primary" : "text-muted-foreground"
                                                }`}
                                        />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                                </div>

                                <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

                                <div className="mb-6">
                                    {tier.price !== null ? (
                                        tier.price === 0 ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold text-foreground">Free</span>
                                                <span className="text-muted-foreground">for 24 hours</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold text-foreground">${tier.price}</span>
                                                <span className="text-muted-foreground">/month</span>
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-2xl font-bold text-foreground">Custom</div>
                                    )}
                                    {tier.name === "Pro" && (
                                        <p className="text-xs text-primary font-medium mt-1">
                                            = $0.005 per image
                                        </p>
                                    )}
                                    {tier.name === "Competitors" && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            = $0.20 per image
                                        </p>
                                    )}
                                </div>

                                {tier.name !== "Competitors" && (
                                    <Button
                                        className={`w-full mb-8 ${tier.highlighted
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : ""
                                            }`}
                                        variant={tier.ctaVariant}
                                        size="lg"
                                        onClick={() => handleCheckout(tier.name)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {tier.cta}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                )}

                                <ul className={`space-y-3 ${tier.name === "Competitors" ? "mt-0" : ""}`}>
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm">
                                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section id="compare" className="container mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-foreground mb-4">Compare plans in detail</h2>
                    <p className="text-muted-foreground">
                        See exactly what you get with each plan
                    </p>
                </div>

                <div className="max-w-4xl mx-auto overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                                    Feature
                                </th>
                                <th className="text-center py-4 px-4 text-sm font-medium text-foreground">
                                    Starter
                                </th>
                                <th className="text-center py-4 px-4 text-sm font-medium text-primary">
                                    Pro
                                </th>
                                <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">
                                    Competitors
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {featureComparison.map((row) => (
                                <tr key={row.feature} className="border-b border-border/50">
                                    <td className="py-4 px-4 text-sm text-foreground">{row.feature}</td>
                                    {(["starter", "pro", "competitors"] as const).map((tier) => (
                                        <td key={tier} className="py-4 px-4 text-center">
                                            {typeof row[tier] === "boolean" ? (
                                                row[tier] ? (
                                                    <Check className="h-4 w-4 text-primary mx-auto" />
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )
                                            ) : (
                                                <span
                                                    className={`text-sm ${tier === "pro" ? "text-primary font-medium" : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {row[tier]}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <HelpCircle className="h-5 w-5 text-primary" />
                            <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
                        </div>
                        <p className="text-muted-foreground">
                            Everything you need to know about our pricing
                        </p>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`faq-${index}`} className="border-border/50">
                                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20 p-12">
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                        Ready to create stunning images?
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        Get 24 hours of full access — all models, max resolution, no limits.
                        Then just $5/month to keep creating.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/studio">
                            <Button size="lg" className="px-8">
                                Start Your Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/40 py-8">
                <div className="container mx-auto text-center">
                    <p className="text-xs text-muted-foreground">
                        Powered by{" "}
                        <a
                            href="https://pollinations.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            Pollinations.AI
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-svh bg-background" />}>
            <PricingContent />
        </Suspense>
    )
}
