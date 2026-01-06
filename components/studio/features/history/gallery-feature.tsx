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
import { GalleryView } from "./gallery-view"

export interface GalleryFeatureProps {
    /** Currently active image ID (for highlighting) */
    activeImageId?: string
    /** Handle image selection (opens lightbox) */
    onSelectImage?: (image: ThumbnailData) => void
    /** Thumbnail size */
    thumbnailSize?: "sm" | "md" | "lg"
}

/**
 * Render a gallery UI by forwarding gallery-related props to GalleryView.
 *
 * Renders the GalleryView component with the provided active image, selection callback, and thumbnail size.
 *
 * @param activeImageId - ID of the currently active/highlighted image, if any
 * @param onSelectImage - Callback invoked with the selected thumbnail's data when a thumbnail is chosen
 * @param thumbnailSize - Size of thumbnails to display ("sm", "md", or "lg")
 * @returns The gallery view element
 */
export function GalleryFeature({
    activeImageId,
    onSelectImage,
    thumbnailSize = "md",
}: GalleryFeatureProps) {
    return (
        <GalleryView
            activeImageId={activeImageId}
            onSelectImage={onSelectImage}
            thumbnailSize={thumbnailSize}
        />
    )
}