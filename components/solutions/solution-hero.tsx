"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import Image from "next/image"
import { useRef } from "react"

interface SolutionHeroProps {
    title: string
    shortTitle: string
    description: string
    heroPrefix?: string
    heroSuffix?: string
}

const CAROUSEL_IMAGES = [
    "/showcase/landscape-scene.png",
    "/showcase/abstract-art.png",
    "/showcase/landscape-scene.png",
    "/showcase/abstract-art.png",
]

export function SolutionHero({ title, shortTitle, description, heroPrefix, heroSuffix }: SolutionHeroProps) {
    const plugin = useRef(
        Autoplay({ delay: 3000, stopOnInteraction: false })
    )

    return (
        <section className="relative pt-32 pb-16 md:pt-48 md:pb-32 overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />
            
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <ScrollReveal>
                        <div className="text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                                <Sparkles className="w-3 h-3" />
                                <span>AI Powered {shortTitle}</span>
                            </div>
                            
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
                        <div className="relative w-full aspect-[9/16] max-w-sm mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-3xl blur-3xl animate-pulse" />
                            <div className="relative w-full h-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm ring-1 ring-white/20">
                                <Carousel
                                    plugins={[plugin.current]}
                                    className="w-full h-full"
                                    onMouseEnter={plugin.current.stop}
                                    onMouseLeave={plugin.current.reset}
                                >
                                    <CarouselContent className="h-full ml-0">
                                        {CAROUSEL_IMAGES.map((src, index) => (
                                            <CarouselItem key={index} className="h-full pl-0">
                                                <div className="relative w-full h-full bg-black/40 border border-white/5">
                                                    {/* In a real app this would be a real image */}
                                                    <div className="absolute inset-0">
                                                        <Image 
                                                            src={src} 
                                                            alt={`Preview ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>

                                {/* Floating Elements decoration */}
                                <div className="absolute top-8 right-8 w-24 h-24 bg-primary/20 rounded-full blur-xl animate-float pointer-events-none z-20" />
                                <div className="absolute bottom-12 left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-float delay-1000 pointer-events-none z-20" />
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    )
}
