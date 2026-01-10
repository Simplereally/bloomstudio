"use client"

import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { Badge } from "@/components/ui/badge"
import { Slideshow, SlideshowSlide } from "@/components/ui/slideshow"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface SolutionShowcaseProps {
    items?: {
        label: string
        aspectRatio: string
        className?: string
        src?: string
    }[]
}

export function SolutionShowcase({ items }: SolutionShowcaseProps) {
    const displayItems = items?.slice(0, 4) || []

    // Transform items into slideshow slides
    const slides: SlideshowSlide[] = displayItems.map((item, index) => ({
        key: index,
        label: item.label,
        thumbnailSrc: item.src && item.src !== '/placeholder.jpg' ? item.src : undefined,
        content: (
            <>
                {item.src && item.src !== '/placeholder.jpg' ? (
                    <img 
                        src={item.src} 
                        alt={item.label}
                        className="h-full w-full object-cover" 
                    />
                ) : (
                    <div className="h-full w-full">
                        {/* Beautiful gradient placeholder */}
                        <div 
                            className={cn(
                                "absolute inset-0 transition-all duration-500",
                                index === 0 && "bg-gradient-to-br from-violet-600/30 via-purple-500/20 to-fuchsia-500/30",
                                index === 1 && "bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-teal-500/30",
                                index === 2 && "bg-gradient-to-br from-amber-500/30 via-orange-500/20 to-rose-500/30",
                                index === 3 && "bg-gradient-to-br from-emerald-500/30 via-green-500/20 to-lime-500/30"
                            )}
                        />
                        {/* Abstract shape overlay */}
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-3xl" />
                            <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-2xl" />
                        </div>
                        {/* Noise texture */}
                        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC40Ii8+PC9zdmc+')]" />
                    </div>
                )}
            </>
        ),
    }))


    return (
        <section className="py-16 md:py-24 relative overflow-hidden">
            {/* Background glow effect */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[150px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <ScrollReveal>
                    <div className="text-center mb-12">
                        <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                            <Play className="h-3 w-3 mr-2" />
                            Live Showcase
                        </Badge>
                        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                            See what you can create
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            From photorealistic renders to artistic illustrations, bring any vision to life.
                        </p>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={100}>
                    <Slideshow
                        slides={slides}
                        className="max-w-5xl mx-auto"
                        aspectRatio="16/10"
                        showInfo={true}
                        showThumbnails={true}
                        showProgress={true}

                        options={{
                            autoAdvanceDelay: 4000,
                            visibilityThreshold: 0.7,
                        }}
                    />
                </ScrollReveal>
            </div>
        </section>
    )
}
