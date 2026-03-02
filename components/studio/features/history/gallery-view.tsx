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
import type { PaginatedGalleryResult } from "@/components/studio/gallery/types"
import * as React from "react"

export interface GalleryViewProps {
    /** Currently active image ID (for highlighting) */
    activeImageId?: string
    /** Handle image selection (opens in canvas/lightbox) */
    onSelectImage?: (image: ThumbnailData) => void
    /** Thumbnail size */
    thumbnailSize?: "sm" | "md" | "lg"
    /** Server-cached initial page (reduces Convex bandwidth on initial load) */
    initialPage?: PaginatedGalleryResult
    /** Callback fired whenever the gallery's stable image list changes */
    onImagesLoaded?: (images: ThumbnailData[]) => void
}

export const GalleryView = React.memo(function GalleryView({
    activeImageId,
    onSelectImage,
    thumbnailSize = "md",
    initialPage,
    onImagesLoaded,
}: GalleryViewProps) {
    return (
        <div className="h-full min-h-0 flex flex-col bg-card/50 backdrop-blur-sm border-l border-border/50">
            <PersistentImageGallery
                activeImageId={activeImageId}
                onSelectImage={onSelectImage}
                thumbnailSize={thumbnailSize}
                initialPage={initialPage}
                onImagesLoaded={onImagesLoaded}
            />
        </div>
    )
})
