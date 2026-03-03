import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ModelPageShell } from "@/components/models/model-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { NSFWFaqSection } from "@/components/nsfw/nsfw-faq-section";
import { NSFWCtaSection } from "@/components/nsfw/nsfw-cta-section";
import { Button } from "@/components/ui/button";
import { ArrowRight, ImageIcon, Video, Sparkles, Shield } from "lucide-react";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: "NSFW AI Image & Video Generator — Uncensored AI Art | Bloom Studio",
  description:
    "Generate uncensored NSFW AI images and videos with no filters. Free NSFW AI art generator supporting Flux, GPT Image, and more. Create adult AI content privately.",
  alternates: {
    canonical: "/nsfw",
  },
  keywords: [
    "NSFW AI generator",
    "NSFW AI image generator",
    "NSFW AI video generator",
    "uncensored AI art",
    "AI art generator no restrictions",
    "adult AI image generator",
    "NSFW AI art",
    "unfiltered AI image generator",
    "AI image generator NSFW",
    "NSFW AI models",
  ],
  openGraph: {
    title: "NSFW AI Image & Video Generator — Uncensored AI Art",
    description:
      "Generate uncensored NSFW AI images and videos with no filters. Free NSFW AI art generator with multiple models.",
    url: "https://bloomstudio.fun/nsfw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NSFW AI Image & Video Generator — Uncensored AI Art",
    description:
      "Generate uncensored NSFW AI images and videos with no filters. Free NSFW AI art generator with multiple models.",
  },
};

// ============================================================================
// Data
// ============================================================================

const NSFW_FEATURES = [
  {
    icon: Shield,
    title: "No Content Filters",
    description:
      "Generate any content without restrictive filters or censorship blocks.",
  },
  {
    icon: Sparkles,
    title: "Multiple NSFW Models",
    description:
      "Access Flux Schnell, GPT Image, Imagen 4, and more uncensored models.",
  },
  {
    icon: ImageIcon,
    title: "High-Resolution Output",
    description:
      "Generate up to 4K resolution NSFW images with photorealistic detail.",
  },
  {
    icon: Video,
    title: "NSFW Video Generation",
    description:
      "Create uncensored AI videos with Grok Video. Cinematic motion, no restrictions.",
  },
];

const NSFW_MODELS = [
  {
    name: "Flux Schnell",
    type: "image" as const,
    description:
      "Ultra-fast uncensored image generation with excellent prompt adherence.",
    slug: "flux-schnell",
  },
  {
    name: "GPT Image",
    type: "image" as const,
    description: "High-fidelity NSFW images with precise detail control.",
    slug: "gpt-image",
  },
  {
    name: "Imagen 4",
    type: "image" as const,
    description:
      "Photorealistic NSFW generation with natural lighting.",
    slug: "imagen-4",
  },
  {
    name: "Grok Imagine",
    type: "image" as const,
    description:
      "Creative NSFW art with expressive, artistic outputs.",
    slug: "grok-imagine",
  },
  {
    name: "Grok Video",
    type: "video" as const,
    description:
      "Fast NSFW video generation with flexible duration.",
    slug: "grok-video",
  },
];

const FAQ_ITEMS = [
  {
    question: "Is NSFW content really allowed?",
    answer:
      "Yes. Bloom Studio does not impose content filters on AI generation. You can create any content that is legal in your jurisdiction. We believe in creative freedom.",
  },
  {
    question: "Are my NSFW generations private?",
    answer:
      "Absolutely. All generations are private by default. We do not review, moderate, or share your content. Your creations belong to you alone.",
  },
  {
    question: "Which models support NSFW?",
    answer:
      "All models on Bloom Studio support uncensored generation: Flux Schnell, GPT Image, Imagen 4, Grok Imagine, Grok Video, and more. No model has content restrictions.",
  },
  {
    question: "Is there a free trial for NSFW generation?",
    answer:
      "Yes. You get a 24-hour free trial with full access to all NSFW models. Generate uncensored images and videos without restrictions during your trial.",
  },
  {
    question: "Can I generate NSFW videos?",
    answer:
      "Yes. Our video model (Grok Video) supports uncensored video generation. Create adult videos up to 10 seconds in HD resolution.",
  },
];

// ============================================================================
// Page
// ============================================================================

export default function NSFWHubPage() {
  return (
    <ModelPageShell>
      {/* Structured data: WebPage + FAQPage (separate entities for Google) */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "NSFW AI Image & Video Generator",
          description:
            "Generate uncensored NSFW AI images and videos with no filters. Free NSFW AI art generator.",
          url: "https://bloomstudio.fun/nsfw",
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://bloomstudio.fun",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "NSFW AI Generator",
                item: "https://bloomstudio.fun/nsfw",
              },
            ],
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }}
      />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/50"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Animated Grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
          aria-hidden="true"
        />

        {/* Glow Orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-[128px] animate-pulse"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px] animate-pulse delay-1000"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-rose-300">
                Uncensored AI Generation
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-brand text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[0.95]">
              <span className="bg-gradient-to-r from-rose-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                NSFW AI
              </span>
              <br />
              <span className="text-foreground">Generator</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              No filters. No restrictions. Generate uncensored AI images and
              videos with complete creative freedom.
            </p>
            <p className="text-base text-muted-foreground/70 mb-10 max-w-xl mx-auto">
              Access the most powerful unfiltered AI models: Flux, GPT Image,
              Imagen 4, Grok Video, and more. Free trial available.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/studio">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 border-0 group"
                >
                  Start Generating
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/nsfw/models">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-lg border-white/20 hover:bg-white/5"
                >
                  View NSFW Models
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground/60">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Private & Secure
              </span>
              <span aria-hidden="true">•</span>
              <span>No Content Filters</span>
              <span aria-hidden="true">•</span>
              <span>24h Free Trial</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/5 to-transparent"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              Why Choose Bloom Studio for NSFW?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The only AI generation platform that respects your creative freedom
              without arbitrary restrictions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {NSFW_FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  "group p-8 rounded-2xl transition-all duration-300",
                  "bg-white/5 backdrop-blur-sm border border-white/10",
                  "hover:border-rose-500/30 hover:bg-white/[0.07]",
                  index === 0 && "md:col-span-2"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                    <feature.icon className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-24 relative border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
                NSFW-Ready Models
              </h2>
              <p className="text-muted-foreground max-w-xl">
                All models support uncensored generation. Choose based on speed,
                quality, and style preferences.
              </p>
            </div>
            <Link href="/nsfw/models" className="mt-4 md:mt-0">
              <Button variant="ghost" className="group">
                View All Models
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {NSFW_MODELS.map((model) => (
              <Link
                key={model.slug}
                href={`/models/${model.slug}/create`}
                className={cn(
                  "group p-6 rounded-2xl transition-all duration-300",
                  "bg-white/5 backdrop-blur-sm border border-white/10",
                  "hover:border-rose-500/30 hover:bg-white/[0.07]",
                  "hover:-translate-y-0.5"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border",
                      model.type === "video"
                        ? "text-violet-400 border-violet-400/20 bg-violet-400/10"
                        : "text-rose-400 border-rose-400/20 bg-rose-400/10"
                    )}
                  >
                    {model.type === "video" ? "Video" : "Image"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-rose-400 transition-colors">
                  {model.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {model.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Content Type Links */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Images Card */}
            <Link
              href="/nsfw/images"
              className="group relative overflow-hidden rounded-3xl p-10 transition-all duration-500 hover:scale-[1.02]"
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-background to-background"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-500/30 via-transparent to-transparent"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-rose-500/30 transition-colors"
                aria-hidden="true"
              />

              <div className="relative z-10">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6">
                  <ImageIcon className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-2xl font-bold font-brand mb-3">
                  NSFW Image Generator
                </h3>
                <p className="text-muted-foreground mb-6">
                  Generate uncensored AI images with Flux, GPT Image, Imagen 4,
                  and more. High-resolution, photorealistic outputs.
                </p>
                <span className="inline-flex items-center text-rose-400 font-medium group-hover:text-rose-300">
                  Explore Image Models
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>

            {/* Videos Card */}
            <Link
              href="/nsfw/videos"
              className="group relative overflow-hidden rounded-3xl p-10 transition-all duration-500 hover:scale-[1.02]"
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-background to-background"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/30 via-transparent to-transparent"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-violet-500/30 transition-colors"
                aria-hidden="true"
              />

              <div className="relative z-10">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-6">
                  <Video className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-2xl font-bold font-brand mb-3">
                  NSFW Video Generator
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create uncensored AI videos with Grok Video. Cinematic motion, no restrictions.
                </p>
                <span className="inline-flex items-center text-violet-400 font-medium group-hover:text-violet-300">
                  Explore Video Models
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section — interactive disclosure via shared component */}
      <NSFWFaqSection title="Frequently Asked Questions" items={FAQ_ITEMS} />

      {/* Final CTA — shared component */}
      <NSFWCtaSection
        headline="Start Creating Today"
        description="Join thousands of creators using Bloom Studio for uncensored AI generation. 24-hour free trial. No credit card required."
        primaryHref="/studio"
        primaryLabel="Start Free Trial"
        secondaryHref="/pricing"
        secondaryLabel="View Pricing"
      />
    </ModelPageShell>
  );
}
