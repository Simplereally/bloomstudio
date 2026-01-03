"use client"

// Component following SRP - Only handles image display and gallery

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Copy, Trash2, Loader2, ZoomIn } from "lucide-react"
import type { GeneratedImage } from "@/types/pollinations"
import { Badge } from "@/components/ui/badge"
import { useImageDisplay } from "@/hooks/use-image-display"

interface ImageDisplayProps {
  images: GeneratedImage[]
  currentImage: GeneratedImage | null
  onRemove: (id: string) => void
  onSelect: (image: GeneratedImage) => void
  isGenerating: boolean
}

export function ImageDisplay({ images, currentImage, onRemove, onSelect, isGenerating }: ImageDisplayProps) {
  const {
    copiedUrl,
    isImageLoading,
    setIsImageLoading,
    handleDownload,
    handleCopyUrl,
  } = useImageDisplay(currentImage)

  return (
    <div className="space-y-6" data-testid="image-display">
      {/* Main Display */}
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur border-border/50" data-testid="main-display-card">
        <div
          className="bg-background/50 flex items-center justify-center max-h-[80vh]"
          style={{
            aspectRatio: currentImage
              ? `${currentImage.params.width || 1024} / ${currentImage.params.height || 1024}`
              : '1 / 1'
          }}
          data-testid="image-container"
        >
          {isGenerating || (currentImage && isImageLoading) ? (
            <div className="relative w-full h-full min-h-[400px] flex items-center justify-center overflow-hidden" data-testid="loading-state">
              {/* Dynamic Background Glows */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] animate-pulse-glow" />
                <div className="absolute w-[250px] h-[250px] bg-accent/10 rounded-full blur-[60px] animate-pulse-glow [animation-delay:1.5s]" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center">
                <div className="relative">
                  {/* Outer spinning ring */}
                  <div className="absolute -inset-4 border-2 border-dashed border-primary/30 rounded-full animate-[spin_10s_linear_infinite]" />

                  {/* Floating core */}
                  <div className="bg-background/80 backdrop-blur-xl p-6 rounded-3xl border border-primary/20 shadow-2xl animate-float">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>

                  {/* Particles / Dots */}
                  <div className="absolute -top-2 -right-2 h-4 w-4 bg-primary rounded-full animate-ping" />
                  <div className="absolute -bottom-1 -left-1 h-3 w-3 bg-accent rounded-full animate-ping [animation-delay:0.5s]" />
                </div>

                <div className="space-y-3 max-w-xs">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    {isGenerating ? "Creating Magic" : "Developing..."}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium animate-pulse">
                    {isGenerating
                      ? "Translating your imagination into pixels..."
                      : "Polishing your masterpiece..."}
                  </p>
                </div>
              </div>
            </div>
          ) : currentImage ? (
            <>
              <Image
                src={currentImage.url || "/placeholder.svg"}
                alt={currentImage.prompt}
                width={currentImage.params.width || 1024}
                height={currentImage.params.height || 1024}
                className="object-contain max-w-full max-h-full transition-opacity duration-500"
                onLoad={() => setIsImageLoading(false)}
                unoptimized
                data-testid="generated-image"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4" data-testid="image-info">
                <p className="text-sm text-white line-clamp-2 mb-2">{currentImage.prompt}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {currentImage.params.model || "zimage"}
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
            <div className="text-center space-y-2" data-testid="empty-state">
              <ZoomIn className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No image generated yet</p>
              <p className="text-xs text-muted-foreground">Configure parameters and click Generate</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {currentImage && !isGenerating && (
          <div className="absolute top-4 right-4 flex gap-2" data-testid="action-buttons">
            <Button size="icon" variant="secondary" onClick={() => handleDownload(currentImage)} title="Download image" data-testid="download-button">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" onClick={() => handleCopyUrl(currentImage.url)} title="Copy URL" data-testid="copy-button">
              <Copy className="h-4 w-4" />
            </Button>
            {copiedUrl === currentImage.url && (
              <span className="absolute -bottom-8 right-0 text-xs text-green-500" data-testid="copy-success">Copied!</span>
            )}
          </div>
        )}
      </Card>

      {/* Gallery */}
      {images.length > 0 && (
        <div className="space-y-3" data-testid="gallery">
          <h3 className="text-sm font-medium">Generation History</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {images.map((image) => (
              <Card
                key={image.id}
                className={`group relative aspect-square overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${currentImage?.id === image.id ? "ring-2 ring-primary" : ""
                  }`}
                onClick={() => onSelect(image)}
                data-testid={`gallery-item-${image.id}`}
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
                  data-testid={`remove-button-${image.id}`}
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

