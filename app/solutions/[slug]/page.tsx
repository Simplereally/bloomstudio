

import { Footer } from "@/components/layout/footer"
import { CtaSection } from "@/components/landing/cta-section"
import { LandingHeader } from "@/components/landing/landing-header"
import { ModelsSection } from "@/components/landing/models-section"
import { SolutionShowcase } from "@/components/solutions/solution-showcase"
import { SOLUTIONS } from "@/lib/seo-config"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { SolutionHero } from "@/components/solutions/solution-hero"
import { SolutionFeatures } from "@/components/solutions/solution-features"
import { SolutionSteps } from "@/components/solutions/solution-steps"
import { SolutionFAQ } from "@/components/solutions/solution-faq"

export async function generateStaticParams() {
    return SOLUTIONS.map((solution) => ({
        slug: solution.slug,
    }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const slug = (await params).slug
    const solution = SOLUTIONS.find((s) => s.slug === slug)

    if (!solution) {
        return {
            title: "Bloom Studio",
        }
    }

    return {
        title: `Free ${solution.title} | Bloom Studio`,
        description: solution.description,
        alternates: {
            canonical: `/solutions/${slug}`,
        },
    }
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug
    const solution = SOLUTIONS.find((s) => s.slug === slug)

    if (!solution) {
        return notFound()
    }

    return (
        <div className="dark min-h-screen relative selection:bg-primary/30 selection:text-primary-foreground bg-background pt-20">
             <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "Service",
                    name: solution.title,
                    description: solution.description,
                    provider: {
                        "@type": "Organization",
                        name: "Bloom Studio",
                        url: "https://bloomstudio.fun"
                    },
                    serviceType: "AI Generation",
                    offers: {
                        "@type": "Offer",
                        price: "0",
                        priceCurrency: "USD"
                    }
                }}
            />
            {/* Header - Unified Landing Header */}
            <LandingHeader />

            <SolutionHero 
                title={solution.title}
                shortTitle={solution.shortTitle}
                description={solution.description}
                heroPrefix={solution.heroPrefix}
                heroSuffix={solution.heroSuffix}
                images={solution.heroImages}
            />

            <SolutionShowcase items={solution.showcase} />

            <SolutionFeatures features={solution.features} />

            <SolutionSteps steps={solution.steps} shortTitle={solution.shortTitle} />
            
            <ModelsSection />

            <SolutionFAQ faqs={solution.faqs} />

            <CtaSection />

            <Footer />
        </div>
    )
}
