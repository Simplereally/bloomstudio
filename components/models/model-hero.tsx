import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { NsfwBadge } from "@/components/landing/nsfw-badge";
import { isMonochromeLogo } from "@/lib/config/models";
import { cn } from "@/lib/utils";
import type {
  ModelPageContent,
  ModelSEOConfig,
} from "@/lib/models/types";
import { ArrowRight, Clock, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface ModelHeroProps {
  content: ModelPageContent;
  model: ModelSEOConfig;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ModelHero — Hero section for model SEO pages.
 *
 * Server Component. Renders an above-the-fold hero with provider badge,
 * headline, subtitle, and CTA group. Uses the app's unified `primary`
 * colour — category differentiation is handled by copy, not palette.
 *
 * Layout mirrors the landing page hero: left-aligned headline with
 * scroll-reveal entrance animations and trust indicators.
 */
export function ModelHero({ content, model }: ModelHeroProps) {
  const { hero } = content;
  const { modelDefinition, provider } = model;

  return (
    <section aria-label={hero.title} className="relative pt-6 pb-20 md:pb-28 overflow-hidden">
      {/* Ambient primary glow — subtle, brand-consistent */}
      <div
        className="absolute top-0 left-1/3 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/10 blur-[100px] pointer-events-none animate-pulse-glow"
        aria-hidden="true"
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          {/* Provider badge */}
          <ScrollReveal instant>
            <div className="flex items-center gap-3 mb-8">
              {modelDefinition.logo && (
                <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="relative w-5 h-5">
                    <Image
                      src={modelDefinition.logo}
                      alt={`${provider.name} logo`}
                      fill
                      sizes="20px"
                      className={cn(
                        "object-contain",
                        isMonochromeLogo(modelDefinition.logo) && "dark:invert",
                      )}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {provider.name}
                </span>
                <span className="text-muted-foreground/30" aria-hidden="true">
                  /
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  {model.displayName}
                </span>
                {modelDefinition.isUnrestricted && (
                  <NsfwBadge className="-ml-1" />
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* H1 — most important SEO element on the page */}
          <ScrollReveal instant delay={100}>
            <h1 className="font-brand text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-5 leading-[1.08]">
              {hero.title}
            </h1>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal instant delay={180}>
            <p className="text-xl md:text-2xl text-muted-foreground font-light mb-5 max-w-2xl leading-relaxed">
              {hero.subtitle}
            </p>
          </ScrollReveal>

          {/* Hero description */}
          <ScrollReveal instant delay={250}>
            <p className="text-base md:text-lg text-muted-foreground/80 mb-10 max-w-2xl leading-relaxed text-balance">
              {hero.description}
            </p>
          </ScrollReveal>

          {/* CTA group */}
          <ScrollReveal instant delay={320}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button
                asChild
                size="lg"
                className="px-10 h-14 text-lg transition-all group"
              >
                <Link href={hero.ctaHref ?? "/studio"}>
                  <span className="relative opacity-90 group-hover:opacity-100 transition-opacity">
                    {hero.ctaText}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary-foreground/50 group-hover:w-full transition-all duration-300 ease-out" />
                  </span>
                  <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                </Link>
              </Button>
              <Link href="/pricing" className="group flex items-center justify-center">
                <span className="relative inline-flex items-center gap-2 text-lg font-medium text-foreground/80 hover:text-foreground transition-colors cursor-pointer py-4">
                  See Pricing
                  <ArrowRight className="h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                  <span className="absolute bottom-3 left-0 w-0 h-px bg-foreground/40 group-hover:w-[calc(100%-1.75rem)] transition-all duration-300 ease-out" />
                </span>
              </Link>
            </div>
          </ScrollReveal>

          {/* Trust indicators */}
          <ScrollReveal instant delay={400}>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>24-hour free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>No credit card required</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
