import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ModelPageShell } from "@/components/models/model-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ALL_MODEL_SEO_CONFIGS } from "@/lib/seo/model-pages";
import type { ModelSEOConfig } from "@/lib/models/types";
import { ArrowRight, ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "AI Models — Image & Video Generation Models | Bloom Studio",
  description:
    "Explore 9 AI models for image and video generation. Compare Flux, GPT Image, Imagen 4, Seedance, and more. Try any model free on Bloom Studio.",
  alternates: {
    canonical: "/models",
  },
};

// ============================================================================
// Helpers
// ============================================================================

function groupByType(configs: readonly ModelSEOConfig[]) {
  const image: ModelSEOConfig[] = [];
  const video: ModelSEOConfig[] = [];

  for (const config of configs) {
    if (config.modelDefinition.type === "video") {
      video.push(config);
    } else {
      image.push(config);
    }
  }

  return { image, video };
}

// ============================================================================
// Model Card
// ============================================================================

function ModelCard({ model }: { model: ModelSEOConfig }) {
  const { modelDefinition, provider } = model;
  const isVideo = modelDefinition.type === "video";

  const isMonochromeLogo =
    modelDefinition.logo?.includes("openai.svg") ||
    modelDefinition.logo?.includes("flux.svg") ||
    modelDefinition.logo?.includes("xai.svg");

  return (
    <Link
      href={`/models/${model.slug}/create`}
      className={cn(
        "group relative flex flex-col p-6 rounded-2xl transition-all duration-300",
        "bg-white/5 backdrop-blur-sm border border-white/10",
        "hover:border-primary/30 hover:bg-white/[0.07]",
        "hover:shadow-lg hover:shadow-primary/5",
        "hover:-translate-y-0.5"
      )}
    >
      {/* Header row: logo + badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {modelDefinition.logo && (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5">
              <div className="relative w-5 h-5">
                <Image
                  src={modelDefinition.logo}
                  alt={`${provider.name} logo`}
                  fill
                  className={cn(
                    "object-contain",
                    isMonochromeLogo && "dark:invert"
                  )}
                />
              </div>
            </div>
          )}
          <div>
            <h3 className="text-base font-bold font-brand text-foreground group-hover:text-primary transition-colors">
              {model.displayName}
            </h3>
            <p className="text-xs text-muted-foreground">{provider.name}</p>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border",
            isVideo
              ? "text-sky-400 border-sky-400/20 bg-sky-400/10"
              : "text-orange-400 border-orange-400/20 bg-orange-400/10"
          )}
        >
          {isVideo ? (
            <Video className="h-3 w-3" />
          ) : (
            <ImageIcon className="h-3 w-3" />
          )}
          {isVideo ? "Video" : "Image"}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2 flex-1">
        {modelDefinition.description}
      </p>

      {/* Category tags */}
      <div className="flex items-center gap-2">
        {model.categories.map((cat) => (
          <span
            key={cat}
            className="text-[11px] font-medium text-muted-foreground/70 bg-white/5 border border-white/5 rounded-md px-2 py-0.5 capitalize"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Hover arrow */}
      <ArrowRight className="absolute top-6 right-6 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function ModelsHubPage() {
  const { image, video } = groupByType(ALL_MODEL_SEO_CONFIGS);

  // Filter out legacy models for the hub listing
  const activeImage = image.filter((m) => !m.modelDefinition.isLegacy);
  const activeVideo = video.filter((m) => !m.modelDefinition.isLegacy);

  return (
    <ModelPageShell>
      {/* JSON-LD: CollectionPage */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "AI Models — Bloom Studio",
          description:
            "Browse and compare 9 AI models for image and video generation on Bloom Studio.",
          url: "https://bloomstudio.fun/models",
          provider: {
            "@type": "Organization",
            name: "Bloom Studio",
            url: "https://bloomstudio.fun",
          },
        }}
      />

      {/* Hero */}
      <section className="pt-28 md:pt-36 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/10 blur-[120px] opacity-60 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="font-brand text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 leading-[1.1]">
              AI Models
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light mb-6 max-w-2xl leading-relaxed">
              Explore our full library of image and video generation models.
            </p>
            <p className="text-base text-muted-foreground/80 mb-8 max-w-2xl leading-relaxed">
              From lightning-fast drafts with Flux Schnell to cinematic video
              with Veo 3.1 — pick the right model for your creative workflow.
              Every model is available in your free trial.
            </p>
            <Link href="/studio">
              <Button size="lg" className="h-14 px-8 text-lg group">
                Open Studio
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Image Models */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <ImageIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-brand">Image Models</h2>
              <p className="text-sm text-muted-foreground">
                {activeImage.length} models for image generation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeImage.map((model) => (
              <ModelCard key={model.slug} model={model} />
            ))}
          </div>
        </div>
      </section>

      {/* Video Models */}
      <section className="py-16 bg-black/20 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <Video className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-brand">Video Models</h2>
              <p className="text-sm text-muted-foreground">
                {activeVideo.length} models for video generation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeVideo.map((model) => (
              <ModelCard key={model.slug} model={model} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center rounded-3xl relative overflow-hidden p-12 sm:p-16">
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/10 via-card/80 to-purple-500/5 border border-white/10 rounded-3xl"
              aria-hidden
            />
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-primary/20 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                Start creating today
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                Every model. Every feature. No credit card required. Try Bloom
                Studio free for 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/studio">
                  <Button size="lg" className="px-10 h-14 text-lg group">
                    Open Studio
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-10 h-14 text-lg border-white/20 hover:bg-white/5"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ModelPageShell>
  );
}
