"use client"

/**
 * GalleryFeature - Feature component that composes gallery logic with UI
 * 
 * This component:
 * 1. Receives handlers from parent for image actions
 * 2. Renders the GalleryView with all necessary props
 * 
 * The PersistentImageGallery manages bulk actions (delete, visibility changes)
 * internally via the selection mode and actions dropdown.
 */

import type { ThumbnailData } from "@/components/studio/gallery/image-gallery"
import type { PaginatedGalleryResult } from "@/components/studio/gallery/types"
import { GalleryView } from "./gallery-view"

export interface GalleryFeatureProps {
    /** Currently active image ID (for highlighting) */
    activeImageId?: string
    /** Handle image selection (opens lightbox) */
    onSelectImage?: (image: ThumbnailData) => void
    /** Thumbnail size */
    thumbnailSize?: "sm" | "md" | "lg"
    /** Server-cached initial page (reduces Convex bandwidth on initial load) */
    initialPage?: PaginatedGalleryResult
    /** Callback fired whenever the gallery's stable image list changes */
    onImagesLoaded?: (images: ThumbnailData[]) => void
    /** Registers a stable load-more callback for parent-driven prefetching */
    onLoadMoreReady?: (loadMore: (() => Promise<void>) | null) => void
}

/**
 * GalleryFeature component - composes hook logic with view
 * 
 * @example
 * ```tsx
 * <GalleryFeature 
 *     activeImageId={currentImage?.id}
 *     onSelectImage={handleSelectGalleryImage}
 *     initialPage={serverCachedPage}
 * />
 * ```
 */
export function GalleryFeature({
    activeImageId,
    onSelectImage,
    thumbnailSize = "md",
    initialPage,
    onImagesLoaded,
    onLoadMoreReady,
}: GalleryFeatureProps) {
    return (
        <GalleryView
            activeImageId={activeImageId}
            onSelectImage={onSelectImage}
            thumbnailSize={thumbnailSize}
            initialPage={initialPage}
            onImagesLoaded={onImagesLoaded}
            onLoadMoreReady={onLoadMoreReady}
        />
    )
}
