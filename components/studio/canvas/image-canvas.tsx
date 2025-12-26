"use client"

/**
 * ImageCanvas - Main image display area with loading and empty states
 * Follows SRP: Only manages image display and visual states
 */

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { GeneratedImage } from "@/types/pollinations"
import { ImagePlus, Loader2, Sparkles } from "lucide-react"
import * as React from "react"

export interface ImageCanvasProps {
    /** Current image to display */
    image: GeneratedImage | null
    /** Whether image is being generated */
    isGenerating?: boolean
    /** Progress percentage (0-100) for generation */
    progress?: number
    /** Callback when image is clicked */
    onImageClick?: () => void
    /** Additional class names */
    className?: string
}

export const ImageCanvas = React.memo(function ImageCanvas({
    image,
    isGenerating = false,
    progress,
    onImageClick,
    className,
}: ImageCanvasProps) {
    const [imageLoaded, setImageLoaded] = React.useState(false)
    const [imageError, setImageError] = React.useState(false)
    // Store the actual natural dimensions of the loaded image
    const [naturalDimensions, setNaturalDimensions] = React.useState<{
        width: number
        height: number
    } | null>(null)

    // Reset loading state when image changes
    React.useEffect(() => {
        setImageLoaded(false)
        setImageError(false)
        setNaturalDimensions(null)
    }, [image?.url])

    // Fallback dimensions for loading state (from params, but may not be accurate)
    const expectedWidth = image?.params.width || 1024
    const expectedHeight = image?.params.height || 1024

    // Handle image load - capture the actual natural dimensions
    const handleImageLoad = React.useCallback(
        (event: React.SyntheticEvent<HTMLImageElement>) => {
            const img = event.currentTarget
            setNaturalDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
            })
            setImageLoaded(true)
        },
        []
    )

    return (
        <Card
            className={cn(
                "relative overflow-hidden flex flex-col h-full max-h-full",
                "bg-gradient-to-br from-card/80 to-card/40",
                "backdrop-blur-sm border-border/50",
                className
            )}
            data-testid="image-canvas"
        >
            <div
                className={cn(
                    "relative w-full flex-1 flex items-center justify-center min-h-0",
                    "bg-gradient-to-br from-background/80 to-background/40",
                    "min-h-[300px]"
                )}
                data-testid="canvas-container"
            >
                {/* Loading State */}
                {isGenerating && (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
                        style={{ aspectRatio: `${expectedWidth} / ${expectedHeight}` }}
                        data-testid="loading-state"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 backdrop-blur-sm">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-foreground">
                                Generating your image...
                            </p>
                            {typeof progress === "number" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {Math.round(progress)}% complete
                                </p>
                            )}
                        </div>
                        {/* Animated background particles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full bg-primary/30 animate-float"
                                    style={{
                                        left: `${20 + i * 12}%`,
                                        top: `${30 + (i % 3) * 20}%`,
                                        animationDuration: `${2 + i * 0.5}s`,
                                        animationDelay: `${i * 0.2}s`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Image Display */}
                {image && !isGenerating && (
                    <div
                        className={cn(
                            "relative flex items-center justify-center",
                            "w-full h-full",
                            onImageClick && "cursor-pointer"
                        )}
                        onClick={() => onImageClick?.()}
                        data-testid="image-wrapper"
                    >
                        {/* 
                          Standard img element displays at natural size.
                          Only scales down if container is smaller than the image.
                        */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={image.url}
                            alt={image.prompt}
                            className={cn(
                                "transition-opacity duration-300",
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                width: "auto",
                                height: "auto",
                            }}
                            onLoad={handleImageLoad}
                            onError={() => setImageError(true)}
                            data-testid="generated-image"
                        />

                        {/* Image loading placeholder */}
                        {!imageLoaded && !imageError && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {/* Error state */}
                        {imageError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <p className="text-sm text-destructive">Failed to load image</p>
                                <p className="text-xs text-muted-foreground">
                                    Please try generating again
                                </p>
                            </div>
                        )}

                        {/* Debug: Show natural dimensions in development */}
                        {process.env.NODE_ENV === "development" && naturalDimensions && (
                            <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                                {naturalDimensions.width}×{naturalDimensions.height}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!image && !isGenerating && (
                    <div
                        className="flex flex-col items-center justify-center gap-4 p-8"
                        data-testid="empty-state"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 blur-xl" />
                            <div
                                className={cn(
                                    "relative flex items-center justify-center",
                                    "w-24 h-24 rounded-2xl",
                                    "bg-gradient-to-br from-primary/5 to-accent/5",
                                    "border border-border/50 backdrop-blur-sm"
                                )}
                            >
                                <ImagePlus className="h-10 w-10 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="text-center max-w-xs">
                            <p className="text-base font-medium text-foreground">
                                Create something amazing
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Enter a prompt and click Generate to create your first image
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span>Powered by AI</span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
})

