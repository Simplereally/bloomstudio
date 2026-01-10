"use client"

import { SolutionStep } from "@/lib/seo-config"
import { ScrollReveal } from "@/components/landing/scroll-reveal"

interface SolutionStepsProps {
    steps: SolutionStep[]
    shortTitle: string
}

export function SolutionSteps({ steps, shortTitle }: SolutionStepsProps) {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <ScrollReveal>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How to create {shortTitle}</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Three simple steps to professional results.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0" />

                    {steps.map((step, index) => (
                        <ScrollReveal key={index} delay={index * 150}>
                            <div className="relative text-center group">
                                <div className="w-24 h-24 mx-auto rounded-full bg-background border-4 border-white/5 group-hover:border-primary/30 transition-colors flex items-center justify-center mb-6 relative z-10 shadow-xl">
                                    <span className="text-4xl font-bold text-white/10 group-hover:text-primary transition-colors">
                                        {index + 1}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                    {step.description}
                                </p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
