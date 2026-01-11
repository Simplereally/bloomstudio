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
        <section id="hero" className="relative pt-8 pb-20 sm:pt-12 sm:pb-28 lg:pb-32 xl:pb-32 xl:min-h-[75vh] 2xl:pb-32 2xl:min-h-[80vh] 3xl:pb-28 3xl:min-h-[80vh] 4xl:h-[calc(100vh-4rem)] 4xl:min-h-0 4xl:pb-12 5xl:h-[calc(100vh-4rem)] 5xl:min-h-0 5xl:pb-16 overflow-hidden flex flex-col justify-center">
            <div className="container mx-auto px-6 text-center">
                {/* Badge */}
                <ScrollReveal instant>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect-home mb-4 3xl:mb-8 4xl:mb-10 3xl:px-6 3xl:py-3 cursor-default">
                        <Sparkles className="h-4 w-4 3xl:h-5 3xl:w-5 text-primary" />
                        <span className="text-sm 3xl:text-base 4xl:text-lg text-foreground/90">
                            <span className="text-primary font-semibold">New:</span> Video generation with Veo 3.1 &amp; Seedance
                        </span>
                    </div>
                </ScrollReveal>

                {/* Main headline */}
                <ScrollReveal instant delay={100}>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl 3xl:text-9xl 4xl:text-[10rem] font-bold text-foreground mb-3 3xl:mb-6 4xl:mb-8 tracking-tight">
                        {title || (
                            <>
                                Create <span className="text-primary">stunning</span> visuals
                                <br />
                                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl 3xl:text-7xl 4xl:text-8xl text-muted-foreground font-normal">
                                    without the stunning price
                                </span>
                            </>
                        )}
                    </h1>
                </ScrollReveal>

                <ScrollReveal instant delay={200}>
                    <div className="mt-2 max-w-2xl 3xl:max-w-4xl 4xl:max-w-5xl mx-auto text-lg sm:text-xl 3xl:text-2xl 4xl:text-3xl text-foreground/80 leading-relaxed">
                        {description || (
                            <p>
                                Professional AI image and video generation with
                                <span className="text-primary font-semibold"> {allModels.length}+ cutting-edge models</span>. Generate{" "}
                                <span className="text-primary font-semibold">900 images/month</span> for just $5.
                            </p>
                        )}
                    </div>
                </ScrollReveal>

                {/* Premium Model Showcase - Compact & Elegant */}
                <ScrollReveal delay={300}>
                    <div className="mt-8 3xl:mt-12 max-w-xl 3xl:max-w-3xl 4xl:max-w-4xl mx-auto relative">
                        {/* Minimal Background Glow - Neutral/Cool */}
                        <div className="absolute inset-0 bg-primary/10 blur-[40px] rounded-full pointer-events-none animate-pulse-glow" />

                        <div className="relative group px-4 pt-8 pb-5 3xl:pt-10 3xl:pb-8 3xl:px-8 rounded-2xl bg-[#0A0A0A]/80 border border-white/10 shadow-2xl backdrop-blur-sm">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                <div className="relative group/badge">
                                    <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full group-hover/badge:bg-primary/30 transition-colors" />
                                    <span className="relative flex items-center gap-2 bg-[#0D0D0D] px-3 py-1 3xl:px-5 3xl:py-2 text-xs 3xl:text-sm 4xl:text-base font-bold uppercase tracking-[0.2em] text-foreground/90 border border-white/20 rounded-full shadow-lg whitespace-nowrap overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/badge:animate-shimmer" />
                                        <Sparkles className="h-3 w-3 3xl:h-4 3xl:w-4 text-primary/80" />
                                        Premium Models
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
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

                        <p className="mt-4 text-[11px] 3xl:text-sm text-muted-foreground font-medium text-center tracking-[0.15em] uppercase">
                            + {allModels.length - featuredModels.length} specialized models available in studio
                        </p>
                    </div>
                </ScrollReveal>

                {/* CTA Buttons - Bold & Symmetrical */}
                <ScrollReveal delay={400}>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-10 3xl:mt-12 4xl:mt-14 px-4">
                        <Link href="/studio" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                variant="default"
                                className="group w-full sm:w-72 3xl:w-80 4xl:w-88 h-16 3xl:h-16 4xl:h-18 5xl:h-20 text-lg 3xl:text-xl 4xl:text-2xl font-bold rounded-2xl transition-all shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] bg-primary text-primary-foreground"
                            >
                                Try free now
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/pricing" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-72 3xl:w-80 4xl:w-88 h-16 3xl:h-16 4xl:h-18 5xl:h-20 text-lg 3xl:text-xl 4xl:text-2xl font-bold rounded-2xl glass-effect-home text-foreground hover:bg-white/10 border-white/20 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                            >
                                See Pricing
                                <ArrowRight className="ml-2 h-5 w-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </ScrollReveal>

                {/* Trust indicators */}
                <ScrollReveal delay={500}>
                    <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
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

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
            </div>
        </section>
    )
}
