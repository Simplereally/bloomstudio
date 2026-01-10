"use client"

import type { SolutionFAQ as SolutionFAQItem } from "@/lib/seo-config"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface SolutionFAQProps {
    faqs: SolutionFAQItem[]
}

export function SolutionFAQ({ faqs }: SolutionFAQProps) {
    return (
        <section className="py-24 bg-black/20 border-y border-white/5">
            <div className="container mx-auto px-6 max-w-3xl">
                <ScrollReveal>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground">
                            Everything you need to know about our generator.
                        </p>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={200}>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border border-white/5 bg-white/5 rounded-2xl px-6">
                                <AccordionTrigger className="text-lg font-medium hover:no-underline hover:text-primary py-6">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollReveal>
            </div>
        </section>
    )
}
