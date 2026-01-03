"use client"

/**
 * GalleryFeature - Feature component that composes gallery logic with UI
 * 
 * This component:
 * 1. Receives handlers from parent for image actions
 * 2. Manages gallery-specific callbacks
 * 3. Renders the GalleryView with all necessary props
 * 
 * The PersistentImageGallery already has internal state management for
 * selection and filtering, so this feature is relatively thin.
 */

import { useDownloadImage } from "@/hooks/queries"
import { showErrorToast } from "@/lib/errors"
import type { GeneratedImage } from "@/types/pollinations"
import { GalleryView } from "./gallery-view"
import * as React from "react"

export interface GalleryFeatureProps {
    /** Currently active image ID (for highlighting) */
    activeImageId?: string
    /** Handle image selection (opens lightbox) */
    onSelectImage?: (image: GeneratedImage) => void
    /** Handle image removal */
    onRemoveImage?: (id: string) => Promise<void>
    /** Thumbnail size */
    thumbnailSize?: "sm" | "md" | "lg"
}

/**
 * GalleryFeature component - composes hook logic with view
 * 
 * @example
 * ```tsx
 * <GalleryFeature 
 *     activeImageId={currentImage?.id}
 *     onSelectImage={handleSelectGalleryImage}
 *     onRemoveImage={handleRemoveImage}
 * />
 * ```
 */
export function GalleryFeature({ 
    activeImageId,
    onSelectImage,
    onRemoveImage,
    thumbnailSize = "md",
}: GalleryFeatureProps) {
    // Download functionality
    const { download } = useDownloadImage({
        onError: (error) => {
            showErrorToast(error)
        },
    })

    // Handle download action
    const handleDownloadImage = React.useCallback((image: GeneratedImage) => {
        download({
            url: image.url,
            filename: `bloomstudio-${image.id}.jpg`,
        })
    }, [download])

    // Handle copy URL action
    const handleCopyImageUrl = React.useCallback(async (image: GeneratedImage) => {
        await navigator.clipboard.writeText(image.url)
    }, [])

    return (
        <GalleryView
            activeImageId={activeImageId}
            onSelectImage={onSelectImage}
            onRemoveImage={onRemoveImage}
            onDownloadImage={handleDownloadImage}
            onCopyImageUrl={handleCopyImageUrl}
            thumbnailSize={thumbnailSize}
        />
    )
}
