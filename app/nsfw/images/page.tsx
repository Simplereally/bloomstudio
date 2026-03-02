import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ModelPageShell } from "@/components/models/model-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { NSFWBreadcrumb } from "@/components/nsfw/nsfw-breadcrumb";
import { NSFWFaqSection } from "@/components/nsfw/nsfw-faq-section";
import { NSFWCtaSection } from "@/components/nsfw/nsfw-cta-section";
import { NSFWHowToSection } from "@/components/nsfw/nsfw-howto-section";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ImageIcon,
  Shield,
  Zap,
  Layers,
  Maximize,
  Palette,
  CheckCircle,
} from "lucide-react";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title:
    "NSFW AI Image Generator — Uncensored AI Art, No Filters | Bloom Studio",
  description:
    "Generate uncensored NSFW AI images with no filters or restrictions. Compare 7 unfiltered AI image models including Flux Schnell, GPT Image, Imagen 4, and Grok Imagine. Free trial.",
  alternates: {
    canonical: "/nsfw/images",
  },
  keywords: [
    "NSFW AI image generator",
    "uncensored AI images",
    "AI art generator no restrictions",
    "adult AI image generator",
    "unfiltered AI image generator",
    "no filter AI art generator",
    "NSFW AI art",
    "AI image generator NSFW",
    "uncensored AI art generator",
    "NSFW image generation",
    "AI nude generator",
    "unrestricted AI image",
  ],
  openGraph: {
    title: "NSFW AI Image Generator — Uncensored AI Art, No Filters",
    description:
      "Generate uncensored NSFW AI images with 7 unfiltered models. Flux Schnell, GPT Image, Imagen 4, Grok Imagine, and more. Free trial.",
    url: "https://bloomstudio.fun/nsfw/images",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NSFW AI Image Generator — Uncensored AI Art, No Filters",
    description:
      "Generate uncensored NSFW AI images with 7 unfiltered models. Flux Schnell, GPT Image, Imagen 4, Grok Imagine, and more.",
  },
};

// ============================================================================
// Data
// ============================================================================

const IMAGE_MODELS = [
  {
    name: "Flux Schnell",
    slug: "flux-schnell",
    provider: "Black Forest Labs",
    maxRes: "1024px",
    speed: "Ultra-fast" as const,
    ratios: 12,
    highlight: "Best for Speed",
    description:
      "Ultra-fast uncensored generation with strong prompt adherence. Ideal for rapid NSFW ideation and iteration.",
    unrestricted: true,
  },
  {
    name: "GPT Image 1.0",
    slug: "gpt-image",
    provider: "OpenAI",
    maxRes: "1536px",
    speed: "Medium" as const,
    ratios: 3,
    highlight: "Best for Detail",
    description:
      "High-fidelity NSFW images with precise detail control. Supports reference image editing for targeted adjustments.",
    unrestricted: false,
  },
  {
    name: "Imagen 4",
    slug: "imagen-4",
    provider: "Google",
    maxRes: "1792px",
    speed: "Medium" as const,
    ratios: 3,
    highlight: "Best for Photorealism",
    description:
      "Google's latest model delivering photorealistic NSFW renders with natural lighting and skin tones.",
    unrestricted: false,
  },
  {
    name: "Grok Imagine",
    slug: "grok-imagine",
    provider: "xAI",
    maxRes: "1792px",
    speed: "Medium" as const,
    ratios: 3,
    highlight: "Best for Art",
    description:
      "Creative, expressive NSFW art with a distinctive aesthetic style. Natively unrestricted by xAI.",
    unrestricted: true,
  },
  {
    name: "Z-Image Turbo",
    slug: "z-image-turbo",
    provider: "Alibaba",
    maxRes: "1920px",
    speed: "Fast" as const,
    ratios: 12,
    highlight: "Best for People",
    description:
      "Photorealistic people and figures with natural proportions. Natively unrestricted with HD output.",
    unrestricted: true,
  },
  {
    name: "FLUX.2 Klein 4B",
    slug: "flux-klein-4b",
    provider: "Black Forest Labs",
    maxRes: "2560px",
    speed: "Fast" as const,
    ratios: 12,
    highlight: "Best for Resolution",
    description:
      "Ultra-high-resolution NSFW images up to 4MP. Step-distilled for fast 4-step generation with sharp detail.",
    unrestricted: false,
  },
  {
    name: "FLUX.2 Klein 9B",
    slug: "flux-klein-9b",
    provider: "Black Forest Labs",
    maxRes: "1600px",
    speed: "Fast" as const,
    ratios: 12,
    highlight: "Best Quality/Speed",
    description:
      "Higher quality 9B parameter model with step-distilled 4-step inference. Great NSFW quality at speed.",
    unrestricted: false,
  },
];

const IMAGE_FEATURES = [
  {
    icon: Shield,
    title: "Zero Content Filters",
    description:
      "Every image model on Bloom Studio generates without content filters. No prompt blocks, no blurred outputs, no restrictions.",
  },
  {
    icon: Maximize,
    title: "Up to 4K Resolution",
    description:
      "Generate NSFW images at resolutions up to 2560px with FLUX.2 Klein. Photorealistic detail at every pixel.",
  },
  {
    icon: Layers,
    title: "12 Aspect Ratios",
    description:
      "Square, portrait, landscape, ultrawide — generate in any format for social media, wallpapers, or prints.",
  },
  {
    icon: Palette,
    title: "Style Variety",
    description:
      "From photorealistic to anime to oil-painting — each model has a distinctive visual style for NSFW content.",
  },
  {
    icon: Zap,
    title: "Instant Generation",
    description:
      "Flux Schnell and Z-Image Turbo deliver NSFW images in seconds. No waiting, no queues.",
  },
  {
    icon: ImageIcon,
    title: "Reference Image Editing",
    description:
      "Upload an existing image and apply AI-powered NSFW edits with GPT Image and FLUX.2 Klein models.",
  },
];

const HOW_TO_STEPS = [
  {
    step: 1,
    title: "Open Bloom Studio",
    description:
      "Sign up for a free 24-hour trial. No credit card required. Full access to every model.",
  },
  {
    step: 2,
    title: "Choose Your Model",
    description:
      "Select from 7 image models. Flux Schnell for speed, Imagen 4 for photorealism, or Grok Imagine for artistic flair.",
  },
  {
    step: 3,
    title: "Write Your Prompt",
    description:
      "Describe exactly what you want — no restrictions on content. Our prompt enhancement optimizes your input automatically.",
  },
  {
    step: 4,
    title: "Generate & Download",
    description:
      "Hit generate and download your NSFW image in full resolution. Iterate and refine until it's perfect.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Which AI image models support NSFW generation?",
    answer:
      "All 7 image models on Bloom Studio support uncensored NSFW generation: Flux Schnell, GPT Image 1.0, Imagen 4, Grok Imagine, Z-Image Turbo, FLUX.2 Klein 4B, and FLUX.2 Klein 9B. Flux Schnell, Grok Imagine, and Z-Image Turbo are natively unrestricted with no guardrails.",
  },
  {
    question: "What is the best AI model for NSFW images?",
    answer:
      "It depends on your goal. For speed, use Flux Schnell (generates in seconds). For photorealism, Imagen 4 delivers the most natural lighting and skin tones. For artistic/creative NSFW, Grok Imagine has a distinctive expressive style. For maximum resolution, FLUX.2 Klein 4B outputs up to 2560px.",
  },
  {
    question: "Can I generate NSFW images for free?",
    answer:
      "Yes. Bloom Studio offers a 24-hour free trial with full access to all NSFW image models. Generate unlimited uncensored images during your trial. After that, plans start at $3/month.",
  },
  {
    question: "What resolution can I generate NSFW images at?",
    answer:
      "Resolution varies by model. Flux Schnell outputs at 1024px, Imagen 4 and Grok Imagine at 1792px, Z-Image Turbo at 1920px, and FLUX.2 Klein 4B at up to 2560px (4MP). All models support multiple aspect ratios.",
  },
  {
    question: "Are my NSFW image generations private?",
    answer:
      "Yes. All generations are completely private. We do not review, moderate, or share your content. Your images are stored securely and belong to you alone.",
  },
  {
    question: "Can I use reference images for NSFW edits?",
    answer:
      "Yes. GPT Image 1.0, FLUX.2 Klein 4B, and FLUX.2 Klein 9B support reference image input. Upload an existing image and use AI-powered editing to apply NSFW transformations, style transfers, and adjustments.",
  },
  {
    question: "Do I own the NSFW images I generate?",
    answer:
      "Yes. You retain full commercial rights to all images you generate on Bloom Studio. Use them for personal projects, commercial work, or anything else.",
  },
];

// ============================================================================
// Page
// ============================================================================

export default function NSFWImagesPage() {
  return (
    <ModelPageShell>
      {/* Structured data: WebPage + BreadcrumbList */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "NSFW AI Image Generator — Uncensored AI Art",
          description:
            "Generate uncensored NSFW AI images with 7 unfiltered models. No restrictions, no filters.",
          url: "https://bloomstudio.fun/nsfw/images",
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
              {
                "@type": "ListItem",
                position: 3,
                name: "NSFW Image Generator",
                item: "https://bloomstudio.fun/nsfw/images",
              },
            ],
          },
        }}
      />
      {/* FAQPage as separate top-level entity */}
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
      {/* HowTo structured data for the how-to steps section */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to Generate NSFW AI Images",
          description:
            "Four simple steps to create uncensored AI images with any model on Bloom Studio.",
          step: HOW_TO_STEPS.map((s) => ({
            "@type": "HowToStep",
            position: s.step,
            name: s.title,
            text: s.description,
          })),
        }}
      />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
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
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-500/8 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
          aria-hidden="true"
        />

        {/* Glow Orbs */}
        <div
          className="absolute top-1/3 left-1/3 w-80 h-80 bg-rose-500/20 rounded-full blur-[128px] animate-pulse"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-violet-500/15 rounded-full blur-[128px] animate-pulse delay-1000"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Semantic Breadcrumb */}
            <NSFWBreadcrumb
              items={[
                { label: "NSFW Generator", href: "/nsfw" },
                { label: "Images" },
              ]}
              accent="rose"
            />

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-8">
              <ImageIcon className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-rose-300">
                7 Uncensored Image Models
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-brand text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[0.95]">
              <span className="bg-gradient-to-r from-rose-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                NSFW AI
              </span>
              <br />
              <span className="text-foreground">Image Generator</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              Generate uncensored AI images with no filters or restrictions.
              Photorealistic, artistic, or anything in between.
            </p>
            <p className="text-base text-muted-foreground/70 mb-10 max-w-xl mx-auto">
              7 models. Up to 4K resolution. 12 aspect ratios. Complete creative
              freedom with a 24-hour free trial.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/studio">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 border-0 group"
                >
                  Start Generating Images
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/nsfw/models">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-lg border-white/20 hover:bg-white/5"
                >
                  Compare All Models
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/5 to-transparent"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              Why Bloom Studio for NSFW Images?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The most powerful unfiltered AI image generation platform. No
              compromises on quality or freedom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {IMAGE_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "group p-7 rounded-2xl transition-all duration-300",
                  "bg-white/5 backdrop-blur-sm border border-white/10",
                  "hover:border-rose-500/30 hover:bg-white/[0.07]"
                )}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4">
                  <feature.icon className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model Comparison Table */}
      <section className="py-24 relative border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              NSFW Image Model Comparison
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Compare all 7 image models side-by-side. Find the best model for
              your NSFW generation needs.
            </p>
          </div>

          {/* Table - Desktop */}
          <div className="hidden lg:block max-w-6xl mx-auto">
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                      Model
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                      Provider
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">
                      Max Resolution
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">
                      Speed
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">
                      Aspect Ratios
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">
                      Unrestricted
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">
                      Best For
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {IMAGE_MODELS.map((model, i) => (
                    <tr
                      key={model.slug}
                      className={cn(
                        "border-b border-white/5 hover:bg-white/[0.03] transition-colors",
                        i === IMAGE_MODELS.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/models/${model.slug}/create`}
                          className="font-bold text-foreground hover:text-rose-400 transition-colors"
                        >
                          {model.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {model.provider}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-muted-foreground">
                        {model.maxRes}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <SpeedBadge speed={model.speed} />
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-muted-foreground">
                        {model.ratios}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {model.unrestricted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground/50">
                            via platform
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {model.highlight}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards - Mobile */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-5">
            {IMAGE_MODELS.map((model) => (
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
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {model.highlight}
                  </span>
                  {model.unrestricted && (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-rose-400 transition-colors">
                  {model.name}
                </h3>
                <p className="text-xs text-muted-foreground/60 mb-3">
                  {model.provider}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {model.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                  <span>{model.maxRes}</span>
                  <span>•</span>
                  <span>{model.speed}</span>
                  <span>•</span>
                  <span>{model.ratios} ratios</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How To Section — shared component + HowTo schema above */}
      <NSFWHowToSection
        title="How to Generate NSFW AI Images"
        subtitle="Four simple steps to create uncensored AI images with any model."
        steps={HOW_TO_STEPS}
        accent="rose-violet"
      />

      {/* FAQ Section — interactive disclosure */}
      <NSFWFaqSection title="NSFW Image Generation FAQ" items={FAQ_ITEMS} />

      {/* Final CTA — shared component */}
      <NSFWCtaSection
        headline="Start Creating NSFW Images"
        description="7 uncensored AI image models. Up to 4K resolution. No content filters. Free 24-hour trial, no credit card required."
        primaryHref="/studio"
        primaryLabel="Start Free Trial"
        secondaryHref="/nsfw"
        secondaryLabel="Back to NSFW Hub"
      />
    </ModelPageShell>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SpeedBadge({
  speed,
}: {
  speed: "Ultra-fast" | "Fast" | "Medium";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        speed === "Ultra-fast" &&
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        speed === "Fast" &&
          "bg-sky-500/10 text-sky-400 border border-sky-500/20",
        speed === "Medium" &&
          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
      )}
    >
      {speed}
    </span>
  );
}
