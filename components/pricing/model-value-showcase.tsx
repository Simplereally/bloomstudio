"use client"

import { cn } from "@/lib/utils"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

/**
 * Model Value Showcase — Premium Editorial Redesign
 *
 * A stunning visual representation of the monthly usage across all models.
 * Shows that credits are SHARED, but demonstrates "if you ONLY used this model"
 * quotas to illustrate incredible value.
 *
 * Design direction: Editorial elegance meets data visualization.
 * Sophisticated typography, muted palette with ember accents, asymmetric layout.
 */

interface ModelValueData {
    id: string
    displayName: string
    logo: string
    monthlyQuota: number
    costPerImage: string
    nsfw?: boolean
}

const MODEL_VALUE_DATA: ModelValueData[] = [
    {
        id: "flux",
        displayName: "Flux Schnell",
        logo: "/image-models/flux.svg",
        monthlyQuota: 150_000,
        costPerImage: "~$0.00002",
    },
    {
        id: "zimage",
        displayName: "Z-Image Turbo",
        logo: "/image-models/alibaba.svg",
        monthlyQuota: 150_000,
        costPerImage: "~$0.00002",
        nsfw: true,
    },
    {
        id: "gptimage",
        displayName: "GPT Image 1.0",
        logo: "/image-models/openai.svg",
        monthlyQuota: 2_100,
        costPerImage: "~$0.0014",
    },
    {
        id: "nanobanana-pro",
        displayName: "NanoBanana Pro",
        logo: "/image-models/google.svg",
        monthlyQuota: 180,
        costPerImage: "~$0.017",
    },
    {
        id: "seedream",
        displayName: "Seedream 4.0",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 1_050,
        costPerImage: "~$0.0029",
    },
    {
        id: "seedream-pro",
        displayName: "Seedream 4.5 Pro",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 750,
        costPerImage: "~$0.004",
    },
    {
        id: "gptimage-large",
        displayName: "GPT Image 1.5",
        logo: "/image-models/openai.svg",
        monthlyQuota: 600,
        costPerImage: "~$0.005",
    },
]

// Separate into tiers for visual hierarchy
const FAST_MODELS = MODEL_VALUE_DATA.filter((m) => m.monthlyQuota >= 100_000)
const STANDARD_MODELS = MODEL_VALUE_DATA.filter((m) => m.monthlyQuota >= 500 && m.monthlyQuota < 100_000)
const PREMIUM_MODELS = MODEL_VALUE_DATA.filter((m) => m.monthlyQuota < 500)

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
    const [displayValue, setDisplayValue] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    useEffect(() => {
        if (!isInView) return

        const timeout = setTimeout(() => {
            const duration = 1200
            const startTime = Date.now()

            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3)
                setDisplayValue(Math.floor(eased * value))

                if (progress < 1) {
                    requestAnimationFrame(animate)
                } else {
                    setDisplayValue(value)
                }
            }
            animate()
        }, delay)

        return () => clearTimeout(timeout)
    }, [isInView, value, delay])

    return (
        <span ref={ref} className="font-mono tabular-nums">
            {displayValue.toLocaleString()}
        </span>
    )
}

function ModelRow({ model, index }: { model: ModelValueData; index: number }) {
    const isMonochrome = model.logo.includes("openai.svg") || model.logo.includes("flux.svg")

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.5,
                delay: index * 0.06,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="group relative"
        >
            <div
                className={cn(
                    "relative flex items-center gap-4 md:gap-6 py-4 md:py-5 px-4 md:px-6",
                    "rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm",
                    "transition-all duration-300 ease-out",
                    "hover:bg-card/60 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                )}
            >
                {/* Logo */}
                <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                    <Image
                        src={model.logo}
                        alt=""
                        fill
                        className={cn(
                            "object-contain opacity-70 group-hover:opacity-100 transition-opacity",
                            isMonochrome && "dark:invert"
                        )}
                    />
                </div>

                {/* Model Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm md:text-base font-semibold text-foreground truncate">
                            {model.displayName}
                        </h4>
                        {model.nsfw && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                NSFW Supported
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        ~{Math.floor(model.monthlyQuota / 30).toLocaleString()} / day
                    </p>
                </div>

                {/* The Number - Right aligned, dramatic */}
                <div className="text-right flex-shrink-0">
                    <div className="text-2xl md:text-3xl lg:text-4xl font-brand font-bold text-foreground tracking-tight">
                        <AnimatedNumber value={model.monthlyQuota} delay={index * 80} />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mt-1">
                        per month
                    </p>
                </div>
            </div>
        </motion.div>
    )
}

function TierSection({
    title,
    subtitle,
    models,
    accent,
    startIndex = 0,
}: {
    title: string
    subtitle: string
    models: ModelValueData[]
    accent: "ember" | "neutral" | "muted"
    startIndex?: number
}) {
    return (
        <div className="space-y-4">
            {/* Tier Header */}
            <div className="flex items-baseline gap-3 px-2">
                <h3
                    className={cn(
                        "text-xs font-bold uppercase tracking-[0.25em]",
                        accent === "ember" && "text-primary",
                        accent === "neutral" && "text-foreground/80",
                        accent === "muted" && "text-muted-foreground"
                    )}
                >
                    {title}
                </h3>
                <span className="text-xs text-muted-foreground font-medium">{subtitle}</span>
            </div>

            {/* Model Cards */}
            <div className="space-y-2">
                {models.map((model, i) => (
                    <ModelRow key={model.id} model={model} index={startIndex + i} />
                ))}
            </div>
        </div>
    )
}

export function ModelValueShowcase() {
    return (
        <section className="relative py-20 md:py-28 overflow-hidden">
            {/* Atmospheric Background */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
                {/* Noise texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Header — Editorial style */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="max-w-3xl mx-auto text-center mb-16 md:mb-20"
                >
                    <p className="text-[11px] uppercase tracking-[0.3em] text-primary font-semibold mb-4">
                        Monthly Capacity
                    </p>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-brand font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
                        Usage breakdown
                    </h2>

                    <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        Your credits work across every model.
                        <br />
                        Here's what you could generate if you focused on just one.
                    </p>
                </motion.div>

                {/* Model Tiers — Stacked editorial layout */}
                <div className="max-w-2xl mx-auto space-y-10 md:space-y-12">
                    {/* Fast Tier — Most prominent */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <TierSection
                            title="High Volume"
                            subtitle="150,000 images each"
                            models={FAST_MODELS}
                            accent="ember"
                            startIndex={0}
                        />
                    </motion.div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 px-2">
                        <div className="flex-1 h-px bg-border/30" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                            or
                        </span>
                        <div className="flex-1 h-px bg-border/30" />
                    </div>

                    {/* Standard Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <TierSection
                            title="Balanced"
                            subtitle="High quality, good volume"
                            models={STANDARD_MODELS}
                            accent="neutral"
                            startIndex={FAST_MODELS.length}
                        />
                    </motion.div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 px-2">
                        <div className="flex-1 h-px bg-border/30" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                            or
                        </span>
                        <div className="flex-1 h-px bg-border/30" />
                    </div>

                    {/* Premium Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <TierSection
                            title="Frontier"
                            subtitle="Maximum quality"
                            models={PREMIUM_MODELS}
                            accent="muted"
                            startIndex={FAST_MODELS.length + STANDARD_MODELS.length}
                        />
                    </motion.div>
                </div>

                {/* Footer note — understated */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-16 md:mt-20 text-center"
                >
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Credits are shared across all models. Mix and match to fit your workflow.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
                        <a
                            href="#comparison-table"
                            className="hover:text-foreground transition-colors underline underline-offset-4 decoration-border hover:decoration-foreground"
                        >
                            Compare features
                        </a>
                        <span className="text-border">·</span>
                        <a
                            href="/#models"
                            className="hover:text-foreground transition-colors underline underline-offset-4 decoration-border hover:decoration-foreground"
                        >
                            Explore all models
                        </a>
                    </div>
                </motion.div>
            </div>
        </section >
    )
}
