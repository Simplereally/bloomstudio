"use client"

import { ClerkUserButton } from "@/components/clerk-user-button"
import { Button } from "@/components/ui/button"
import { MODEL_REGISTRY } from "@/lib/config/models"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Leva } from "leva"
import { ArrowRight, InfoIcon, Palette, Sliders, Sparkles } from "lucide-react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { Suspense, useState } from "react"

const GL = dynamic(() => import("@/components/gl/gl").then((mod) => ({ default: mod.GL })), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-svh justify-between relative overflow-hidden">
    </div>
  ),
})

export default function LandingPage() {
  const [hovering, setHovering] = useState(false)
  const { isSignedIn, isLoaded } = useUser()

  return (
    <div className="dark">
      {/* Override body background to allow backdrop-filter to see WebGL canvas */}
      <style>{`body { background: transparent !important; }`}</style>
      <div className="flex flex-col h-svh justify-between relative overflow-hidden">
        <Leva hidden />

        {/* GL Background */}
        <div className="absolute">
          <Suspense
            fallback={
              <div className="absolute bg-background flex items-center justify-center">
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
            <div className="flex items-center gap-6">
              <span className="text-3xl font-bold text-primary font-brand tracking-tight -skew-x-10">Bloom Studio</span>
              <Link href="/pricing">
                <Button variant="ghost" size="sm" className="text-foreground/80 hover:text-foreground hover:bg-white/10">
                  Pricing
                </Button>
              </Link>
            </div>
            {isLoaded && (
              isSignedIn ? (
                <div className="flex items-center gap-4">
                  <Link href="/studio">
                    <Button variant="ghost" className="text-foreground hover:bg-white/50 glass-effect-home group">
                      Go to Studio
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <ClerkUserButton />
                </div>
              ) : (
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-foreground hover:bg-white/50 glass-effect-home">
                    Sign in
                  </Button>
                </Link>
              )
            )}
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 pb-16 my-auto text-center px-6">

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground mb-6">
            Create stunning images <br />
            <i className="text-primary inline-block pb-2 px-2 tracking-tight">
              cheaply
            </i>
          </h1>

          <p className="mt-10 max-w-[450px] mx-auto leading-relaxed px-8 py-4 rounded-3xl glass-effect-home text-base sm:text-lg text-balance">
            <span className="text-foreground/95 font-medium font-brand [text-shadow:1px_1px_0_#000,1px_2px_0_#000,0_3px_4px_rgba(0,0,0,0.4)]">
              Professional AI image generation with NanoBanana, GPT, Seedream & more.
            </span>
          </p>

          {/* Featured Models */}
          <div className="mt-10 max-w-4xl mx-auto px-4 overflow-hidden">
            <div className="flex flex-wrap justify-center gap-3">
              {Object.values(MODEL_REGISTRY)
                .filter((m) => m.type === "image")
                .map((model) => {
                  const isMonochrome = model.logo?.includes("openai.svg") || model.logo?.includes("flux.svg")
                  return (
                    <div
                      key={model.id}
                      className="group flex items-center gap-2.5 p-2 px-4 rounded-2xl glass-effect-home border border-white/5 hover:border-primary/40 transition-all duration-300 hover:bg-white/5 hover:-translate-y-0.5"
                    >
                      {model.logo ? (
                        <div className="relative w-5 h-5">
                          <Image
                            src={model.logo}
                            alt={`${model.displayName} logo`}
                            fill
                            className={cn(
                              "object-contain transition-all duration-300 opacity-70 group-hover:opacity-100",
                              isMonochrome && "dark:invert"
                            )}
                          />
                        </div>
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100" />
                      )}
                      <span className="text-sm font-bold font-brand text-foreground group-hover:text-foreground transition-colors uppercase">
                        {model.displayName}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link className="contents" href="/pricing">
              <Button
                size="lg"
                variant="default"
                className="group px-8 h-12 text-base hover:bg-primary/90"
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
              >
                Wait, how cheap?
                <InfoIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link className="contents" href="/studio">
              <Button
                size="lg"
                variant="default"
                className="group px-8 h-12 text-base hover:bg-primary/90"
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
              >
                Start Creating
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {!isSignedIn && (
              <Link className="contents" href="/sign-up">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 h-12 text-base glass-effect-home text-foreground hover:bg-white/[0.05] transition-all"
                >
                  Sign Up Free
                </Button>
              </Link>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-lg glass-effect-home">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-foreground font-brand">10 Image Models</div>
                <div className="text-xs text-muted-foreground">NanoBanana, GPT, Seedream & more</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg glass-effect-home">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-foreground font-brand">Generous Limits</div>
                <div className="text-xs text-muted-foreground">eg 140 GPT uses daily!</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg glass-effect-home">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sliders className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-foreground font-brand">Dimension Control</div>
                <div className="text-xs text-muted-foreground">Create logos, banners, or any image size you need</div>
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
    </div>
  )
}
