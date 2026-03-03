import { Crown, Sparkles, type LucideIcon } from "lucide-react"
import Link from "next/link"


export type TierName = "Starter" | "Pro"

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
            name: "Flux Schnell",
            logo: "/image-models/flux.svg",
        },
        price: 3,
        icon: Crown,
        highlighted: true,
        badge: "Popular",
        cta: "Upgrade to Pro",
        ctaVariant: "default",
        features: [
            "Up to 5,000 daily generations",
            "Daily resets",
            "8 AI models included (Flux, GPT Image, Z-Image, Klein, Grok Imagine, Grok Video, and more)",
            "Advanced prompt enhancement",
            "Custom prompt library",
            "1,000 image batch queue",
            "Private generations",
            "NSFW Generations (on supported models)",
        ],
    },
]

export const pricingFaqs = [
    {
        question: "How does the free plan work?",
        answer:
            "Sign up and get up to 5,000 generations every single day for free. Your quota resets every 24 hours. No credit card required.",
    },
    {
        question: "What happens if I need more images?",
        answer:
            "You have three options:\n\n1. Upgrade to Pro ($3/month) for exclusive features like private generations, NSFW generations, advanced prompt enhancement, and a 1,000 image batch queue. Note: This plan includes the same massive daily quotas as the Starter plan.\n\n2. Wait for your daily reset.\n\n3. Purchase additional Pollen credits directly from Pollinations to extend your quota beyond the included daily limits.",
    },
    {
        question: "What AI models are included?",
        answer: (
            <span>
                We offer 8 high-quality AI models including Flux Schnell, GPT Image, Z-Image Turbo, FLUX.2 Klein, Imagen 4, Grok Imagine, and Grok Video. Both Free and Pro users get access to all active models.{" "}
                <Link href="/#models" className="text-primary hover:underline font-medium">
                    View the full list of supported models here.
                </Link>
            </span>
        ),
    },
    {
        question: "Why is this so affordable?",
        answer:
            "We built Bloom Studio to make AI image generation accessible to everyone. By keeping our infrastructure lean and focusing on what matters, we pass the savings to you.",
    },
    {
        question: "Can I cancel anytime?",
        answer:
            "Yes, cancel anytime with no questions asked. Your subscription runs until the end of the billing period, then you won't be charged again.",
    },
]

export const featureComparison = [
    { feature: "Daily images", starter: "5,000+", pro: "5,000+" },
    { feature: "Monthly cost", starter: "$0", pro: "$3" },
    { feature: "Quota system", starter: "Simple daily reset", pro: "Simple daily reset" },
    { feature: "Queue priority", starter: "Zero artificial delays", pro: "Zero artificial delays" },
    {
        feature: "Simultaneous creation",
        starter: "10 generations/sec",
        pro: "10 generations/sec",
        details: {
            title: "Simultaneous creation",
            description: "We host zero artificial queues. The moment you click generate, your request is fired directly to the model.",
            cardTitle: "10 generations / sec",
            cardDescription: "That's 600 concurrent requests per minute. Generate your entire batch in seconds—our infrastructure scales instantly to match your creative throughput.",
            footer: "Zero throttle. No gatekeeping.",
        },
    },
    { feature: "Batch queue size", starter: "1,000", pro: "1,000" },
    { feature: "AI Models", starter: "8", pro: "8" },
    { feature: "Prompt library", starter: true, pro: true },
    { feature: "Prompt enhancement", starter: true, pro: true },
    { feature: "Private gallery", starter: false, pro: true },
    { feature: "NSFW Generations (on supported models)", starter: false, pro: true },
] as const
