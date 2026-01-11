"use client"

/**
 * CanvasView - Pure presentational component for the image canvas area
 * 
 * Renders the main canvas area including:
 * - Image display (or placeholder)
 * - Generation loading state
 * - Floating toolbar with actions
 * - Image metadata display
 * 
 * This is a "leaf" component - it receives all data via props and has no internal logic.
 * Wrapped in React.memo for optimal performance.
 */

import {
    ImageCanvas,
    ImageMetadata,
    ImageToolbar,
} from "@/components/studio"
import type { GeneratedImage } from "@/types/pollinations"
import * as React from "react"

export interface CanvasViewProps {
    /** Current image to display */
    image: GeneratedImage | null
    /** Whether generation is in progress */
    isGenerating?: boolean
    /** Handle image click (for fullscreen) */
    onImageClick?: () => void
    /** Handle download */
    onDownload?: () => void
    /** Handle copy URL */
    onCopyUrl?: () => void
    /** Handle regenerate */
    onRegenerate?: () => void
    /** Handle open in new tab */
    onOpenInNewTab?: () => void
    /** Handle fullscreen toggle */
    onFullscreen?: () => void
    /** Whether image is favorited */
    isFavorited?: boolean
    /** Handle favorite toggle */
    onToggleFavorite?: () => void
}

export const CanvasView = React.memo(function CanvasView({
    image,
    isGenerating = false,
    onImageClick,
    onDownload,
    onCopyUrl,
    onRegenerate,
    onOpenInNewTab,
    onFullscreen,
    isFavorited,
    onToggleFavorite,
}: CanvasViewProps) {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 relative p-4 overflow-hidden">
                <ImageCanvas
                    image={image}
                    isGenerating={isGenerating}
                    onImageClick={onImageClick}
                    className="h-full"
                >
                    <ImageToolbar
                        image={image}
                        onDownload={onDownload}
                        onCopyUrl={onCopyUrl}
                        onRegenerate={onRegenerate}
                        onOpenInNewTab={onOpenInNewTab}
                        onFullscreen={onFullscreen}
                        isFavorited={isFavorited}
                        onToggleFavorite={onToggleFavorite}
                    />
                </ImageCanvas>
            </div>
            {image && !isGenerating && (
                <ImageMetadata
                    image={image}
                    variant="compact"
                />
            )}
        </div>
    )
})
