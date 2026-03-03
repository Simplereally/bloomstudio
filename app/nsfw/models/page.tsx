import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ModelPageShell } from "@/components/models/model-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { NSFWBreadcrumb } from "@/components/nsfw/nsfw-breadcrumb";
import { NSFWFaqSection } from "@/components/nsfw/nsfw-faq-section";
import { NSFWCtaSection } from "@/components/nsfw/nsfw-cta-section";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ImageIcon,
  Video,
  Sparkles,
  Zap,
  Crown,
  CheckCircle,
  Maximize,
  Shield,
} from "lucide-react";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title:
    "NSFW AI Models — Compare Uncensored AI Image & Video Models | Bloom Studio",
  description:
    "Compare all 8 NSFW-capable AI models side-by-side. Image models: Flux Schnell, GPT Image, Imagen 4, Grok Imagine, Z-Image Turbo, FLUX.2 Klein. Video: Grok Video. Find the best model for uncensored AI generation.",
  alternates: {
    canonical: "/nsfw/models",
  },
  keywords: [
    "NSFW AI models",
    "uncensored AI models",
    "best NSFW AI model",
    "NSFW AI model comparison",
    "AI image models no filter",
    "unrestricted AI models",
    "NSFW Flux",
    "NSFW GPT Image",
    "NSFW Grok",
    "uncensored image generation models",
    "adult AI models comparison",
  ],
  openGraph: {
    title: "NSFW AI Models — Compare Uncensored AI Models",
    description:
      "Compare all 8 NSFW-capable AI models side-by-side. Find the best model for uncensored image and video generation.",
    url: "https://bloomstudio.fun/nsfw/models",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NSFW AI Models — Compare Uncensored AI Models",
    description:
      "Compare all 8 NSFW-capable AI models. Find the best model for uncensored image and video generation.",
  },
};

// ============================================================================
// Data
// ============================================================================

interface NSFWModel {
  name: string;
  slug: string;
  type: "image" | "video";
  provider: string;
  maxRes: string;
  speed: "Ultra-fast" | "Fast" | "Medium";
  unrestricted: boolean;
  highlight: string;
  bestFor: string;
  description: string;
  ratios: number;
  refImage: boolean;
  negPrompt: boolean;
  /** Video-only fields */
  duration?: string;
  audio?: boolean;
}

const ALL_MODELS: NSFWModel[] = [
  // ── Image Models ──────────────────────────────────────────────────────
  {
    name: "Flux Schnell",
    slug: "flux-schnell",
    type: "image",
    provider: "Black Forest Labs",
    maxRes: "1024px",
    speed: "Ultra-fast",
    unrestricted: true,
    highlight: "Fastest NSFW Image Model",
    bestFor: "Speed & Iteration",
    description:
      "Ultra-fast uncensored generation with strong prompt adherence. Natively unrestricted — the go-to model for rapid NSFW ideation.",
    ratios: 12,
    refImage: false,
    negPrompt: true,
  },
  {
    name: "GPT Image 1.0",
    slug: "gpt-image",
    type: "image",
    provider: "OpenAI",
    maxRes: "1536px",
    speed: "Medium",
    unrestricted: false,
    highlight: "Best Detail & Editing",
    bestFor: "Precision & Editing",
    description:
      "High-fidelity NSFW images with precise detail and reference image editing. Upload an image and refine it with AI.",
    ratios: 3,
    refImage: true,
    negPrompt: false,
  },
  {
    name: "Imagen 4",
    slug: "imagen-4",
    type: "image",
    provider: "Google",
    maxRes: "1792px",
    speed: "Medium",
    unrestricted: false,
    highlight: "Most Photorealistic",
    bestFor: "Photorealism",
    description:
      "Google's latest image model delivering the most photorealistic NSFW renders with natural lighting and skin tones.",
    ratios: 3,
    refImage: false,
    negPrompt: false,
  },
  {
    name: "Grok Imagine",
    slug: "grok-imagine",
    type: "image",
    provider: "xAI",
    maxRes: "1792px",
    speed: "Medium",
    unrestricted: true,
    highlight: "Most Creative",
    bestFor: "Artistic NSFW",
    description:
      "Creative and expressive NSFW art with a distinctive aesthetic. Natively unrestricted by xAI with no content guardrails.",
    ratios: 3,
    refImage: false,
    negPrompt: false,
  },
  {
    name: "Z-Image Turbo",
    slug: "z-image-turbo",
    type: "image",
    provider: "Alibaba",
    maxRes: "1920px",
    speed: "Fast",
    unrestricted: true,
    highlight: "Best for People",
    bestFor: "Photorealistic People",
    description:
      "Photorealistic people and figures with natural proportions. Natively unrestricted with HD output up to 1920px.",
    ratios: 12,
    refImage: false,
    negPrompt: false,
  },
  {
    name: "FLUX.2 Klein 4B",
    slug: "flux-klein-4b",
    type: "image",
    provider: "Black Forest Labs",
    maxRes: "2560px",
    speed: "Fast",
    unrestricted: false,
    highlight: "Highest Resolution",
    bestFor: "Max Resolution",
    description:
      "Ultra-high-resolution NSFW images up to 4MP (2560px). Step-distilled 4-step generation with reference image support.",
    ratios: 12,
    refImage: true,
    negPrompt: false,
  },
  {
    name: "FLUX.2 Klein 9B",
    slug: "flux-klein-9b",
    type: "image",
    provider: "Black Forest Labs",
    maxRes: "1600px",
    speed: "Fast",
    unrestricted: false,
    highlight: "Quality × Speed",
    bestFor: "Quality at Speed",
    description:
      "Higher-quality 9B parameter model with 4-step generation. Great balance of NSFW quality and generation speed.",
    ratios: 12,
    refImage: true,
    negPrompt: false,
  },
  // ── Video Models ──────────────────────────────────────────────────────
  {
    name: "Grok Video",
    slug: "grok-video",
    type: "video",
    provider: "xAI",
    maxRes: "1080p",
    speed: "Fast",
    unrestricted: true,
    highlight: "Fastest NSFW Video",
    bestFor: "Fast Video",
    description:
      "Natively unrestricted video generation by xAI. Fast text and image-to-video with fixed resolution tiers up to 1080p.",
    ratios: 2,
    refImage: true,
    negPrompt: false,
    duration: "1–10s",
    audio: false,
  },
];

const RECOMMENDATIONS = [
  {
    icon: Zap,
    title: "Best for Speed",
    model: "Flux Schnell",
    slug: "flux-schnell",
    type: "image" as const,
    reason:
      "Ultra-fast generation in seconds. Natively unrestricted. Perfect for rapid NSFW iteration and exploration.",
  },
  {
    icon: Crown,
    title: "Best for Photorealism",
    model: "Imagen 4",
    slug: "imagen-4",
    type: "image" as const,
    reason:
      "The most photorealistic NSFW output. Natural lighting, skin tones, and fine detail. Google's latest model.",
  },
  {
    icon: Maximize,
    title: "Best for Resolution",
    model: "FLUX.2 Klein 4B",
    slug: "flux-klein-4b",
    type: "image" as const,
    reason:
      "Up to 2560px / 4MP output. The highest resolution available for NSFW image generation on any platform.",
  },
  {
    icon: Sparkles,
    title: "Best for Art",
    model: "Grok Imagine",
    slug: "grok-imagine",
    type: "image" as const,
    reason:
      "Creative, expressive NSFW art with a distinctive style. Natively unrestricted by xAI — no guardrails.",
  },
  {
    icon: Video,
    title: "Best NSFW Video",
    model: "Grok Video",
    slug: "grok-video",
    type: "video" as const,
    reason:
      "Natively unrestricted by xAI. Fast video generation with image-to-video support. The best NSFW video model available.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Which NSFW AI models are natively unrestricted?",
    answer:
      "Four models are natively unrestricted (built without content guardrails): Flux Schnell, Grok Imagine, Z-Image Turbo, and Grok Video. The remaining models are uncensored at the platform level on Bloom Studio — all 8 models generate NSFW content without filters.",
  },
  {
    question:
      "What's the difference between 'natively unrestricted' and 'uncensored via platform'?",
    answer:
      "Natively unrestricted models (Flux Schnell, Grok Imagine, Z-Image Turbo, Grok Video) were built by their creators without content filters. Other models are uncensored at the Bloom Studio platform level. The result is the same: all models generate NSFW content. Natively unrestricted models may produce more consistent results for explicit content.",
  },
  {
    question: "Which model should I use for NSFW image generation?",
    answer:
      "It depends on your priority. Flux Schnell for speed (seconds per image). Imagen 4 for photorealism. Grok Imagine for artistic/creative styles. Z-Image Turbo for realistic people. FLUX.2 Klein 4B for maximum resolution (2560px). GPT Image for reference-based editing.",
  },
  {
    question: "Which model should I use for NSFW video generation?",
    answer:
      "Grok Video by xAI is the primary NSFW video model. It offers fast generation with native unrestricted support, image-to-video capability, and outputs at 1080p HD.",
  },
  {
    question: "Can I try all NSFW models for free?",
    answer:
      "Yes. Bloom Studio's 24-hour free trial gives you full access to all 8 models — both image and video. No credit card required. After the trial, plans start at $3/month.",
  },
  {
    question: "How many aspect ratios do NSFW models support?",
    answer:
      "Image models support up to 12 aspect ratios: square (1:1), landscape (16:9, 3:2, 4:3, 5:4), portrait (9:16, 2:3, 3:4, 4:5), and ultrawide (21:9, 9:21), plus custom dimensions on select models. Video models support 2 ratios: landscape (16:9) and portrait (9:16).",
  },
];

// ============================================================================
// Page
// ============================================================================

export default function NSFWModelsPage() {
  const imageModels = ALL_MODELS.filter((m) => m.type === "image");
  const videoModels = ALL_MODELS.filter((m) => m.type === "video");

  return (
    <ModelPageShell>
      {/* Structured data: WebPage + BreadcrumbList */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "NSFW AI Models — Compare Uncensored AI Models",
          description:
            "Compare all 8 NSFW-capable AI models side-by-side for uncensored image and video generation.",
          url: "https://bloomstudio.fun/nsfw/models",
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
                name: "NSFW Models",
                item: "https://bloomstudio.fun/nsfw/models",
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

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-36 pb-16 overflow-hidden">
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
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-500/8 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
          aria-hidden="true"
        />

        {/* Glow */}
        <div
          className="absolute top-1/4 left-1/4 w-80 h-80 bg-rose-500/15 rounded-full blur-[128px]"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-500/15 rounded-full blur-[128px]"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            {/* Semantic Breadcrumb */}
            <NSFWBreadcrumb
              items={[
                { label: "NSFW Generator", href: "/nsfw" },
                { label: "Models" },
              ]}
              accent="rose"
            />

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-rose-300">
                8 Uncensored Models
              </span>
            </div>

            <h1 className="font-brand text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 leading-[1.1]">
              <span className="bg-gradient-to-r from-rose-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                NSFW AI Models
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl leading-relaxed">
              Compare every uncensored AI model side-by-side. Find the perfect
              model for your NSFW generation needs.
            </p>
            <p className="text-base text-muted-foreground/70 mb-8 max-w-xl">
              7 image models + 1 video model. 4 natively unrestricted. All
              available in your free trial.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/studio">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600 border-0 group"
                >
                  Try All Models Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/nsfw/images">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-white/20 hover:bg-white/5"
                >
                  <ImageIcon className="mr-2 w-5 h-5" />
                  Image Models
                </Button>
              </Link>
              <Link href="/nsfw/videos">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-white/20 hover:bg-white/5"
                >
                  <Video className="mr-2 w-5 h-5" />
                  Video Models
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/5 to-transparent"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              Best NSFW Model For&hellip;
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quick recommendations based on your use case.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {RECOMMENDATIONS.map((rec) => (
              <Link
                key={rec.slug}
                href={`/models/${rec.slug}/create`}
                className={cn(
                  "group p-7 rounded-2xl transition-all duration-300",
                  "bg-white/5 backdrop-blur-sm border border-white/10",
                  "hover:border-rose-500/30 hover:bg-white/[0.07]",
                  "hover:-translate-y-0.5"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <rec.icon className="w-5 h-5 text-rose-400" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border",
                      rec.type === "video"
                        ? "text-violet-400 border-violet-400/20 bg-violet-400/10"
                        : "text-rose-400 border-rose-400/20 bg-rose-400/10"
                    )}
                  >
                    {rec.type === "video" ? (
                      <Video className="w-3 h-3" />
                    ) : (
                      <ImageIcon className="w-3 h-3" />
                    )}
                    {rec.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider font-medium mb-1">
                  {rec.title}
                </p>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-rose-400 transition-colors">
                  {rec.model}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rec.reason}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Image Models Table */}
      <section className="py-24 relative border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <ImageIcon className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-brand">
                Image Models ({imageModels.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                Full comparison of all NSFW image generation models
              </p>
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left px-5 py-4 text-sm font-semibold text-foreground">
                      Model
                    </th>
                    <th className="text-left px-5 py-4 text-sm font-semibold text-foreground">
                      Provider
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Max Res
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Speed
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Ratios
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Ref Image
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Neg. Prompt
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Unrestricted
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Best For
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {imageModels.map((model, i) => (
                    <tr
                      key={model.slug}
                      className={cn(
                        "border-b border-white/5 hover:bg-white/[0.03] transition-colors",
                        i === imageModels.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/models/${model.slug}/create`}
                          className="font-bold text-foreground hover:text-rose-400 transition-colors"
                        >
                          {model.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {model.provider}
                      </td>
                      <td className="px-5 py-4 text-sm text-center text-muted-foreground">
                        {model.maxRes}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <SpeedBadge speed={model.speed} />
                      </td>
                      <td className="px-5 py-4 text-sm text-center text-muted-foreground">
                        {model.ratios}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <BooleanCell value={model.refImage} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <BooleanCell value={model.negPrompt} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        {model.unrestricted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground/50">
                            via platform
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
                          {model.bestFor}
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
            {imageModels.map((model) => (
              <ModelCard key={model.slug} model={model} accent="rose" />
            ))}
          </div>
        </div>
      </section>

      {/* Video Models Table */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Video className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-brand">
                Video Models ({videoModels.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                Full comparison of all NSFW video generation models
              </p>
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left px-5 py-4 text-sm font-semibold text-foreground">
                      Model
                    </th>
                    <th className="text-left px-5 py-4 text-sm font-semibold text-foreground">
                      Provider
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Resolution
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Duration
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Speed
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Image-to-Video
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Unrestricted
                    </th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-foreground">
                      Best For
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {videoModels.map((model, i) => (
                    <tr
                      key={model.slug}
                      className={cn(
                        "border-b border-white/5 hover:bg-white/[0.03] transition-colors",
                        i === videoModels.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/models/${model.slug}/create`}
                          className="font-bold text-foreground hover:text-violet-400 transition-colors"
                        >
                          {model.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {model.provider}
                      </td>
                      <td className="px-5 py-4 text-sm text-center text-muted-foreground">
                        {model.maxRes}
                      </td>
                      <td className="px-5 py-4 text-sm text-center text-muted-foreground">
                        {model.duration}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <SpeedBadge speed={model.speed} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <BooleanCell value={model.refImage} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        {model.unrestricted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-xs text-muted-foreground/50">
                            via platform
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 whitespace-nowrap">
                          {model.bestFor}
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
            {videoModels.map((model) => (
              <ModelCard key={model.slug} model={model} accent="violet" />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section — interactive disclosure */}
      <NSFWFaqSection title="NSFW AI Models FAQ" items={FAQ_ITEMS} />

      {/* Final CTA — shared component */}
      <NSFWCtaSection
        headline="Try Every Model Free"
        description="8 uncensored AI models. 7 for images, 1 for video. Full access with a 24-hour free trial. No credit card required."
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

function SpeedBadge({ speed }: { speed: "Ultra-fast" | "Fast" | "Medium" }) {
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

function BooleanCell({ value }: { value: boolean }) {
  if (value) {
    return <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />;
  }
  return <span className="text-xs text-muted-foreground/30">—</span>;
}

function ModelCard({
  model,
  accent,
}: {
  model: NSFWModel;
  accent: "rose" | "violet";
}) {
  return (
    <Link
      href={`/models/${model.slug}/create`}
      className={cn(
        "group p-6 rounded-2xl transition-all duration-300",
        "bg-white/5 backdrop-blur-sm border border-white/10",
        "hover:-translate-y-0.5",
        // Use static classes — dynamic interpolation won't work with Tailwind JIT
        accent === "rose"
          ? "hover:border-rose-500/30 hover:bg-white/[0.07]"
          : "hover:border-violet-500/30 hover:bg-white/[0.07]"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium border",
            accent === "rose"
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : "bg-violet-500/10 text-violet-400 border-violet-500/20"
          )}
        >
          {model.bestFor}
        </span>
        {model.unrestricted && (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        )}
      </div>
      <h3
        className={cn(
          "text-lg font-bold text-foreground mb-1 transition-colors",
          accent === "rose"
            ? "group-hover:text-rose-400"
            : "group-hover:text-violet-400"
        )}
      >
        {model.name}
      </h3>
      <p className="text-xs text-muted-foreground/60 mb-3">{model.provider}</p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {model.description}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/60">
        <span>{model.maxRes}</span>
        <span>•</span>
        <span>{model.speed}</span>
        <span>•</span>
        <span>{model.ratios} ratios</span>
        {model.duration ? (
          <>
            <span>•</span>
            <span>{model.duration}</span>
          </>
        ) : null}
      </div>
    </Link>
  );
}
