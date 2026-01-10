import { Metadata } from "next"
import PricingClient from "./pricing-client"
import { JsonLd } from "@/components/seo/json-ld"
import type { Product, WithContext } from "schema-dts"
import { CompetitorComparison } from "@/components/landing/competitor-comparison"

export const metadata: Metadata = {
  title: "Pricing | Bloom Studio",
  description: "Simple pricing for AI image and video generation. Start for free, upgrade for just $5/month.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | Bloom Studio",
    description: "Unbeatable value. 900 images/mo for $5. Compare vs Leonardo.ai.",
    url: "/pricing",
  },
}

import { LandingHeader } from "@/components/landing/landing-header"

export default function PricingPage() {
  const jsonLd: WithContext<Product> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Bloom Studio Pro",
    description: "Professional AI image and video generation subscription. Includes 900 images/month, all models (Flux, Veo, etc), and private generations.",
    image: "https://bloomstudio.fun/branding/bloom-studio_logo.png",
    offers: {
      "@type": "Offer",
      price: "5.00",
      priceCurrency: "USD",
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      availability: "https://schema.org/InStock",
      url: "https://bloomstudio.fun/pricing",
      category: "Subscription",
    },
    brand: {
      "@type": "Brand",
      name: "Bloom Studio",
    },
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <LandingHeader />
      <PricingClient />
    </>
  )
}
