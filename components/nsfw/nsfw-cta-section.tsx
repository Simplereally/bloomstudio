import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface NSFWCtaSectionProps {
  headline: string;
  description: string;
  /** Primary CTA link (defaults to /studio) */
  primaryHref?: string;
  primaryLabel?: string;
  /** Secondary CTA link */
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Gradient direction — rose→violet or violet→rose */
  accent?: "rose" | "violet";
}

/**
 * Shared final CTA section for NSFW SEO pages.
 *
 * Consolidates the nearly-identical CTA blocks at the bottom of each page.
 * All Tailwind classes are static strings to ensure JIT compilation.
 */
export function NSFWCtaSection({
  headline,
  description,
  primaryHref = "/studio",
  primaryLabel = "Start Free Trial",
  secondaryHref = "/nsfw",
  secondaryLabel = "Back to NSFW Hub",
  accent = "rose",
}: NSFWCtaSectionProps) {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center rounded-3xl relative overflow-hidden p-12 sm:p-16">
          {/* Background gradient — static classes per accent */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br via-card/80 border border-white/10 rounded-3xl",
              accent === "rose"
                ? "from-rose-500/10 to-violet-500/5"
                : "from-violet-500/10 to-rose-500/5"
            )}
            aria-hidden="true"
          />
          {/* Glow orb */}
          <div
            className={cn(
              "absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full blur-3xl",
              accent === "rose" ? "bg-rose-500/20" : "bg-violet-500/20"
            )}
            aria-hidden="true"
          />

          <div className="relative">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              {headline}
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={primaryHref}>
                <Button
                  size="lg"
                  className={cn(
                    "px-10 h-14 text-lg bg-gradient-to-r border-0 group",
                    accent === "rose"
                      ? "from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600"
                      : "from-violet-500 to-rose-500 hover:from-violet-600 hover:to-rose-600"
                  )}
                >
                  {primaryLabel}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href={secondaryHref}>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-10 h-14 text-lg border-white/20 hover:bg-white/5"
                >
                  {secondaryLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
