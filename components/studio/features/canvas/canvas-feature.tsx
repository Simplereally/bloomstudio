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
import { useIsFavorited, useToggleFavorite } from "@/hooks/queries/use-favorites"
import { showErrorToast } from "@/lib/errors"
import type { Id } from "@/convex/_generated/dataModel"
import type { GeneratedImage } from "@/types/pollinations"
import type { QueueItem } from "@/components/studio/canvas/image-canvas"
import { CanvasView } from "./canvas-view"
import * as React from "react"

export interface CanvasFeatureProps {
    /** Current image to display */
    currentImage: GeneratedImage | null
    /** Whether generation is in progress */
    isGenerating?: boolean
    /** Structured queue items for per-generation cards */
    queueItems?: QueueItem[]
    /** Callback to cancel a specific generation by ID */
    onCancelItem?: (id: string) => void

    /** Callback to open lightbox with image */
    onOpenLightbox?: (image: GeneratedImage | null) => void
    /** Callback to regenerate current image */
    onRegenerate?: () => void
    /** Generation progress percentage (0-100) */
    progress?: number
}

function isGeneratedImagesId(id: string): id is Id<"generatedImages"> {
    return !id.startsWith("img_")
}

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
    queueItems = [],
    onCancelItem,

    onOpenLightbox,
    onRegenerate,
    progress,
}: CanvasFeatureProps) {
    // Download functionality
    const { download } = useDownloadImage({
        onError: (error) => {
            showErrorToast(error)
        },
    })

    // Favorites functionality
    const convexImageId = currentImage?._id
    const isFavorited = useIsFavorited(convexImageId ?? currentImage?.id)
    const toggleFavoriteMutation = useToggleFavorite()

    const handleToggleFavorite = React.useCallback(async () => {
        if (!convexImageId || !isGeneratedImagesId(convexImageId)) return

        try {
            await toggleFavoriteMutation.mutateAsync({
                imageId: convexImageId,
            })
        } catch (error) {
            console.error("Failed to toggle favorite:", error)
            showErrorToast(error instanceof Error ? error : new Error("Failed to toggle favorite"))
        }
    }, [convexImageId, toggleFavoriteMutation])

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

    // Handle image click (opens lightbox)
    const handleImageClick = React.useCallback(() => {
        onOpenLightbox?.(currentImage)
    }, [currentImage, onOpenLightbox])

    return (
        <CanvasView
            image={currentImage}
            isGenerating={isGenerating}
            queueItems={queueItems}
            onCancelItem={onCancelItem}

            onImageClick={handleImageClick}
            onDownload={handleDownload}
            onCopyUrl={handleCopyUrl}
            onRegenerate={onRegenerate}
            isFavorited={isFavorited}
            onToggleFavorite={handleToggleFavorite}
            progress={progress}
        />
    )
}
