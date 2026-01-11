import { Footer } from "@/components/layout/footer"
import { FaqSection, faqs } from "@/components/landing/faq-section"
import { LandingHeader } from "@/components/landing/landing-header"
import { JsonLd } from "@/components/seo/json-ld"
import { Metadata } from "next"
import type { FAQPage, WithContext } from "schema-dts"

export const metadata: Metadata = {
    title: "FAQ | Bloom Studio",
    description: "Find answers to common questions about Bloom Studio's AI image and video generation. Learn about pricing, features, models, and account management.",
    alternates: {
        canonical: "/faq",
    },
}

export default function FaqPage() {
    // Build FAQPage structured data for rich results
    const faqJsonLd: WithContext<FAQPage> = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <JsonLd data={faqJsonLd} />
            <LandingHeader />

            <main className="flex-1">
                <div className="pt-32 pb-20 text-center">
                    <h1 className="text-4xl font-bold mb-4">Help &amp; FAQ</h1>
                    <p className="text-muted-foreground">Find answers to common questions about Bloom Studio.</p>
                </div>
                <FaqSection />
            </main>

            <Footer />
        </div>
    )
}
