"use client"

import { Image as ImageIcon, Layers, Lock, MousePointer2, Palette, Video, Wand2, Zap } from "lucide-react"
import Link from "next/link"
import { FeatureCard } from "./feature-card"
import { ScrollReveal } from "./scroll-reveal"

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Everything you need to create
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No token anxiety. No confusing tiers. Just powerful tools that work.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
          <div className="mt-16 text-center">
            <Link 
              href="/studio"
              className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl glass-effect-home hover:bg-white/10 transition-colors group cursor-pointer border border-white/10 hover:border-primary/50"
            >
              <MousePointer2 className="h-5 w-5 text-primary animate-bounce group-hover:scale-110 transition-transform" />
              <span className="text-foreground/90">
                <span className="font-semibold text-primary">Try it now</span> — No account needed for your first image
              </span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
