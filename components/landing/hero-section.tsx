import { Button } from "@/components/ui/button"
import { getModel, type ModelDefinition } from "@/lib/config/models"
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react"
import Link from "next/link"
import { ModelBadge } from "./model-badge"
import { NoGuardrails } from "./no-guardrails"
import { ScrollReveal } from "./scroll-reveal"

/**
 * HeroSection — Server Component with client-side animation wrappers.
 *
 * All static text (headings, CTAs) is present in server-rendered HTML for SEO.
 * ScrollReveal client components hydrate animations without blocking paint.
 */

interface HeroSectionProps {
    title?: React.ReactNode
    description?: React.ReactNode
}

export function HeroSection({ title, description }: HeroSectionProps = {}) {
    const featuredModelIds = ["imagen-4", "grok-imagine", "flux", "flux-2-dev", "klein", "klein-large", "zimage", "gptimage", "grok-video"] as const
    const featuredModels = featuredModelIds
        .map((id) => getModel(id))
        .filter((m): m is ModelDefinition => m !== undefined)

    const imageModels = featuredModels.filter((m) => m.type === "image")
    const videoModels = featuredModels.filter((m) => m.type === "video")

    return (
        <section id="hero" aria-label="Hero — The cheapest AI studio" className="relative h-dvh w-full overflow-hidden flex flex-col items-center">
            {/* Main content — fills viewport minus scroll-indicator zone */}
            <div className="container mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center flex-1 pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-24 md:pb-28 3xl:pb-32">
                {/* Announcement badge */}
                <ScrollReveal instant>
                    <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full glass-effect-home mb-1 sm:mb-1.5 3xl:mb-2.5 cursor-default">
                        <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 3xl:h-4 3xl:w-4 text-pink-600 flex-shrink-0" />
                        <span className="text-[9px] xs:text-[10px] sm:text-xs 3xl:text-sm text-foreground/90 whitespace-nowrap">
                            <span className="text-pink-600 font-semibold">New NSFW models:</span> Grok Imagine &amp; Grok Video
                        </span>
                    </div>
                </ScrollReveal>

                {/* Headline */}
                <ScrollReveal instant delay={100}>
                    <h1 className="font-brand text-[clamp(1.5rem,7.5vw,4.5rem)] lg:text-[5.5rem] xl:text-[6.5rem] 2xl:text-[7.5rem] 3xl:text-[9rem] 4xl:text-[11rem] font-bold text-foreground tracking-tight leading-[1.05] whitespace-nowrap">
                        {title || (
                            <>
                                <span className="block">The <span className="text-primary">cheapest</span> AI studio</span>
                                <div className="text-[clamp(0.875rem,4.5vw,2rem)] lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl 4xl:text-8xl text-muted-foreground font-normal mt-0.5 md:mt-1 whitespace-nowrap leading-tight">
                                    for image and video generation
                                </div>
                            </>
                        )}
                    </h1>
                </ScrollReveal>

                {/* Subheadline */}
                <ScrollReveal instant delay={200}>
                    <div className="mt-1 sm:mt-1.5 3xl:mt-3 max-w-4xl 3xl:max-w-6xl mx-auto text-[clamp(0.875rem,1.5vw,1.25rem)] 3xl:text-2xl text-foreground/80 leading-relaxed whitespace-nowrap">
                        {description || (
                            <p>
                                Access to frontier models
                                <span className="block text-primary/95 font-semibold mt-0.5">
                                    for just{" "}
                                    <span className="pl-1.5 sm:pl-2 font-bold text-xl sm:text-2xl bg-clip-text text-transparent bg-[linear-gradient(110deg,var(--primary),45%,#fff,55%,var(--primary))] bg-[length:200%_100%] animate-text-sheen inline-block">
                                        $3
                                    </span>
                                </span>
                            </p>
                        )}
                    </div>
                </ScrollReveal>

                {/* Model showcase card */}
                <ScrollReveal delay={300}>
                    <div className="mt-3 sm:mt-4 lg:mt-5 xl:mt-6 3xl:mt-8 4xl:mt-10 max-w-xl xl:max-w-2xl 2xl:max-w-3xl 3xl:max-w-4xl 4xl:max-w-5xl mx-auto relative">
                        {/* Ambient glow */}
                        <div className="absolute inset-0 bg-primary/10 blur-[40px] rounded-full pointer-events-none animate-pulse-glow" aria-hidden="true" />

                        <div className="relative px-3 sm:px-4 3xl:px-8 pt-4 pb-3 sm:pt-5 sm:pb-4 lg:pt-6 lg:pb-5 xl:pt-7 xl:pb-5 3xl:pt-9 3xl:pb-7 4xl:pt-11 4xl:pb-9 5xl:pt-14 5xl:pb-12 rounded-2xl bg-[#0A0A0A]/80 border border-white/10 shadow-2xl backdrop-blur-sm">
                            <div className="flex flex-col gap-1.5 sm:gap-2 3xl:gap-3 4xl:gap-4 relative z-10">
                                {/* Image models */}
                                <div className="flex flex-wrap justify-center gap-1.5 3xl:gap-3 4xl:gap-4" role="list" aria-label="Image models">
                                    {imageModels.map((model) => (
                                        <ModelBadge key={model.id} model={model} showNsfw />
                                    ))}
                                </div>

                                {/* Separator */}
                                <div className="h-px w-8 mx-auto bg-white/5" aria-hidden="true" />

                                {/* Video models */}
                                <div className="flex flex-wrap justify-center gap-1.5 3xl:gap-3 4xl:gap-4" role="list" aria-label="Video models">
                                    {videoModels.map((model) => (
                                        <ModelBadge key={model.id} model={model} showNsfw />
                                    ))}
                                </div>
                            </div>

                            {/* No Guardrails indicator */}
                            <div className="flex justify-center mt-2.5 sm:mt-3 3xl:mt-4 4xl:mt-5 relative z-10">
                                <NoGuardrails />
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* CTA buttons */}
                <ScrollReveal delay={400}>
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-6 justify-center items-center mt-4 sm:mt-5 lg:mt-6 xl:mt-7 3xl:mt-10 px-4">
                        <Button
                            asChild
                            size="lg"
                            variant="default"
                            className="group w-full sm:w-72 3xl:w-80 4xl:w-96 h-14 sm:h-16 3xl:h-16 4xl:h-20 5xl:h-24 text-lg 3xl:text-xl 4xl:text-2xl font-bold rounded-2xl transition-all shadow-2xl active:scale-[0.98]"
                        >
                            <Link href="/studio">
                                <span className="relative opacity-90 group-hover:opacity-100 transition-opacity">
                                    Try free now
                                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary-foreground/50 group-hover:w-full transition-all duration-300 ease-out" />
                                </span>
                                <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                            </Link>
                        </Button>
                        <Link href="/pricing" className="w-full sm:w-auto group flex items-center justify-center">
                            <span className="relative inline-flex items-center gap-2 text-lg 3xl:text-xl 4xl:text-2xl font-medium text-foreground/80 hover:text-foreground transition-colors cursor-pointer py-3 sm:py-4">
                                See Pricing
                                <ArrowRight className="h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                                <span className="absolute bottom-2 sm:bottom-3 left-0 w-0 h-px bg-foreground/40 group-hover:w-[calc(100%-1.75rem)] transition-all duration-300 ease-out" />
                            </span>
                        </Link>
                    </div>
                </ScrollReveal>
            </div>

            {/* Scroll indicator — pinned to bottom of viewport */}
            <div className="absolute bottom-6 sm:bottom-8 lg:bottom-10 3xl:bottom-14 4xl:bottom-16 left-1/2 -translate-x-1/2 animate-bounce z-20 pointer-events-none" aria-hidden="true">
                <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 3xl:h-7 3xl:w-7 text-muted-foreground" />
            </div>
        </section>
    )
}
