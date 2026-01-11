"use client"

/**
 * CanvasFeature - Feature component that composes canvas logic with UI
 * 
 * This component:
 * 1. Receives current image and generation state from parent context
 * 2. Handles image actions (download, copy, regenerate)
 * 3. Integrates with lightbox for fullscreen view
 * 
 * It acts as the "glue" between logic and presentation, forming an isolated
 * vertical feature unit.
 */

import { useDownloadImage } from "@/hooks/queries"
import { showErrorToast } from "@/lib/errors"
import type { GeneratedImage } from "@/types/pollinations"
import { CanvasView } from "./canvas-view"
import * as React from "react"

export interface CanvasFeatureProps {
    /** Current image to display */
    currentImage: GeneratedImage | null
    /** Whether generation is in progress */
    isGenerating?: boolean
    /** Callback to open lightbox with image */
    onOpenLightbox?: (image: GeneratedImage | null) => void
    /** Callback to regenerate current image */
    onRegenerate?: () => void
}

import { useIsFavorited, useToggleFavorite } from "@/hooks/queries/use-favorites"
import type { Id } from "@/convex/_generated/dataModel"

/**
 * CanvasFeature component - composes hook logic with view
 * 
 * @example
 * ```tsx
 * <CanvasFeature 
 *     currentImage={currentImage}
 *     isGenerating={isGenerating}
 *     onOpenLightbox={openLightbox}
 *     onRegenerate={handleRegenerate}
 * />
 * ```
 */
export function CanvasFeature({ 
    currentImage,
    isGenerating = false,
    onOpenLightbox,
    onRegenerate,
}: CanvasFeatureProps) {
    // Download functionality
    const { download } = useDownloadImage({
        onError: (error) => {
            showErrorToast(error)
        },
    })

    // Favorites functionality
    const isFavorited = useIsFavorited(currentImage?.id)
    const toggleFavoriteMutation = useToggleFavorite()

    const handleToggleFavorite = React.useCallback(async () => {
        if (!currentImage) return
        
        try {
            await toggleFavoriteMutation.mutateAsync({ 
                imageId: currentImage.id as Id<"generatedImages"> 
            })
        } catch (error) {
            console.error("Failed to toggle favorite:", error)
            showErrorToast(error instanceof Error ? error : new Error("Failed to toggle favorite"))
        }
    }, [currentImage, toggleFavoriteMutation])

    // Handle download action
    const handleDownload = React.useCallback(() => {
        if (currentImage) {
            download({
                url: currentImage.url,
                filename: `bloomstudio-${currentImage.id}.jpg`,
            })
        }
    }, [currentImage, download])

    // Handle copy URL action
    const handleCopyUrl = React.useCallback(async () => {
        if (currentImage) {
            await navigator.clipboard.writeText(currentImage.url)
        }
    }, [currentImage])

    // Handle open in new tab
    const handleOpenInNewTab = React.useCallback(() => {
        if (currentImage) {
            window.open(currentImage.url, "_blank")
        }
    }, [currentImage])

    // Handle image click (opens lightbox)
    const handleImageClick = React.useCallback(() => {
        onOpenLightbox?.(currentImage)
    }, [currentImage, onOpenLightbox])

    // Handle fullscreen toggle
    const handleFullscreen = React.useCallback(() => {
        onOpenLightbox?.(currentImage)
    }, [currentImage, onOpenLightbox])

    return (
        <CanvasView
            image={currentImage}
            isGenerating={isGenerating}
            onImageClick={handleImageClick}
            onDownload={handleDownload}
            onCopyUrl={handleCopyUrl}
            onRegenerate={onRegenerate}
            onOpenInNewTab={handleOpenInNewTab}
            onFullscreen={handleFullscreen}
            isFavorited={isFavorited}
            onToggleFavorite={handleToggleFavorite}
        />
    )
}
