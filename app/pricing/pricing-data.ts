import { Building2, Crown, Sparkles, type LucideIcon } from "lucide-react"

export type TierName = "Starter" | "Pro" | "Competitors"

export interface PricingTier {
    name: TierName
    description: string
    price: number | null
    icon: LucideIcon
    highlighted: boolean
    badge?: string
    cta: string
    ctaVariant: "default" | "outline"
    features: string[]
    poweredBy?: {
        name: string
        logo: string
    }
}

export const pricingTiers: PricingTier[] = [
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
            "900 Nano Banana Pro images/month",
            "Daily resets, not monthly",
            "12+ AI models included",
            "Advanced prompt enhancement",
            "1,000+ image batch queue",
            "Private generations",
            "NSFW Generations (on supported models)",
        ],
    },
    {
        name: "Competitors",
        description: "Long queue times. Expensive. Slow.",
        price: null,
        icon: Building2,
        highlighted: false,
        cta: "See the comparison table",
        ctaVariant: "outline",
        features: [
            "Queue times, even after you've paid them",
            "Credit-based systen designed to take more money from you",
            " Expensive Tiers to just do what you want to do",
            "Can't queue more than 5 image on most plans",
            "Lack of private generations",
            "NSFW generations blocked",
        ],
    },
]

export const pricingFaqs = [
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

export const featureComparison = [
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
    { feature: "NSFW Generations (on supported models)", starter: true, pro: true, competitors: false },
] as const
