"use client"

import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { JsonLd } from "@/components/seo/json-ld"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { FAQPage, WithContext } from "schema-dts"
import type { ModelFAQItem, ModelSEOConfig } from "@/lib/models/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModelFAQProps {
  /** FAQ entries to render */
  faqs: readonly ModelFAQItem[]
  /** Model config for contextual headings and structured data */
  model: ModelSEOConfig
}

// ---------------------------------------------------------------------------
// Structured Data
// ---------------------------------------------------------------------------

function buildFAQPageSchema(
  faqs: readonly ModelFAQItem[],
  model: ModelSEOConfig
): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: `${model.displayName} — Frequently Asked Questions`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ModelFAQ — FAQ accordion with schema.org FAQPage JSON-LD.
 *
 * Renders collapsible FAQ items matching the existing solution-faq pattern.
 * Injects FAQPage structured data for rich results in Google Search.
 *
 * Client Component — accordion requires interactive state.
 */
export function ModelFAQ({ faqs, model }: ModelFAQProps) {
  if (faqs.length === 0) return null

  const schema = buildFAQPageSchema(faqs, model)

  return (
    <section className="py-24 bg-black/20 border-y border-white/5">
      {/* FAQPage JSON-LD for SEO */}
      <JsonLd data={schema} />

      <div className="container mx-auto px-6 max-w-3xl">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about {model.displayName}.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border border-white/5 bg-white/5 rounded-2xl px-6"
              >
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
