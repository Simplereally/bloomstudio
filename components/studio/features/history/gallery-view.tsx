"use client"

/**
 * GalleryView - Pure presentational component for the image gallery
 * 
 * Wraps the PersistentImageGallery with styled container.
 * This is a thin wrapper that maintains the existing gallery functionality
 * while fitting into the new feature architecture.
 * 
 * Wrapped in React.memo for optimal performance.
 */

import { PersistentImageGallery } from "@/components/studio"
import type { ThumbnailData } from "@/components/studio/gallery/image-gallery"
import * as React from "react"

export interface GalleryViewProps {
    /** Currently active image ID (for highlighting) */
    activeImageId?: string
    /** Handle image selection (opens in canvas/lightbox) */
    onSelectImage?: (image: ThumbnailData) => void
    /** Thumbnail size */
    thumbnailSize?: "sm" | "md" | "lg"
}

export const GalleryView = React.memo(function GalleryView({
    activeImageId,
    onSelectImage,
    thumbnailSize = "md",
}: GalleryViewProps) {
    return (
        <div className="h-full bg-card/50 backdrop-blur-sm border-l border-border/50">
            <PersistentImageGallery
                activeImageId={activeImageId}
                onSelectImage={onSelectImage}
                thumbnailSize={thumbnailSize}
            />
        </div>
    )
})
