import { CtaSection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
// import { FloatingGallery } from "@/components/landing/floating-gallery";
import { Footer } from "@/components/layout/footer";
import { GLBackground } from "@/components/landing/gl-background";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingHeader } from "@/components/landing/landing-header";
import { ModelsSection } from "@/components/landing/models-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { ValuePropSection } from "@/components/landing/value-prop-section";
import { JsonLd } from "@/components/seo/json-ld";
import Link from "next/link";

/**
 * Landing Page - Server Component
 *
 * Premium landing page with hero, features showcase, model gallery,
 * and compelling value proposition. Inspired by Leonardo.ai's layout
 * but with unique creative elements.
 *
 * ARCHITECTURE FOR SEO:
 * - This page is a SERVER COMPONENT, meaning all static content
 *   (Hero, Features, Models, CTA, Footer) is rendered on the server
 *   and included in the initial HTML response for optimal SEO.
 *
 * - Interactive/client-only parts are isolated into Client Components:
 *   - LandingHeader: Uses hooks for scroll detection and auth state
 *   - GLBackground: Dynamically loads WebGL canvas with ssr:false
 *
 * - This separation ensures search engines receive fully-rendered
 *   static content while users get the enhanced interactive experience.
 */
export default function LandingPage() {
  return (
    <div className="dark">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Bloom Studio",
          applicationCategory: "DesignApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          description: "Cheap and powerful AI image and video generator studio.",
        }}
      />
      {/* Client Component: WebGL background (ssr: false, won't impact SEO) */}
      <GLBackground />

      {/* Client Component: Interactive header with scroll/auth */}
      <LandingHeader />

      {/* Static content - Server Rendered for SEO */}
      <div className="relative z-10 pt-12">
        {/* <FloatingGallery /> */}

        <HeroSection />
        <ShowcaseSection />
        <ValuePropSection />
        <FeaturesSection />
        <ModelsSection />
        <CtaSection />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
