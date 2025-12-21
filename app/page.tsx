"use client"

import { Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Wand2, Palette, Sliders } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Leva } from "leva"

const GL = dynamic(() => import("@/components/gl/gl").then((mod) => ({ default: mod.GL })), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Loading experience...</div>
    </div>
  ),
})

export default function LandingPage() {
  const [hovering, setHovering] = useState(false)

  return (
    <div className="flex flex-col h-svh justify-between relative overflow-hidden">
      <Leva hidden />

      {/* GL Background */}
      <div className="absolute inset-0 z-0">
        <Suspense
          fallback={
            <div className="absolute inset-0 bg-background flex items-center justify-center">
              <div className="text-muted-foreground">Initializing...</div>
            </div>
          }
        >
          <GL hovering={hovering} />
        </Suspense>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/30">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Pixelstream</span>
          </div>
          <Link href="/sign-in">
            <Button variant="ghost" className="text-foreground hover:bg-white/10 backdrop-blur-sm">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 pb-16 mt-auto text-center px-6">
        <Badge className="mb-6 px-4 py-2 bg-primary/15 backdrop-blur-sm border-primary/30 text-primary hover:bg-primary/20">
          <Wand2 className="h-3.5 w-3.5 mr-1.5" />
          FREE AI IMAGE GENERATION
        </Badge>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground mb-6">
          Create stunning images <br />
          <i className="font-light bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            with AI power
          </i>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground text-balance mt-8 max-w-[540px] mx-auto leading-relaxed">
          Professional AI image generation with complete control over every parameter. Six models, unlimited
          generations, zero cost.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Link className="contents" href="/studio">
            <Button
              size="lg"
              className="group px-8 h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link className="contents" href="/sign-up">
            <Button
              size="lg"
              variant="outline"
              className="px-8 h-12 text-base bg-background/20 backdrop-blur-sm border-border text-foreground hover:bg-background/40"
            >
              Sign Up Free
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm text-foreground">6 AI Models</div>
              <div className="text-xs text-muted-foreground">Flux, Anime, 3D & more</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm text-foreground">Unlimited Use</div>
              <div className="text-xs text-muted-foreground">Generate without limits</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sliders className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm text-foreground">Full Control</div>
              <div className="text-xs text-muted-foreground">Customize every detail</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6">
        <div className="container mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://pollinations.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Pollinations.AI
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
