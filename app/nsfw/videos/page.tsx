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
  Video,
  Shield,
  Zap,
  Clock,
  Film,
  Upload,
  Monitor,
  CheckCircle,
} from "lucide-react";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title:
    "NSFW AI Video Generator — Uncensored AI Video, No Filters | Bloom Studio",
  description:
    "Generate uncensored NSFW AI videos with no filters. Compare Seedance and Grok Video for adult AI video generation. HD resolution, up to 10 seconds. Free trial.",
  alternates: {
    canonical: "/nsfw/videos",
  },
  keywords: [
    "NSFW AI video generator",
    "uncensored AI video",
    "AI video generator no filters",
    "adult AI video generator",
    "NSFW AI video",
    "unfiltered AI video generator",
    "AI video generator no restrictions",
    "NSFW video generation",
    "uncensored AI video generator",
    "AI adult video maker",
  ],
  openGraph: {
    title: "NSFW AI Video Generator — Uncensored AI Video, No Filters",
    description:
      "Generate uncensored NSFW AI videos with Seedance and Grok Video. HD resolution, up to 10 seconds. Free trial.",
    url: "https://bloomstudio.fun/nsfw/videos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NSFW AI Video Generator — Uncensored AI Video, No Filters",
    description:
      "Generate uncensored NSFW AI videos with Seedance and Grok Video. HD resolution, up to 10 seconds.",
  },
};

// ============================================================================
// Data
// ============================================================================

const VIDEO_MODELS = [
  {
    name: "Seedance",
    slug: "seedance",
    provider: "ByteDance",
    resolution: "1080p HD",
    duration: "2–10 seconds",
    speed: "Medium" as const,
    referenceImage: true,
    unrestricted: false,
    highlight: "Best for Cinematic",
    description:
      "Multi-shot NSFW video generation with smooth cinematic motion and physical realism. Strong prompt following for detailed scene control.",
  },
  {
    name: "Grok Video",
    slug: "grok-video",
    provider: "xAI",
    resolution: "1080p HD",
    duration: "1–10 seconds",
    speed: "Fast" as const,
    referenceImage: true,
    unrestricted: true,
    highlight: "Best for Speed",
    description:
      "Natively unrestricted video generation by xAI. Fast text and image-to-video generation with fixed resolution tiers up to 1080p.",
  },
];

const VIDEO_FEATURES = [
  {
    icon: Shield,
    title: "No Content Restrictions",
    description:
      "Both video models generate NSFW content without content filters, censorship, or blurring. Full creative freedom.",
  },
  {
    icon: Monitor,
    title: "HD 1080p Resolution",
    description:
      "Generate NSFW videos in full HD 1080p. Landscape (16:9) and portrait (9:16) orientations available.",
  },
  {
    icon: Clock,
    title: "Up to 10 Second Clips",
    description:
      "Generate videos from 1 to 10 seconds long. Perfect for short-form content, previews, and creative scenes.",
  },
  {
    icon: Film,
    title: "Cinematic Motion",
    description:
      "Smooth, natural motion with physical realism. Seedance excels at multi-shot coherent scenes with camera movement.",
  },
  {
    icon: Upload,
    title: "Image-to-Video",
    description:
      "Upload a reference image and animate it into an NSFW video. Both Seedance and Grok Video support image input.",
  },
  {
    icon: Zap,
    title: "Fast Generation",
    description:
      "Grok Video delivers quick results while Seedance focuses on cinematic quality. Choose speed or fidelity.",
  },
];

const HOW_TO_STEPS = [
  {
    step: 1,
    title: "Open Bloom Studio",
    description:
      "Sign up for a free 24-hour trial with full access to all video models. No credit card required.",
  },
  {
    step: 2,
    title: "Select a Video Model",
    description:
      "Choose Seedance for cinematic motion quality or Grok Video for fast, natively unrestricted generation.",
  },
  {
    step: 3,
    title: "Describe Your Scene",
    description:
      "Write a detailed prompt describing the action, environment, and mood. Optionally upload a reference image.",
  },
  {
    step: 4,
    title: "Set Duration & Generate",
    description:
      "Choose your clip length (1–10 seconds), aspect ratio (16:9 or 9:16), and hit generate. Download in full HD.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Which AI video models support NSFW content?",
    answer:
      "Bloom Studio offers 2 active video models for NSFW generation: Seedance by ByteDance and Grok Video by xAI. Grok Video is natively unrestricted with no guardrails. Both generate uncensored content without filters.",
  },
  {
    question: "What is the best AI model for NSFW videos?",
    answer:
      "For cinematic quality and smooth motion, Seedance is the best choice — it excels at multi-shot coherent scenes with physical realism. For fast generation with native unrestricted support, Grok Video by xAI delivers quicker results.",
  },
  {
    question: "How long can NSFW AI videos be?",
    answer:
      "Seedance generates videos from 2 to 10 seconds. Grok Video supports 1 to 10 seconds. Both models output in HD 1080p resolution in either landscape (16:9) or portrait (9:16) orientation.",
  },
  {
    question: "Can I generate NSFW videos from an image?",
    answer:
      "Yes. Both Seedance and Grok Video support reference image input (image-to-video). Upload a still image and the AI will animate it into an NSFW video based on your text prompt.",
  },
  {
    question: "Are NSFW videos generated privately?",
    answer:
      "Yes. All video generations are completely private. We do not review, moderate, or share your content. Your videos are securely stored and belong to you alone.",
  },
  {
    question: "Can I generate NSFW videos for free?",
    answer:
      "Yes. Bloom Studio offers a 24-hour free trial with full access to both video models. Generate uncensored NSFW videos without restrictions during your trial. Plans start at $3/month after.",
  },
  {
    question: "What resolution are NSFW AI videos?",
    answer:
      "Both Seedance and Grok Video generate at up to 1080p HD resolution. You can choose between landscape (1920×1080 for 16:9) and portrait (1080×1920 for 9:16) orientations.",
  },
];

// ============================================================================
// Page
// ============================================================================

export default function NSFWVideosPage() {
  return (
    <ModelPageShell>
      {/* Structured data: WebPage + BreadcrumbList */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "NSFW AI Video Generator — Uncensored AI Video",
          description:
            "Generate uncensored NSFW AI videos with Seedance and Grok Video. HD resolution, no filters.",
          url: "https://bloomstudio.fun/nsfw/videos",
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
                name: "NSFW Video Generator",
                item: "https://bloomstudio.fun/nsfw/videos",
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
      {/* HowTo structured data */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to Generate NSFW AI Videos",
          description:
            "Four steps to create uncensored AI videos in HD on Bloom Studio.",
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
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-rose-500/8 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* Grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
          aria-hidden="true"
        />

        {/* Glow Orbs */}
        <div
          className="absolute top-1/3 right-1/3 w-80 h-80 bg-violet-500/20 rounded-full blur-[128px] animate-pulse"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-rose-500/15 rounded-full blur-[128px] animate-pulse delay-1000"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Semantic Breadcrumb */}
            <NSFWBreadcrumb
              items={[
                { label: "NSFW Generator", href: "/nsfw" },
                { label: "Videos" },
              ]}
              accent="violet"
            />

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
              <Video className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">
                Uncensored AI Video Generation
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-brand text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[0.95]">
              <span className="bg-gradient-to-r from-violet-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                NSFW AI
              </span>
              <br />
              <span className="text-foreground">Video Generator</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              Create uncensored AI videos with cinematic motion and no content
              filters. HD resolution, up to 10 seconds.
            </p>
            <p className="text-base text-muted-foreground/70 mb-10 max-w-xl mx-auto">
              Seedance for cinematic quality. Grok Video for speed. Both
              unrestricted. Free 24-hour trial.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/studio">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg bg-gradient-to-r from-violet-500 to-rose-500 hover:from-violet-600 hover:to-rose-600 border-0 group"
                >
                  Start Generating Videos
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/nsfw/models">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-lg border-white/20 hover:bg-white/5"
                >
                  Compare Models
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video Model Showcase */}
      <section className="py-24 relative border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              NSFW Video Models
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Two powerful video models, both supporting uncensored NSFW
              generation. Compare and choose.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {VIDEO_MODELS.map((model) => (
              <Link
                key={model.slug}
                href={`/models/${model.slug}/create`}
                className={cn(
                  "group relative overflow-hidden rounded-3xl p-8 transition-all duration-500",
                  "bg-white/5 backdrop-blur-sm border border-white/10",
                  "hover:border-violet-500/30 hover:bg-white/[0.07]",
                  "hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/5"
                )}
              >
                {/* Highlight Badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {model.highlight}
                  </span>
                  {model.unrestricted && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      Natively Unrestricted
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-violet-400 transition-colors">
                  {model.name}
                </h3>
                <p className="text-sm text-muted-foreground/60 mb-4">
                  by {model.provider}
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {model.description}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-muted-foreground/60 mb-1">
                      Resolution
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {model.resolution}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-muted-foreground/60 mb-1">
                      Duration
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {model.duration}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-muted-foreground/60 mb-1">
                      Speed
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {model.speed}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-muted-foreground/60 mb-1">
                      Image-to-Video
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {model.referenceImage ? "Supported" : "Text only"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center text-violet-400 font-medium group-hover:text-violet-300">
                  Try {model.name}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent"
          aria-hidden="true"
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-brand mb-4">
              NSFW Video Generation Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need for uncensored AI video creation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {VIDEO_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "group p-7 rounded-2xl transition-all duration-300",
                  "bg-white/5 backdrop-blur-sm border border-white/10",
                  "hover:border-violet-500/30 hover:bg-white/[0.07]"
                )}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-4">
                  <feature.icon className="w-6 h-6 text-violet-400" />
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

      {/* How To Section — shared component + HowTo schema above */}
      <NSFWHowToSection
        title="How to Generate NSFW AI Videos"
        subtitle="Four steps to create uncensored AI videos in HD."
        steps={HOW_TO_STEPS}
        accent="violet-rose"
      />

      {/* FAQ Section — interactive disclosure */}
      <NSFWFaqSection title="NSFW Video Generation FAQ" items={FAQ_ITEMS} />

      {/* Final CTA — shared component */}
      <NSFWCtaSection
        headline="Create NSFW Videos Now"
        description="Cinematic AI video generation with no content filters. HD 1080p, up to 10 seconds. Free 24-hour trial."
        primaryHref="/studio"
        primaryLabel="Start Free Trial"
        secondaryHref="/nsfw"
        secondaryLabel="Back to NSFW Hub"
        accent="violet"
      />
    </ModelPageShell>
  );
}
