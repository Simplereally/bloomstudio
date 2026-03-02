import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MODEL_REGISTRY, type ModelDefinition } from "@/lib/config/models";
import { getModelByModelId } from "@/lib/models/model-seo-slugs";
import type { ModelSEOConfig } from "@/lib/models/types";

// ============================================================================
// Comparison Metric Extraction
// ============================================================================

interface ComparisonMetric {
  label: string;
  getValue: (model: ModelDefinition) => string;
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    label: "Type",
    getValue: (m) => (m.type === "image" ? "Image" : "Video"),
  },
  {
    label: "Max Resolution",
    getValue: (m) => {
      if (m.constraints.maxPixels !== Infinity) {
        const mp = m.constraints.maxPixels / 1_000_000;
        return mp >= 1
          ? `${mp.toFixed(mp % 1 === 0 ? 0 : 1)} MP`
          : `${(m.constraints.maxPixels / 1000).toFixed(0)}K px`;
      }
      const maxDim = Math.max(
        ...m.aspectRatios.map((ar) => Math.max(ar.width, ar.height))
      );
      return `${maxDim}px`;
    },
  },
  {
    label: "Aspect Ratios",
    getValue: (m) => {
      const count = new Set(
        m.aspectRatios.map((ar) => ar.value).filter((v) => v !== "custom")
      ).size;
      return `${count} presets`;
    },
  },
  {
    label: "Reference Image",
    getValue: (m) => (m.supportsReferenceImage ? "Yes" : "No"),
  },
  {
    label: "Quality Tiers",
    getValue: (m) => {
      const tiers = m.constraints.supportedTiers;
      if (!tiers || tiers.length === 0) return "Standard";
      return tiers.map((t) => t.toUpperCase()).join(", ");
    },
  },
  {
    label: "Speed",
    getValue: (m) => {
      const fastModels = ["flux", "turbo", "zimage", "klein"];
      if (fastModels.includes(m.id)) return "Fast";
      if (m.type === "video") return "Standard";
      return "Standard";
    },
  },
];

// ============================================================================
// Component
// ============================================================================

interface ModelComparisonProps {
  /** The primary model being showcased */
  currentModel: ModelSEOConfig;
  /** Optional: IDs of models to compare against. Defaults to same-type active models. */
  compareModelIds?: readonly string[];
  /** Section heading */
  heading?: string;
}

/**
 * Model comparison table for SEO pages.
 *
 * Compares the current model against other models on key metrics.
 * The current model column is visually highlighted. Each model
 * includes a CTA linking to its feature page or the studio.
 *
 * Server Component — no client JS required.
 */
export function ModelComparison({
  currentModel,
  compareModelIds,
  heading = "Model Comparison",
}: ModelComparisonProps) {
  const currentDef = currentModel.modelDefinition;

  // Resolve comparison models
  const compareIds =
    compareModelIds ??
    Object.values(MODEL_REGISTRY)
      .filter(
        (m) =>
          m.type === currentDef.type &&
          m.id !== currentDef.id &&
          !m.isLegacy
      )
      .map((m) => m.id);

  const compareModels = compareIds
    .map((id) => MODEL_REGISTRY[id])
    .filter((m): m is ModelDefinition => m !== undefined);

  // Current model first, then comparisons
  const allModels = [currentDef, ...compareModels];

  /** Resolve the slug for a model ID via the slug registry */
  function getSlug(modelId: string): string {
    return getModelByModelId(modelId)?.slug ?? modelId;
  }

  return (
    <section className="py-20 bg-black/20 border-y border-white/5">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              {heading}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how{" "}
              <span className="text-foreground font-medium">
                {currentModel.displayName}
              </span>{" "}
              compares to other models on Bloom Studio.
            </p>
          </div>
        </ScrollReveal>

        {/* Desktop: Comparison table */}
        <ScrollReveal delay={100}>
          <div className="hidden lg:block max-w-6xl mx-auto">
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {/* Metric label column */}
                      <th className="text-left px-6 py-5 text-sm font-medium text-muted-foreground uppercase tracking-wider min-w-[160px]">
                        Feature
                      </th>
                      {/* Model columns */}
                      {allModels.map((model, i) => {
                        const isCurrent = i === 0;
                        return (
                          <th
                            key={model.id}
                            className={cn(
                              "text-center px-4 py-5 min-w-[160px]",
                              isCurrent && "bg-primary/5"
                            )}
                          >
                            <div className="flex flex-col items-center gap-2">
                              {model.logo && (
                                <div className="relative w-6 h-6">
                                  <Image
                                    src={model.logo}
                                    alt={`${model.displayName} logo`}
                                    fill
                                    className="object-contain dark:invert"
                                  />
                                </div>
                              )}
                              <span
                                className={cn(
                                  "text-sm font-bold font-brand tracking-tight",
                                  isCurrent
                                    ? "text-primary"
                                    : "text-foreground"
                                )}
                              >
                                {model.displayName}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] uppercase tracking-widest text-primary/70 font-medium">
                                  Current
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_METRICS.map((metric, rowIndex) => (
                      <tr
                        key={metric.label}
                        className={cn(
                          "border-b border-white/5 last:border-b-0",
                          rowIndex % 2 === 0
                            ? "bg-transparent"
                            : "bg-white/[0.02]"
                        )}
                      >
                        <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                          {metric.label}
                        </td>
                        {allModels.map((model, colIndex) => {
                          const isCurrent = colIndex === 0;
                          const value = metric.getValue(model);

                          return (
                            <td
                              key={model.id}
                              className={cn(
                                "text-center px-4 py-4 text-sm",
                                isCurrent
                                  ? "bg-primary/5 text-foreground font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              {value === "Yes" ? (
                                <Check
                                  className={cn(
                                    "h-4 w-4 mx-auto",
                                    isCurrent
                                      ? "text-primary"
                                      : "text-emerald-400/70"
                                  )}
                                />
                              ) : value === "No" ? (
                                <span className="text-white/20">&mdash;</span>
                              ) : (
                                value
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* CTA row */}
                    <tr className="border-t border-white/10">
                      <td className="px-6 py-5" />
                      {allModels.map((model, colIndex) => {
                        const isCurrent = colIndex === 0;
                        const slug = getSlug(model.id);

                        return (
                          <td
                            key={model.id}
                            className={cn(
                              "text-center px-4 py-5",
                              isCurrent && "bg-primary/5"
                            )}
                          >
                            {isCurrent ? (
                              <Link href="/studio">
                                <Button size="sm" className="group">
                                  Try Now
                                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                              </Link>
                            ) : (
                              <Link href={`/models/${slug}/features`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/10 hover:bg-white/5 text-xs"
                                >
                                  Learn More
                                </Button>
                              </Link>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Mobile/Tablet: Stacked comparison cards */}
        <div className="lg:hidden space-y-6 max-w-md mx-auto">
          {allModels.map((model, modelIndex) => {
            const isCurrent = modelIndex === 0;
            const slug = getSlug(model.id);

            return (
              <ScrollReveal key={model.id} delay={modelIndex * 100}>
                <div
                  className={cn(
                    "rounded-2xl border p-5 transition-all",
                    "bg-white/5 backdrop-blur-sm",
                    isCurrent
                      ? "border-primary/30 ring-1 ring-primary/10"
                      : "border-white/10"
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3 mb-4">
                    {model.logo && (
                      <div className="relative w-6 h-6 shrink-0">
                        <Image
                          src={model.logo}
                          alt={`${model.displayName} logo`}
                          fill
                          className="object-contain dark:invert"
                        />
                      </div>
                    )}
                    <span
                      className={cn(
                        "font-bold font-brand tracking-tight",
                        isCurrent ? "text-primary" : "text-foreground"
                      )}
                    >
                      {model.displayName}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-primary/70 font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2 mb-4">
                    {COMPARISON_METRICS.map((metric) => {
                      const value = metric.getValue(model);
                      return (
                        <div
                          key={metric.label}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-muted-foreground">
                            {metric.label}
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              isCurrent
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {value === "Yes" ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : value === "No" ? (
                              <span className="text-white/20">&mdash;</span>
                            ) : (
                              value
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  {isCurrent ? (
                    <Link href="/studio" className="block">
                      <Button size="sm" className="w-full group">
                        Try {model.displayName}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      href={`/models/${slug}/features`}
                      className="block"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-white/10 hover:bg-white/5"
                      >
                        Learn More
                      </Button>
                    </Link>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
