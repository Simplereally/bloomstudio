import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import type { ModelPageCategory, ModelSEOConfig } from "@/lib/models/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModelCTABannerProps {
  /** Page category — drives contextual CTA copy */
  category: ModelPageCategory
  /** Optional model config — personalizes copy with model name */
  model?: ModelSEOConfig
}

// ---------------------------------------------------------------------------
// CTA Copy
// ---------------------------------------------------------------------------

function getCTACopy(
  category: ModelPageCategory,
  modelName?: string
): { heading: string; description: string; primaryLabel: string } {
  const name = modelName ?? "our AI models"

  switch (category) {
    case "create":
      return {
        heading: `Start generating with ${name}`,
        description: `Create stunning visuals in seconds. ${name} is ready to bring your ideas to life — no setup required.`,
        primaryLabel: "Open Studio",
      }
    case "edit":
      return {
        heading: `Try editing with ${name}`,
        description: `Refine and transform your images with precision. Upload, prompt, and watch ${name} work its magic.`,
        primaryLabel: "Start Editing",
      }
    case "features":
      return {
        heading: `Experience ${name} in action`,
        description: `Explore every capability first-hand. See why creators choose ${name} for professional-quality output.`,
        primaryLabel: "Try It Free",
      }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ModelCTABanner — Conversion CTA section for model SEO pages.
 *
 * Context-aware copy adapts to the page category (create / edit / features).
 * Matches the landing page CTA pattern with gradient background and glow.
 *
 * Server Component — no client JS required.
 */
export function ModelCTABanner({ category, model }: ModelCTABannerProps) {
  const { heading, description, primaryLabel } = getCTACopy(
    category,
    model?.displayName
  )

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto text-center rounded-3xl relative overflow-hidden p-12 sm:p-16">
            {/* Background gradient */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card/80 to-purple-500/5 border border-white/10 rounded-3xl"
              aria-hidden="true"
            />

            {/* Glow accent */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-primary/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                {heading}
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                {description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/studio">
                  <Button
                    size="lg"
                    className="px-10 h-14 text-lg transition-all group"
                  >
                    <span className="relative opacity-90 group-hover:opacity-100 transition-opacity">
                      {primaryLabel}
                      <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary-foreground/50 group-hover:w-full transition-all duration-300 ease-out" />
                    </span>
                    <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-10 h-14 text-lg border-white/20 hover:bg-white/5"
                  >
                    Compare Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
