"use client"

import { cn } from "@/lib/utils"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Video, Image as ImageIcon } from "lucide-react"

/**
 * Model Value Showcase — Premium Editorial Redesign
 *
 * A stunning visual representation of the monthly usage across all models.
 * Shows that usage is SHARED, but demonstrates "if you ONLY used this model"
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
    type: "image" | "video"
    nsfw?: boolean
}

const MODEL_VALUE_DATA: ModelValueData[] = [
    {
        id: "flux",
        displayName: "Flux Schnell",
        logo: "/image-models/flux.svg",
        monthlyQuota: 150_000,
        type: "image",
    },
    {
        id: "zimage",
        displayName: "Z-Image Turbo",
        logo: "/image-models/alibaba.svg",
        monthlyQuota: 150_000,
        nsfw: true,
        type: "image",
    },
    {
        id: "turbo",
        displayName: "SDXL Turbo",
        logo: "/image-models/stability.svg",
        monthlyQuota: 99_000,
        type: "image",
    },
    {
        id: "gptimage",
        displayName: "GPT Image 1.0",
        logo: "/image-models/openai.svg",
        monthlyQuota: 2_100,
        type: "image",
    },
    {
        id: "nanobanana",
        displayName: "Nano Banana",
        logo: "/image-models/google.svg",
        monthlyQuota: 750,
        type: "image",
    },
    {
        id: "seedream",
        displayName: "Seedream 4.0",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 1_050,
        type: "image",
    },
    {
        id: "seedream-pro",
        displayName: "Seedream 4.5 Pro",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 750,
        type: "image",
    },
    {
        id: "seedance-pro",
        displayName: "Seedance Pro",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 300,
        type: "video",
    },
    {
        id: "seedance",
        displayName: "Seedance",
        logo: "/image-models/bytedance.svg",
        monthlyQuota: 180,
        type: "video",
    },
    {
        id: "veo",
        displayName: "Veo 3.1",
        logo: "/image-models/google.svg",
        monthlyQuota: 30,
        type: "video",
    },
    {
        id: "kontext",
        displayName: "Flux Kontext",
        logo: "/image-models/flux.svg",
        monthlyQuota: 750,
        type: "image",
    },
    {
        id: "gptimage-large",
        displayName: "GPT Image 1.5",
        logo: "/image-models/openai.svg",
        monthlyQuota: 600,
        type: "image",
    },
    {
        id: "nanobanana-pro",
        displayName: "Nano Banana Pro",
        logo: "/image-models/google.svg",
        monthlyQuota: 180,
        type: "image",
    },
]

// Sort alphabetically by displayName initially
const ORDERED_MODEL_DATA = [...MODEL_VALUE_DATA].sort((a, b) => a.displayName.localeCompare(b.displayName))

// Separate into tiers for visual hierarchy
const FAST_MODELS = ORDERED_MODEL_DATA.filter((m) => m.monthlyQuota >= 99_000)
const STANDARD_MODELS = ORDERED_MODEL_DATA.filter((m) => m.monthlyQuota >= 500 && m.monthlyQuota < 99_000)
const PREMIUM_MODELS = ORDERED_MODEL_DATA.filter((m) => m.monthlyQuota < 500)

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
    const [displayValue, setDisplayValue] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    useEffect(() => {
        if (!isInView) return

        let rafId: number
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
                    rafId = requestAnimationFrame(animate)
                } else {
                    setDisplayValue(value)
                }
            }
            animate()
        }, delay)

        return () => {
            clearTimeout(timeout)
            if (rafId) cancelAnimationFrame(rafId)
        }
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
            {model.nsfw && (
                <div className="absolute top-0 -mt-1.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center px-3 py-1 rounded-b-md text-[9px] font-bold uppercase tracking-widest bg-pink-900/75 text-white leading-none whitespace-nowrap">
                        nsfw supported
                    </span>
                </div>
            )}
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
                        <div className="flex items-center gap-1 text-muted-foreground">
                            {model.type === "video" ? (
                                <Video className="w-5 h-5" />
                            ) : (
                                <ImageIcon className="w-5 h-5" />
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono mt-0.5">
                        ~{Math.floor(model.monthlyQuota / 30).toLocaleString()}/day
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
                    className="max-w-3xl mx-auto text-center mb-8 md:mb-12"
                >
                    <p className="text-[11px] uppercase tracking-[0.3em] text-primary font-semibold mb-4">
                        Monthly Capacity
                    </p>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-brand font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
                        Usage breakdown
                    </h2>

                    <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        Your usage is shared across every model.
                        <br />
                        Here&apos;s what you could generate if you focused on just one.
                    </p>
                </motion.div>

                {/* Model Tiers — Stacked on mobile, Columns on desktop */}
                <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:gap-0 gap-8 items-stretch justify-center">
                    {/* Fast Tier — Most prominent */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 w-full max-w-2xl lg:max-w-none mx-auto"
                    >
                        <TierSection
                            title="High Volume"
                            subtitle="Highest generation capacity"
                            models={FAST_MODELS}
                            accent="ember"
                            startIndex={0}
                        />
                    </motion.div>

                    {/* Divider 1 - Desktop */}
                    <div className="hidden lg:block px-8 h-full">
                        <div className="w-px h-full bg-border/30 mx-auto" />
                    </div>

                    {/* Divider 1 - Mobile */}
                    <div className="lg:hidden flex items-center justify-center px-8">
                        <div className="w-full h-px bg-border/30" />
                    </div>

                    {/* Standard Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="flex-1 w-full max-w-2xl lg:max-w-none mx-auto"
                    >
                        <TierSection
                            title="Balanced"
                            subtitle="High quality, good volume"
                            models={STANDARD_MODELS}
                            accent="ember"
                            startIndex={FAST_MODELS.length}
                        />
                    </motion.div>

                    {/* Divider 2 - Desktop */}
                    <div className="hidden lg:block px-8 h-full">
                        <div className="w-px h-full bg-border/30 mx-auto" />
                    </div>

                    {/* Divider 2 - Mobile */}
                    <div className="lg:hidden flex items-center justify-center px-8">
                        <div className="w-full h-px bg-border/30" />
                    </div>

                    {/* Premium Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex-1 w-full max-w-2xl lg:max-w-none mx-auto"
                    >
                        <TierSection
                            title="Premium"
                            subtitle="Maximum quality"
                            models={PREMIUM_MODELS}
                            accent="ember"
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
                        Mix and match to fit your workflow.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
                        <Link
                            href="#comparison-table"
                            className="hover:text-foreground transition-colors underline underline-offset-4 decoration-border hover:decoration-foreground"
                        >
                            Compare features
                        </Link>
                        <span className="text-border">·</span>
                        <Link
                            href="/#models"
                            className="hover:text-foreground transition-colors underline underline-offset-4 decoration-border hover:decoration-foreground"
                        >
                            Explore all models
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
