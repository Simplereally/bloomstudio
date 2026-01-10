"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { STRIPE_CONFIG, isStripeConfigured } from "@/lib/config/stripe";
import { Footer } from "@/components/layout/footer";
import { CompetitorComparison } from "@/components/landing/competitor-comparison";

import { ArrowRight, Building2, Check, Crown, HelpCircle, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

type TierName = "Starter" | "Pro" | "Competitors";

const tiers: Array<{
  name: TierName;
  description: string;
  price: number | null;
  icon: typeof Sparkles;
  highlighted: boolean;
  badge?: string;
  cta: string;
  ctaVariant: "default" | "outline";
  features: string[];
  poweredBy?: {
    name: string;
    logo: string;
  };
}> = [
  {
    name: "Starter",
    description: "Try everything for 24 hours — no strings attached",
    price: 0,
    icon: Sparkles,
    highlighted: false,
    badge: "Limited Time Free",
    cta: "Start Free Trial",
    ctaVariant: "default",
    features: ["24 hours of everything in Pro"],
  },
  {
    name: "Pro",
    description: "900 images/mo for less than a coffee",
    poweredBy: {
      name: "Nano Banana Pro",
      logo: "/image-models/google.svg",
    },
    price: 5,
    icon: Crown,
    highlighted: true,
    badge: "15× More Than Leonardo",
    cta: "Upgrade to Pro",
    ctaVariant: "default",
    features: [
      "900 Nano Banana Pro images/month (vs 60 on Leonardo)",
      "Daily resets — never lose unused quota",
      "All 10+ AI models included",
      "High resolution up to 2048×2048",
      "Advanced prompt enhancement",
      "1,000+ image batch queue",
      "Private generations",
      "NSFW Generations",
    ],
  },
  {
    name: "Competitors",
    description: "Leonardo.ai Apprentice tier",
    price: null, // Using custom price display in JSX
    icon: Building2,
    highlighted: false,
    cta: "See the comparison table",
    ctaVariant: "outline",
    features: [
      "~60 images/month at this quality",
      "Token-based system (140/image)",
      "Higher tiers: $30-60/mo",
      "Queue limited to 10 images",
      "Private generation = extra tokens",
      "No NSFW generations allowed",
    ],
  },
];

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
];

const featureComparison = [
  { feature: "Access duration", starter: "24 hours", pro: "Unlimited", competitors: "Unlimited" },
  { feature: "Full Access", starter: true, pro: true, competitors: false },
  { feature: "Monthly images", starter: "900 (Trial)", pro: "900", competitors: "60 (at 140 tokens)" },
  { feature: "Monthly cost", starter: "$0", pro: "$5", competitors: "$12 / $30 / $60" },
  { feature: "Cost per image", starter: "Free", pro: "$0.005", competitors: "$0.14 – $0.20" },
  { feature: "AI Models", starter: "10+", pro: "10+", competitors: "10+" },
  { feature: "Max resolution", starter: "2048×2048", pro: "2048×2048", competitors: "Varies" },
  { feature: "Batch queue size", starter: "1,000+", pro: "1,000+", competitors: "10-20" },
  { feature: "Prompt enhancement", starter: true, pro: true, competitors: "Basic" },
  { feature: "Private gallery", starter: true, pro: true, competitors: "Varies" },
  { feature: "NSFW Generations", starter: true, pro: true, competitors: false },
];

function PricingContent() {
  const [loadingTier, setLoadingTier] = useState<TierName | null>(null);
  const { isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const createCheckout = useAction(api.stripe.createSubscriptionCheckout);

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Welcome to Pro.", {
        description: "Your account has been upgraded.",
      });
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Payment canceled", {
        description: "No charges were made.",
      });
    }
  }, [searchParams]);

  async function handleCheckout(tierName: TierName) {
    if (tierName === "Starter") {
      // Free tier - just redirect to studio
      window.location.href = "/studio";
      return;
    }

    if (tierName === "Competitors") {
      toast.info("Why pay more?", {
        description: "Competitors charge >2x more for fewer features.",
      });
      return;
    }

    // Require sign-in for checkout
    if (!isSignedIn) {
      toast.error("Please sign in first", {
        description: "You need to be signed in to subscribe.",
      });
      window.location.href = "/sign-in?redirect_url=/pricing";
      return;
    }

    // Check Stripe configuration
    if (!isStripeConfigured()) {
      console.error("Stripe configuration missing: NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID not set");
      toast.error("Payment unavailable", {
        description: "Please try again later or contact support.",
      });
      return;
    }

    // Pro tier - create Stripe checkout session via Convex
    setLoadingTier(tierName);

    try {
      const { url } = await createCheckout({
        priceId: STRIPE_CONFIG.prices.proMonthly,
        isAnnual: false,
        successUrl: `${window.location.origin}/studio?upgraded=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      });

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed", {
        description: "Please try again later or contact support.",
      });
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Hero + Value Proposition - Tight & Focused */}
      <section className="container mx-auto px-6 pt-32 pb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Simple pricing. <span className="text-primary">Unbeatable value.</span>
        </h1>
      </section>

      {/* Pricing Cards Section (Moved Up) */}
      <section className="container mx-auto px-6 pb-10 text-center">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isLoading = loadingTier === tier.name;

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

                {tier.name === "Competitors" ? (
                  <Button
                    className="w-full mb-8"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const el = document.getElementById("comparison-table");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    {tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className={`w-full mb-8 ${
                      tier.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : tier.name === "Starter"
                          ? "bg-green-700 text-white hover:bg-green-800 border-none shadow-md shadow-green-900/20"
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
            );
          })}
        </div>
      </section>

      {/* Competitor Comparison (New) */}
      <section className="container mx-auto px-6 pb-16">
        <div className="max-w-[1172px] mx-auto">
          <CompetitorComparison />
        </div>
      </section>

      {/* Distilled Value Section - The Core Value Summary */}
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

      {/* Feature Comparison Table */}
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

      {/* FAQ Section */}
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
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-border/50">
                <AccordionTrigger className="text-left text-foreground hover:text-primary">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function PricingClient() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-background" />}>
      <PricingContent />
    </Suspense>
  );
}
