"use client"

import { useImageHistory } from "@/hooks/queries/use-image-history"
import { ImageGallery, type ImageGalleryProps } from "./image-gallery"
import { Loader2 } from "lucide-react"

/**
 * Smart component that fetches persistent image history from Convex
 * and displays it using the ImageGallery presentational component.
 */
export function PersistentImageGallery(props: Omit<ImageGalleryProps, "images">) {
    const { results, status, loadMore } = useImageHistory()

    // Convert Convex results to the format expected by ImageGallery if needed
    // Actually our GeneratedImage schema is now compatible

    const isLoading = status === "LoadingFirstPage"
    const isLoadingMore = status === "LoadingMore"

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Map Convex documents to the frontend format if necessary
    const mappedImages = results.map(img => ({
        ...img,
        id: img._id, // Map _id to id for component compatibility
        params: img.generationParams || {}, // Map generationParams to params
        timestamp: img.createdAt || img._creationTime,
    }))

    return (
        <ImageGallery
            {...props}
            images={mappedImages as any}
            onLoadMore={status === "CanLoadMore" ? () => loadMore(20) : undefined}
            isLoadingMore={isLoadingMore}
        />
    )
}
