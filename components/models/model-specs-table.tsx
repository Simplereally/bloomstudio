import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { cn } from "@/lib/utils";
import type { ModelDefinition } from "@/lib/config/models";
import type { ModelSEOConfig } from "@/lib/models/types";

// ============================================================================
// Helpers
// ============================================================================

/** Derive a human-readable max resolution string from model constraints */
function formatMaxResolution(model: ModelDefinition): string {
  const { constraints, aspectRatios } = model;

  if (constraints.maxPixels !== Infinity) {
    const mp = constraints.maxPixels / 1_000_000;
    return mp >= 1
      ? `${mp.toFixed(mp % 1 === 0 ? 0 : 1)} MP`
      : `${(constraints.maxPixels / 1000).toFixed(0)}K px`;
  }

  const maxDim = Math.max(
    ...aspectRatios.map((ar) => Math.max(ar.width, ar.height))
  );
  return `${maxDim}px`;
}

/** List supported aspect ratio values */
function formatAspectRatios(model: ModelDefinition): string {
  const unique = [
    ...new Set(model.aspectRatios.map((ar) => ar.value)),
  ].filter((v) => v !== "custom");
  return unique.join(", ");
}

/** Generation speed tier from model characteristics */
function formatSpeed(model: ModelDefinition): string {
  const fastModels = ["flux", "turbo", "zimage", "klein"];
  const standardModels = ["gptimage", "nanobanana", "kontext", "klein-large"];

  if (fastModels.includes(model.id)) return "Fast (seconds)";
  if (standardModels.includes(model.id)) return "Standard (seconds)";
  if (model.type === "video") return "Standard (minutes)";
  return "Standard";
}

/** Format quality tier labels */
function formatPricingTier(model: ModelDefinition): string {
  const tiers = model.constraints.supportedTiers;
  if (!tiers || tiers.length === 0) return "Standard";

  const tierLabels: Record<string, string> = {
    sd: "SD",
    hd: "HD",
    "2k": "2K",
    "4k": "4K",
  };
  return tiers.map((t) => tierLabels[t] ?? t.toUpperCase()).join(", ");
}

/** Derive provider name from logo path */
function deriveProvider(model: ModelDefinition): string {
  if (!model.logo) return "Unknown";

  const providers: Record<string, string> = {
    "flux.svg": "Black Forest Labs",
    "openai.svg": "OpenAI",
    "google.svg": "Google",
    "bytedance.svg": "ByteDance",
    "alibaba.svg": "Alibaba",
    "stability.svg": "Stability AI",
    "xai.svg": "xAI",
  };

  const filename = model.logo.split("/").pop() ?? "";
  return providers[filename] ?? "Unknown";
}

// ============================================================================
// Spec Row Data Builder
// ============================================================================

interface SpecRow {
  label: string;
  value: string;
}

function buildSpecRows(model: ModelDefinition): SpecRow[] {
  const rows: SpecRow[] = [
    {
      label: "Model Type",
      value: model.type === "image" ? "Image Generation" : "Video Generation",
    },
    { label: "Provider", value: deriveProvider(model) },
    { label: "Max Resolution", value: formatMaxResolution(model) },
    { label: "Aspect Ratios", value: formatAspectRatios(model) },
    { label: "Generation Speed", value: formatSpeed(model) },
    {
      label: "Reference Image",
      value: model.supportsReferenceImage ? "Yes" : "No",
    },
    {
      label: "Negative Prompt",
      value: model.supportsNegativePrompt ? "Yes" : "No",
    },
    { label: "Quality Tiers", value: formatPricingTier(model) },
  ];

  // Video-specific specs
  if (model.durationConstraints) {
    const dc = model.durationConstraints;
    rows.push({
      label: "Video Duration",
      value: dc.fixedOptions
        ? dc.fixedOptions.join(", ") + "s"
        : `${dc.min}–${dc.max}s`,
    });
  }

  if (model.supportsAudio) {
    rows.push({ label: "Audio Generation", value: "Yes" });
  }

  if (model.supportsInterpolation) {
    rows.push({ label: "Frame Interpolation", value: "Yes" });
  }

  return rows;
}

// ============================================================================
// Component
// ============================================================================

interface ModelSpecsTableProps {
  /** The model SEO config to render specs for */
  model: ModelSEOConfig;
  /** Section heading */
  heading?: string;
}

/**
 * Technical specifications table for a model's feature page.
 *
 * Displays key specs (resolution, aspect ratios, speed, etc.)
 * in a clean table with alternating rows. On mobile, stacks
 * as label/value cards.
 *
 * Server Component — no client JS required.
 */
export function ModelSpecsTable({
  model,
  heading = "Technical Specifications",
}: ModelSpecsTableProps) {
  const definition = model.modelDefinition;

  const rows = buildSpecRows(definition);

  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              {heading}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Detailed specifications for{" "}
              <span className="text-foreground font-medium">
                {model.displayName}
              </span>
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="max-w-3xl mx-auto">
            {/* Desktop: Table */}
            <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Specification
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={row.label}
                      className={cn(
                        "border-b border-white/5 last:border-b-0 transition-colors hover:bg-white/[0.03]",
                        index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                      )}
                    >
                      <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                        {row.label}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Stacked cards */}
            <div className="md:hidden space-y-3">
              {rows.map((row, index) => (
                <div
                  key={row.label}
                  className={cn(
                    "rounded-xl border border-white/10 p-4",
                    "bg-white/5 backdrop-blur-sm",
                    index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                  )}
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {row.label}
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
