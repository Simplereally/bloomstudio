"use client"

import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { Badge } from "@/components/ui/badge"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"
// import Image from "next/image"

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

    return (
        <section className="py-24 relative">
             <div className="container mx-auto px-6">
                 <ScrollReveal>
                    <div className="text-center mb-16">
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

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {displayItems.map((item, index) => (
                        <ScrollReveal key={index} delay={100 * (index + 1)}>
                             <div className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0" />
                                 {/* Placeholder pattern if no src or src is placeholder */}
                                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
                                 
                                 {/* Real Image would go here */}
                                 {item.src && item.src !== '/placeholder.jpg' ? (
                                     <img 
                                        src={item.src} 
                                        alt={item.label}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                     />
                                 ) : (
                                     <div className="h-full w-full flex items-center justify-center">
                                         {/* Fallback visual */}
                                         <div className="w-full h-full bg-gradient-to-br from-primary/5 to-purple-500/5 group-hover:from-primary/10 group-hover:to-purple-500/10 transition-colors" />
                                     </div>
                                 )}

                                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end transition-opacity duration-300">
                                     <div className="translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                                        <p className="text-white font-medium text-lg leading-tight mb-1">{item.label}</p>
                                        <div className="h-0.5 w-12 bg-primary/50 group-hover:w-full transition-all duration-300" />
                                     </div>
                                 </div>
                             </div>
                        </ScrollReveal>
                    ))}
                 </div>
             </div>
        </section>
    )
}
