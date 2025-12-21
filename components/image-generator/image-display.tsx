"use client"

// Component following SRP - Only handles image display and gallery

import { useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Copy, Trash2, Loader2, ZoomIn } from "lucide-react"
import type { GeneratedImage } from "@/types/pollinations"
import { Badge } from "@/components/ui/badge"

interface ImageDisplayProps {
  images: GeneratedImage[]
  currentImage: GeneratedImage | null
  onRemove: (id: string) => void
  onSelect: (image: GeneratedImage) => void
  isGenerating: boolean
}

export function ImageDisplay({ images, currentImage, onRemove, onSelect, isGenerating }: ImageDisplayProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pollinations-${image.id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Download error:", error)
    }
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error("[v0] Copy error:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Display */}
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur border-border/50">
        <div className="aspect-square bg-background/50 flex items-center justify-center">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your image...</p>
            </div>
          ) : currentImage ? (
            <>
              <Image
                src={currentImage.url || "/placeholder.svg"}
                alt={currentImage.prompt}
                width={currentImage.params.width || 1024}
                height={currentImage.params.height || 1024}
                className="object-contain w-full h-full"
                unoptimized
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-sm text-white line-clamp-2 mb-2">{currentImage.prompt}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {currentImage.params.model || "flux"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {currentImage.params.width}×{currentImage.params.height}
                  </Badge>
                  {currentImage.params.seed && currentImage.params.seed !== -1 && (
                    <Badge variant="secondary" className="text-xs">
                      Seed: {currentImage.params.seed}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center space-y-2">
              <ZoomIn className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No image generated yet</p>
              <p className="text-xs text-muted-foreground">Configure parameters and click Generate</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {currentImage && !isGenerating && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button size="icon" variant="secondary" onClick={() => handleDownload(currentImage)} title="Download image">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" onClick={() => handleCopyUrl(currentImage.url)} title="Copy URL">
              <Copy className="h-4 w-4" />
            </Button>
            {copiedUrl === currentImage.url && (
              <span className="absolute -bottom-8 right-0 text-xs text-green-500">Copied!</span>
            )}
          </div>
        )}
      </Card>

      {/* Gallery */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Generation History</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {images.map((image) => (
              <Card
                key={image.id}
                className={`group relative aspect-square overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                  currentImage?.id === image.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => onSelect(image)}
              >
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt={image.prompt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                  unoptimized
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(image.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
