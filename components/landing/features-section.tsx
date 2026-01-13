import { Image as ImageIcon, Layers, Lock, MousePointer2, Palette, Video, Wand2, Zap } from "lucide-react"
import Link from "next/link"
import { FeatureCard } from "./feature-card"
import { ScrollReveal } from "./scroll-reveal"

export function FeaturesSection() {
  return (
    /**
     * Responsive Layout Strategy:
     * - Mobile to 2xl: Standard vertical padding creates natural section breaks
     * - 3xl+ (1440p and above): Section fills full viewport height (minus header)
     *   with content vertically centered to prevent next section from "leaking"
     *   into view when navigating via anchor links
     */
    <section id="features" className="py-24 xl:py-28 2xl:py-32 3xl:py-40 4xl:py-48 5xl:py-56 3xl:min-h-[calc(100vh-4rem)] 4xl:min-h-[calc(100vh-4rem)] 5xl:min-h-[calc(100vh-4rem)] 3xl:flex 3xl:flex-col 3xl:justify-center relative">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16 3xl:mb-20 4xl:mb-24">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Everything you need to create
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No token anxiety. No confusing tiers. Just powerful tools that work.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 3xl:gap-8 4xl:gap-10 max-w-6xl 3xl:max-w-7xl mx-auto">
          <ScrollReveal delay={100}>
            <FeatureCard
              icon={Layers}
              title="10+ AI Models"
              description="Access GPT-4 Image, Flux Kontext, Seedream 4.5, NanoBanana Pro, and more. All models included in every plan."
            />
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Generate images in seconds with optimized infrastructure. No waiting, no queues, just instant creativity."
            />
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <FeatureCard
              icon={ImageIcon}
              title="High Resolution"
              description="Up to 4096×4096 pixels with Z-Image Turbo. Create print-ready artwork and detailed visuals."
            />
          </ScrollReveal>
          <ScrollReveal delay={400}>
            <FeatureCard
              icon={Video}
              title="AI Video"
              description="Transform still images into dynamic videos with Veo 3.1 and Seedance. Motion is the future."
            />
          </ScrollReveal>
          <ScrollReveal delay={500}>
            <FeatureCard
              icon={Palette}
              title="Flexible Dimensions"
              description="Square, portrait, landscape, ultrawide — any aspect ratio you need for any platform."
            />
          </ScrollReveal>
          <ScrollReveal delay={600}>
            <FeatureCard
              icon={Lock}
              title="Private by Default"
              description="Your generations are yours alone. No public galleries, no training on your images."
            />
          </ScrollReveal>
        </div>

        {/* Interactive demo hint */}
        <ScrollReveal delay={700}>
          <div className="mt-16 3xl:mt-24 4xl:mt-32 text-center">
            <Link 
              href="/studio"
              className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl glass-effect-home hover:bg-white/10 transition-colors group cursor-pointer border border-white/10 hover:border-primary/50"
            >
              <MousePointer2 className="h-5 w-5 text-primary animate-bounce group-hover:scale-110 transition-transform" />
              <span className="text-foreground/90">
                <span className="font-semibold text-primary">Try it now</span>
              </span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
