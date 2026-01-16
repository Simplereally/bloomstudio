import { Button } from "@/components/ui/button"
import { MODEL_REGISTRY } from "@/lib/config/models"
import { ArrowRight, ChevronDown, Clock, Infinity, Shield, Sparkles } from "lucide-react"
import Link from "next/link"
import { ModelBadge } from "./model-badge"
import { ScrollReveal } from "./scroll-reveal"

/**
 * HeroSection - Mixed Server/Client Component
 *
 * The content is static and could be server-rendered, but we use ScrollReveal
 * for animations which requires client-side JavaScript. Since ScrollReveal is
 * a client component, this component's content will be included in the initial
 * HTML but animations will be hydrated on the client.
 *
 * For optimal SEO, all the static text content (headings, paragraphs, CTAs) is
 * still present in the server-rendered HTML.
 */
export function HeroSection({
    title,
    description,
}: {
    title?: React.ReactNode
    description?: React.ReactNode
} = {}) {
    const featuredModelIds = ["gptimage-large", "seedream-pro", "nanobanana-pro", "seedance-pro", "veo"]
    const featuredModels = featuredModelIds.map((id) => MODEL_REGISTRY[id]).filter(Boolean)

    const imageModels = featuredModels.filter((m) => m.type === "image")
    const videoModels = featuredModels.filter((m) => m.type === "video")

    const allModels = Object.values(MODEL_REGISTRY)

    return (
        <section id="hero" className="relative h-[100dvh] w-full overflow-hidden flex flex-col justify-center items-center pt-24 pb-12 sm:pt-28 md:pt-32">
            <div className="container mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center h-full max-h-[90vh]">
                {/* Badge */}
                <ScrollReveal instant>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full glass-effect-home mb-2 cursor-default">
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 3xl:h-5 3xl:w-5 text-primary flex-shrink-0" />
                        <span className="text-[10px] xs:text-xs sm:text-sm 3xl:text-base text-foreground/90 whitespace-nowrap">
                            <span className="text-primary font-semibold">New:</span> <span className="hidden xs:inline">Video generation with </span><span className="xs:hidden">Video: </span>Veo 3.1 &amp; Seedance
                        </span>
                    </div>
                </ScrollReveal>

                {/* Main headline */}
                <ScrollReveal instant delay={100}>
                    <h1 className="font-brand text-[clamp(1.75rem,8.2vw,5.5rem)] lg:text-[6rem] xl:text-[7.5rem] 2xl:text-[6.5rem] 3xl:text-[9.5rem] 4xl:text-[12rem] font-bold text-foreground sm:mb-2 lg:mb-2 tracking-tight leading-[1.1] whitespace-nowrap">
                        {title || (
                            <>
                                <span className="block">The <span className="text-primary">cheapest</span> AI studio</span>
                                <div className="text-[clamp(1rem,5.4vw,2.5rem)] lg:text-5xl xl:text-6xl 2xl:text-5xl 3xl:text-[5rem] 4xl:text-[6rem] text-muted-foreground font-normal md:mt-2 whitespace-nowrap leading-tight">
                                    for image and video generation
                                </div>
                            </>
                        )}
                    </h1>
                </ScrollReveal>

                <ScrollReveal instant delay={200}>
                    <div className="mt-2 max-w-4xl 3xl:max-w-6xl mx-auto text-[clamp(1rem,1.8vw,1.5rem)] 3xl:text-2xl text-foreground/80 leading-relaxed whitespace-nowrap">
                        {description || (
                            <p>
                                Access to frontier models
                                <span className="block text-primary/95 font-semibold mt-1">for just <span className="pl-1.5 sm:pl-2 font-bold text-2xl sm:text-3xl bg-clip-text text-transparent bg-[linear-gradient(110deg,var(--primary),45%,#fff,55%,var(--primary))] bg-[length:200%_100%] animate-text-sheen inline-block">$3</span></span>
                            </p>
                        )}
                    </div>
                </ScrollReveal>

                {/* Premium Model Showcase - Compact & Elegant */}
                <ScrollReveal delay={300}>
                    <div className="mt-4 3xl:mt-16 max-w-xl xl:max-w-2xl 2xl:max-w-3xl 3xl:max-w-4xl 4xl:max-w-5xl mx-auto relative">
                        {/* Minimal Background Glow - Neutral/Cool */}
                        <div className="absolute inset-0 bg-primary/10 blur-[40px] rounded-full pointer-events-none animate-pulse-glow" />

                        <div className="relative px-4 pt-8 pb-6 xl:pt-10 xl:pb-8 2xl:pt-12 2xl:pb-8 3xl:pt-16 3xl:pb-12 3xl:px-10 4xl:pt-20 5xl:pt-24 rounded-2xl bg-[#0A0A0A]/80 border border-white/10 shadow-2xl backdrop-blur-sm">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                <div className="relative group/badge">
                                    <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full group-hover/badge:bg-primary/30 transition-colors" />
                                    <span className="relative flex items-center gap-2 bg-[#0D0D0D] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-foreground/90 border border-white/20 rounded-full shadow-lg whitespace-nowrap overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/badge:animate-shimmer" />
                                        The Best Models
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 xl:gap-2 2xl:gap-2 3xl:gap-4 relative z-10">
                                {/* Images Row */}
                                <div className="flex flex-wrap justify-center gap-1.5 3xl:gap-3 4xl:gap-4">
                                    {imageModels.map((model) => (
                                        <ModelBadge key={model.id} model={model} />
                                    ))}
                                </div>

                                {/* Separator Line - Ultra Subtle */}
                                <div className="h-px w-8 mx-auto bg-white/5" />

                                {/* Video Row */}
                                <div className="flex flex-wrap justify-center gap-1.5 3xl:gap-3 4xl:gap-4">
                                    {videoModels.map((model) => (
                                        <ModelBadge key={model.id} model={model} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="mt-3 xl:mt-2 2xl:mt-2 3xl:mt-4 text-[11px] 3xl:text-sm text-muted-foreground font-medium text-center tracking-[0.15em] uppercase">
                            + {allModels.length - featuredModels.length} specialized models available in studio
                        </p>
                    </div>
                </ScrollReveal>

                {/* CTA Buttons - Bold & Symmetrical */}
                <ScrollReveal delay={400}>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center mt-6 sm:mt-8 xl:mt-8 2xl:mt-10 px-4">
                        <Link href="/studio" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                variant="default"
                                className="group w-full sm:w-72 3xl:w-80 4xl:w-88 h-16 3xl:h-16 4xl:h-18 5xl:h-20 text-lg 3xl:text-xl 4xl:text-2xl font-bold rounded-2xl transition-all shadow-2xl active:scale-[0.98]"
                            >
                                <span className="relative opacity-90 group-hover:opacity-100 transition-opacity">
                                    Try free now
                                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary-foreground/50 group-hover:w-full transition-all duration-300 ease-out" />
                                </span>
                                <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Button>
                        </Link>
                        <Link href="/pricing" className="w-full sm:w-auto group flex items-center justify-center">
                            {/* Elegant text link - confident, not competing */}
                            <span className="relative inline-flex items-center gap-2 text-lg 3xl:text-xl 4xl:text-2xl font-medium text-foreground/80 hover:text-foreground transition-colors cursor-pointer py-4">
                                See Pricing
                                <ArrowRight className="h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                {/* Animated underline */}
                                <span className="absolute bottom-3 left-0 w-0 h-px bg-foreground/40 group-hover:w-[calc(100%-1.75rem)] transition-all duration-300 ease-out" />
                            </span>
                        </Link>
                    </div>
                </ScrollReveal>

                {/* Trust indicators */}
                <ScrollReveal delay={500}>
                    <div className="mt-4 sm:mt-6 xl:mt-4 2xl:mt-4 3xl:mt-8 flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-primary" />
                            <span>24-hour free trial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3 text-primary" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Infinity className="h-3 w-3 text-primary" />
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            {/* Scroll indicator - always visible just above fold */}
            <div className="absolute bottom-6 sm:bottom-8 md:bottom-8 3xl:bottom-12 left-1/2 -translate-x-1/2 animate-bounce z-20 pointer-events-none">
                <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
        </section>
    )
}
