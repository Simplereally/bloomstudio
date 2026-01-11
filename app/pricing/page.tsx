import { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import type { Product, WithContext } from "schema-dts"
import { CompetitorComparison } from "@/components/landing/competitor-comparison"
import { LandingHeader } from "@/components/landing/landing-header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { ArrowRight, Check, HelpCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"

import { pricingTiers, pricingFaqs, featureComparison } from "./pricing-data"
import { CheckoutButton, PaymentToastHandler } from "./checkout-button"

export const metadata: Metadata = {
    title: "Pricing | Bloom Studio",
    description: "Simple pricing for AI image and video generation. Start for free, upgrade for just $5/month.",
    alternates: {
        canonical: "/pricing",
    },
    openGraph: {
        title: "Pricing | Bloom Studio",
        description: "Unbeatable value. 900 images/mo for $5. Compare vs Leonardo.ai.",
        url: "/pricing",
    },
}

/**
 * Pricing Page - Server Component with SSR-rendered content
 *
 * All static content (tiers, features, FAQs, comparison tables) is rendered
 * server-side for optimal SEO. Only the checkout buttons and toast handling
 * are client components.
 */
export default function PricingPage() {
    const jsonLd: WithContext<Product> = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Bloom Studio Pro",
        description: "Professional AI image and video generation subscription. Includes 900 images/month, all models (Flux, Veo, etc), and private generations.",
        image: "https://bloomstudio.fun/branding/bloom-studio_logo.png",
        offers: {
            "@type": "Offer",
            price: "5.00",
            priceCurrency: "USD",
            priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
            availability: "https://schema.org/InStock",
            url: "https://bloomstudio.fun/pricing",
            category: "Subscription",
        },
        brand: {
            "@type": "Brand",
            name: "Bloom Studio",
        },
    }

    return (
        <>
            <JsonLd data={jsonLd} />
            <LandingHeader />

            {/* Toast handler for payment success/cancel - Client Component */}
            <Suspense fallback={null}>
                <PaymentToastHandler />
            </Suspense>

            <div className="min-h-svh bg-background">
                {/* Hero + Value Proposition - Static SSR */}
                <section className="container mx-auto px-6 pt-32 pb-10 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                        Simple pricing. <span className="text-primary">Unbeatable value.</span>
                    </h1>
                </section>

                {/* Pricing Cards Section - Static SSR with Client checkout buttons */}
                <section className="container mx-auto px-6 pb-10 text-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {pricingTiers.map((tier) => {
                            const Icon = tier.icon

                            return (
                                <div
                                    key={tier.name}
                                    className={`relative rounded-2xl p-8 text-left transition-all duration-300 ${
                                        tier.highlighted
                                            ? "bg-gradient-to-b from-primary/10 via-card to-card border-2 border-primary/50 shadow-xl shadow-primary/10 scale-[1.02]"
                                            : tier.name === "Starter"
                                                ? "bg-gradient-to-b from-green-600/5 via-card/80 to-card border border-green-600/20 shadow-lg shadow-green-900/5 hover:border-green-600/40"
                                                : "bg-card/40 backdrop-blur-[2px] border border-border/50 hover:border-primary/20 opacity-90"
                                    }`}
                                >
                                    {tier.badge && (
                                        <Badge
                                            className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 ${
                                                tier.name === "Starter" ? "bg-green-700 hover:bg-green-800" : "bg-primary"
                                            } text-primary-foreground`}
                                        >
                                            {tier.badge}
                                        </Badge>
                                    )}

                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                                tier.highlighted ? "bg-primary/20" : tier.name === "Starter" ? "bg-green-600/10" : "bg-muted"
                                            }`}
                                        >
                                            <Icon
                                                className={`h-5 w-5 ${
                                                    tier.highlighted ? "text-primary" : tier.name === "Starter" ? "text-green-700" : "text-muted-foreground"
                                                }`}
                                            />
                                        </div>
                                        <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                                    </div>

                                    <div className="mb-6">
                                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                                        {tier.poweredBy && (
                                            <div className="flex items-center gap-1.5 mt-2.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-muted/50 py-1 px-2 rounded-md border border-border/50 w-fit">
                                                <Image
                                                    src={tier.poweredBy.logo}
                                                    alt={tier.poweredBy.name}
                                                    width={12}
                                                    height={12}
                                                    className="opacity-70 contrast-125"
                                                />
                                                <span>{tier.poweredBy.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        {tier.name === "Competitors" ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold text-foreground">$20–$100</span>
                                                <span className="text-muted-foreground">/month</span>
                                            </div>
                                        ) : tier.price !== null ? (
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
                                        {tier.name === "Pro" && <p className="text-xs text-primary font-medium mt-1">= $0.005 per image</p>}
                                        {tier.name === "Competitors" && <p className="text-xs text-muted-foreground mt-1">= $0.20 per image</p>}
                                    </div>

                                    {/* Checkout Button - Client Component */}
                                    <CheckoutButton
                                        tierName={tier.name}
                                        cta={tier.cta}
                                        highlighted={tier.highlighted}
                                        variant={tier.ctaVariant}
                                    />

                                    <ul className={`space-y-3 ${tier.name === "Competitors" ? "mt-0" : ""}`}>
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <Check className={`h-4 w-4 mt-0.5 shrink-0 ${tier.name === "Starter" ? "text-green-600" : "text-primary"}`} />
                                                <span className="text-muted-foreground">
                                                    {feature.includes("24 hours of everything in Pro") ? (
                                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                                            {feature}
                                                            <ArrowRight className="h-3.5 w-3.5 text-green-600" />
                                                        </span>
                                                    ) : feature.includes("Nano Banana Pro") ? (
                                                        <span className="flex items-center gap-1 flex-wrap">
                                                            {feature.split("Nano Banana Pro")[0]}
                                                            <span className="inline-flex items-center gap-1 font-semibold text-foreground/90">
                                                                <Image
                                                                    src="/image-models/google.svg"
                                                                    alt="Gemini"
                                                                    width={12}
                                                                    height={12}
                                                                    className="opacity-80 contrast-125"
                                                                />
                                                                Nano Banana Pro
                                                            </span>
                                                            {feature.split("Nano Banana Pro")[1]}
                                                        </span>
                                                    ) : (
                                                        feature
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* Competitor Comparison - Static SSR */}
                <section className="container mx-auto px-6 pb-16">
                    <div className="max-w-[1172px] mx-auto">
                        <CompetitorComparison />
                    </div>
                </section>

                {/* Distilled Value Section - Static SSR */}
                <section className="container mx-auto px-6 pb-16">
                    <div className="max-w-xl mx-auto mb-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/30">
                        <div className="flex flex-col items-center gap-3 mb-4">
                            <div className="flex items-center gap-2 text-[12px] uppercase tracking-wider font-bold text-muted-foreground bg-muted/30 py-1 px-3 rounded-full border border-border/30">
                                <Image src="/image-models/google.svg" alt="Nano Banana Pro" width={12} height={12} className="opacity-60 contrast-125" />
                                <span>Nano Banana Pro</span>
                            </div>

                            <div className="flex items-center justify-center gap-6">
                                <div className="text-center">
                                    <div className="text-5xl sm:text-6xl font-black text-primary tabular-nums">900</div>
                                    <div className="text-sm text-muted-foreground">images/month</div>
                                </div>
                                <div className="text-center pl-6 border-l border-border">
                                    <div className="text-5xl sm:text-6xl font-black text-foreground">$5</div>
                                    <div className="text-sm text-muted-foreground">/month</div>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground text-center">
                            That&apos;s <span className="text-primary font-semibold">$0.005 per image</span> — Leonardo charges{" "}
                            <span className="text-orange-500 font-semibold">$0.14–$0.20</span>
                        </p>
                    </div>
                </section>

                {/* Feature Comparison Table - Static SSR */}
                <section id="comparison-table" className="container mx-auto px-6 py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Compare plans in detail</h2>
                        <p className="text-muted-foreground">See exactly what you get with each plan</p>
                    </div>

                    <div className="max-w-4xl mx-auto overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Feature</th>
                                    <th className="text-center py-4 px-4 text-sm font-medium text-foreground">Starter</th>
                                    <th className="text-center py-4 px-4 text-sm font-medium text-primary">Pro</th>
                                    <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">Competitors</th>
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
                                                    <span className={`text-sm ${tier === "pro" ? "text-primary font-medium" : "text-muted-foreground"}`}>
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

                {/* FAQ Section - Static SSR */}
                <section className="container mx-auto px-6 py-20">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <HelpCircle className="h-5 w-5 text-primary" />
                                <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
                            </div>
                            <p className="text-muted-foreground">Everything you need to know about our pricing</p>
                        </div>

                        <Accordion type="single" collapsible className="w-full">
                            {pricingFaqs.map((faq, index) => (
                                <AccordionItem key={index} value={`faq-${index}`} className="border-border/50">
                                    <AccordionTrigger className="text-left text-foreground hover:text-primary">{faq.question}</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>

                {/* CTA Section - Static SSR */}
                <section className="container mx-auto px-6 py-20">
                    <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20 p-12">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Ready to create stunning images?</h2>
                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                            Get 24 hours of full access — all models, max resolution, no limits. Then just $5/month to keep creating.
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

                <Footer />
            </div>
        </>
    )
}
