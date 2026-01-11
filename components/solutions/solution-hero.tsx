import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { SolutionHeroCarousel } from "@/components/solutions/solution-hero-carousel"

interface SolutionHeroProps {
    title: string
    shortTitle: string
    description: string
    heroPrefix?: string
    heroSuffix?: string
    images?: string[]
}

export function SolutionHero({ title, shortTitle, description, heroPrefix, heroSuffix, images = [] }: SolutionHeroProps) {
    return (
        <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 3xl:pt-20 3xl:pb-28 4xl:pt-32 4xl:pb-40 5xl:pt-40 5xl:pb-56 overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />
            
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-10 3xl:gap-16 4xl:gap-24 items-center">
                    <ScrollReveal>
                        <div className="text-center lg:text-left">                            
                            <h1 className="text-4xl md:text-5xl lg:text-7xl 3xl:text-8xl 4xl:text-9xl font-bold tracking-tight mb-6 4xl:mb-10">
                                {heroPrefix || "Create"} <span className="text-primary">{heroSuffix || shortTitle}</span> <br/>
                                <span className="text-muted-foreground font-light">with AI speed.</span>
                            </h1>

                            <p className="text-lg md:text-xl 3xl:text-2xl 4xl:text-3xl text-muted-foreground mb-8 4xl:mb-12 text-balance max-w-xl 3xl:max-w-2xl 4xl:max-w-3xl leading-relaxed mx-auto lg:mx-0">
                                {description}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/studio">
                                    <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto group">
                                        Start Creating
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="/pricing">
                                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto bg-white/5 border-white/10 hover:bg-white/10">
                                        View Pricing
                                    </Button>
                                </Link>
                            </div>

                            <p className="mt-6 text-sm text-muted-foreground">
                                No credit card required • 24-hour free trial
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={200} className="relative w-full flex justify-center lg:justify-end">
                        {/* Hero Carousel - sizing controlled here based on layout context */}
                        <SolutionHeroCarousel 
                            images={images} 
                            className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[400px] xl:max-w-[420px] 2xl:max-w-[480px] 3xl:max-w-[560px] 4xl:max-w-[720px] 5xl:max-w-[900px] max-h-[calc(100vh-12rem)] mx-auto lg:mx-0"
                        />
                    </ScrollReveal>
                </div>
            </div>
        </section>
    )
}
