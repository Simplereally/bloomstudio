"use client"

import { useEffect, useRef, useState } from "react"
import { SolutionStep } from "@/lib/seo-config"
import { ScrollReveal } from "@/components/landing/scroll-reveal"

interface SolutionStepsProps {
    steps: SolutionStep[]
    shortTitle: string
}

export function SolutionSteps({ steps, shortTitle }: SolutionStepsProps) {
    const [visibleStepIndex, setVisibleStepIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const timers: Array<ReturnType<typeof setTimeout>> = []
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Start sequence when container is in view
                    steps.forEach((_, index) => {
                        const timer = setTimeout(() => {
                            setVisibleStepIndex(current => Math.max(current, index))
                        }, index * 1000)
                        timers.push(timer)
                    })
                    
                    // Only trigger once
                    observer.disconnect()
                }
            },
            { threshold: 0.2 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            observer.disconnect()
            timers.forEach(clearTimeout)
        }
    }, [steps])

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

                <div ref={containerRef} className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0" />

                    {steps.map((step, index) => (
                        <ScrollReveal key={index} delay={index * 150}>
                            <div className="relative text-center group">
                                <div className={`w-24 h-24 mx-auto rounded-full bg-background border-4 transition-all duration-700 flex items-center justify-center mb-6 relative z-10 shadow-xl ${
                                    index <= visibleStepIndex ? "border-primary/30" : "border-white/5"
                                }`}>
                                    <span className={`text-4xl font-bold transition-colors duration-700 ${
                                        index <= visibleStepIndex ? "text-primary" : "text-white/10"
                                    }`}>
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
