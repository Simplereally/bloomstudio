"use client"

import { Suspense, useState } from "react"
import { GenerationControls } from "@/components/image-generator/generation-controls"
import { ImageDisplay } from "@/components/image-generator/image-display"
import type { ImageGenerationParams, GeneratedImage } from "@/types/pollinations"
import { PollinationsAPI } from "@/lib/pollinations-api"
import { Sparkles } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"

// Loading skeleton for controls
function ControlsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

// Loading skeleton for display
function DisplaySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-96 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

export default function StudioPage() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async (params: ImageGenerationParams) => {
    setIsGenerating(true)

    const url = PollinationsAPI.buildImageUrl(params)
    const newImage: GeneratedImage = {
      id: Date.now().toString(),
      url,
      prompt: params.prompt,
      params,
      timestamp: Date.now(),
    }

    // Add a small delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setImages((prev) => [newImage, ...prev])
    setCurrentImage(newImage)
    setIsGenerating(false)
  }

  const handleRemove = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
    if (currentImage?.id === id) {
      setCurrentImage(images.find((img) => img.id !== id) || null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Pixelstream</h1>
                <p className="text-xs text-muted-foreground">Free AI Image Generation</p>
              </div>
            </div>
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
              <UserButton afterSignOutUrl="/" />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Panel - Controls */}
          <aside className="lg:sticky lg:top-20 h-fit">
            <Suspense fallback={<ControlsSkeleton />}>
              <GenerationControls onGenerate={handleGenerate} isGenerating={isGenerating} />
            </Suspense>
          </aside>

          {/* Right Panel - Display */}
          <section>
            <Suspense fallback={<DisplaySkeleton />}>
              <ImageDisplay
                images={images}
                currentImage={currentImage}
                onRemove={handleRemove}
                onSelect={setCurrentImage}
                isGenerating={isGenerating}
              />
            </Suspense>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground text-center">
            Powered by{" "}
            <a
              href="https://pollinations.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Pollinations.AI
            </a>{" "}
            • Free anonymous image generation
          </p>
        </div>
      </footer>
    </div>
  )
}
