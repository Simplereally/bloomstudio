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
        <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />
            
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <ScrollReveal>
                        <div className="text-left">                            
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
                                {heroPrefix || "Create"} <span className="text-primary">{heroSuffix || shortTitle}</span> <br/>
                                <span className="text-muted-foreground font-light">with AI speed.</span>
                            </h1>

                            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance max-w-xl leading-relaxed">
                                {description}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
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

                    <ScrollReveal delay={200} className="relative w-full">
                        {/* Abstract Visual Representation */}
                        <SolutionHeroCarousel images={images} />
                    </ScrollReveal>
                </div>
            </div>
        </section>
    )
}
