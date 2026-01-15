import { Building2, Crown, Sparkles, type LucideIcon } from "lucide-react"
import Link from "next/link"


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
        description: "Try Pro, on us",
        price: 0,
        icon: Sparkles,
        highlighted: false,
        badge: "Free",
        cta: "Start Creating",
        ctaVariant: "default",
        features: ["Everything in Pro for 24 hours"],
    },
    {
        name: "Pro",
        description: "Access to every feature and model",
        poweredBy: {
            name: "Nano Banana Pro",
            logo: "/image-models/google.svg",
        },
        price: 3,
        icon: Crown,
        highlighted: true,
        badge: "Popular",
        cta: "Upgrade to Pro",
        ctaVariant: "default",
        features: [
            "180 Nano Banana Pro images/month",
            "Daily resets",
            "13+ AI models included",
            "Advanced prompt enhancement",
            "Custom prompt library",
            "1,000 image batch queue",
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
            "Credit-based system designed to take more money from you",
            "Expensive Tiers to just do what you want to do",
            "Can't queue more than 5 images on most plans",
            "Lack of private generations",
            "NSFW generations blocked",
        ],
    },
]

export const pricingFaqs = [
    {
        question: "How does the free plan work?",
        answer:
            "Sign up and get 180 Nano Banana Pro images every month for free. Your quota resets daily (approx. 6 images/day). No credit card required.",
    },
    {
        question: "What happens if I need more images?",
        answer:
            "You have three options:\n\n1. Upgrade to Pro ($3/month) for exclusive features like private generations, NSFW generations, advanced prompt enhancement, and a 1,000 image batch queue. Note: This plan includes the same 180 images/month quota as the Starter plan.\n\n2. Wait for your daily reset.\n\n3. Purchase additional Pollen credits directly from Pollinations to extend your quota beyond the included 180 images/month.",
    },
    {
        question: "What AI models are included?",
        answer: (
            <span>
                We offer 13+ cutting-edge and popular models including Flux, GPT-4 Image, Seedream, and more. Both Free and Pro users get access to all models.{" "}
                <Link href="/#models" className="text-primary hover:underline font-medium">
                    View the full list of supported models here.
                </Link>
            </span>
        ),
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
    { feature: "Monthly images", starter: "180", pro: "180", competitors: "60 (at 140 tokens)" },
    { feature: "Monthly cost", starter: "$0", pro: "$3", competitors: "$12 / $30 / $60" },
    { feature: "Credit system", starter: "Simple daily reset", pro: "Simple daily reset", competitors: "Designed to take money" },
    { feature: "Queue priority", starter: "Zero artificial delays", pro: "Zero artificial delays", competitors: "Paid queue tiers" },
    {
        feature: "Simultaneous creation",
        starter: "10 generations/sec",
        pro: "10 generations/sec",
        competitors: "4-8 (on high tiers)",
        details: {
            title: "Simultaneous creation",
            description: "We host zero artificial queues. The moment you click generate, your request is fired directly to the model.",
            cardTitle: "10 generations / sec",
            cardDescription: "That's 600 concurrent requests per minute. Generate your entire batch in seconds—our infrastructure scales instantly to match your creative throughput.",
            footer: "Zero throttle. No gatekeeping.",
        },
    },
    { feature: "Batch queue size", starter: "1,000", pro: "1,000", competitors: "10-20" },
    { feature: "AI Models", starter: "13+", pro: "13+", competitors: "13+" },
    { feature: "Prompt library", starter: true, pro: true, competitors: false },
    { feature: "Prompt enhancement", starter: true, pro: true, competitors: "Basic" },
    { feature: "Private gallery", starter: true, pro: true, competitors: "Varies" },
    { feature: "NSFW Generations (on supported models)", starter: true, pro: true, competitors: false },
] as const
