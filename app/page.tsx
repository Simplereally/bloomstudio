"use client"

// Main page component following SOC - Orchestrates child components

import { useState } from "react"
import { GenerationControls } from "@/components/image-generator/generation-controls"
import { ImageDisplay } from "@/components/image-generator/image-display"
import type { ImageGenerationParams, GeneratedImage } from "@/types/pollinations"
import { PollinationsAPI } from "@/lib/pollinations-api"
import { Sparkles } from "lucide-react"

export default function Home() {
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Pollinations Studio</h1>
              <p className="text-xs text-muted-foreground">Free AI Image Generation</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* Left Panel - Controls */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <GenerationControls onGenerate={handleGenerate} isGenerating={isGenerating} />
          </aside>

          {/* Right Panel - Display */}
          <section>
            <ImageDisplay
              images={images}
              currentImage={currentImage}
              onRemove={handleRemove}
              onSelect={setCurrentImage}
              isGenerating={isGenerating}
            />
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
