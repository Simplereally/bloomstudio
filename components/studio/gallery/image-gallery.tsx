"use client"

/**
 * ImageGallery - Grid of generated images with scroll and selection
 * Follows SRP: Only manages gallery grid display
 */

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { GeneratedImage } from "@/types/pollinations"
import { CheckSquare, ImageOff, Loader2, Square, Trash2 } from "lucide-react"
import * as React from "react"
import { GalleryThumbnail } from "./gallery-thumbnail"

export interface ImageGalleryProps {
    /** Array of generated images */
    images: GeneratedImage[]
    /** Currently active/selected image ID */
    activeImageId?: string
    /** Callback when an image is selected */
    onSelectImage?: (image: GeneratedImage) => void
    /** Callback when an image is removed */
    onRemoveImage?: (id: string) => void
    /** Callback to download an image */
    onDownloadImage?: (image: GeneratedImage) => void
    /** Callback to copy image URL */
    onCopyImageUrl?: (image: GeneratedImage) => void
    /** Whether bulk selection mode is enabled */
    selectionMode?: boolean
    /** Set of selected image IDs */
    selectedIds?: Set<string>
    /** Callback when selection changes */
    onSelectionChange?: (selectedIds: Set<string>) => void
    /** Callback to toggle selection mode */
    onToggleSelectionMode?: () => void
    /** Callback to delete selected images */
    onDeleteSelected?: () => void
    /** Layout direction */
    direction?: "horizontal" | "vertical"
    /** Thumbnail size */
    thumbnailSize?: "sm" | "md" | "lg"
    /** Additional class names */
    className?: string
    /** Callback to load more images */
    onLoadMore?: () => void
    /** Whether more images are being loaded */
    isLoadingMore?: boolean
}

export const ImageGallery = React.memo(function ImageGallery({
    images,
    activeImageId,
    onSelectImage,
    onRemoveImage,
    onDownloadImage,
    onCopyImageUrl,
    selectionMode = false,
    selectedIds = new Set(),
    onSelectionChange,
    onToggleSelectionMode,
    onDeleteSelected,
    direction = "vertical",
    thumbnailSize = "md",
    className,
    onLoadMore,
    isLoadingMore = false,
}: ImageGalleryProps) {
    const handleCheckedChange = (imageId: string, checked: boolean) => {
        const newSelection = new Set(selectedIds)
        if (checked) {
            newSelection.add(imageId)
        } else {
            newSelection.delete(imageId)
        }
        onSelectionChange?.(newSelection)
    }

    const selectAll = () => {
        onSelectionChange?.(new Set(images.map((img) => img.id)))
    }

    const deselectAll = () => {
        onSelectionChange?.(new Set())
    }

    if (images.length === 0) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center h-full",
                    "text-center p-6",
                    className
                )}
                data-testid="gallery-empty"
            >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                    <ImageOff className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No images yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Generated images will appear here
                </p>
            </div>
        )
    }

    return (
        <div
            className={cn("flex flex-col h-full", className)}
            data-testid="image-gallery"
        >
            {/* Header with selection controls */}
            <div className="flex items-center justify-between p-2 border-b border-border/50">
                <span className="text-xs font-medium text-muted-foreground">
                    History ({images.length})
                </span>
                <div className="flex items-center gap-1">
                    {selectionMode ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={selectedIds.size === images.length ? deselectAll : selectAll}
                                data-testid="select-all"
                            >
                                {selectedIds.size === images.length ? (
                                    <>
                                        <Square className="h-3 w-3 mr-1" />
                                        None
                                    </>
                                ) : (
                                    <>
                                        <CheckSquare className="h-3 w-3 mr-1" />
                                        All
                                    </>
                                )}
                            </Button>
                            {selectedIds.size > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={onDeleteSelected}
                                    data-testid="delete-selected"
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete ({selectedIds.size})
                                </Button>
                            )}
                        </>
                    ) : null}
                    {onToggleSelectionMode && (
                        <Button
                            variant={selectionMode ? "secondary" : "ghost"}
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={onToggleSelectionMode}
                            data-testid="toggle-selection"
                        >
                            {selectionMode ? "Done" : "Select"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Gallery Grid */}
            <ScrollArea className="flex-1" data-testid="gallery-scroll">
                <div
                    className={cn(
                        "p-2",
                        direction === "horizontal"
                            ? "flex gap-2 overflow-x-auto"
                            : "grid gap-2",
                        direction === "vertical" && {
                            "grid-cols-2": thumbnailSize === "lg",
                            "grid-cols-3": thumbnailSize === "md",
                            "grid-cols-4": thumbnailSize === "sm",
                        }
                    )}
                    data-testid="gallery-grid"
                >
                    {images.map((image) => (
                        <GalleryThumbnail
                            key={image.id}
                            image={image}
                            isActive={activeImageId === image.id}
                            isChecked={selectedIds.has(image.id)}
                            onClick={() => onSelectImage?.(image)}
                            onRemove={onRemoveImage ? () => onRemoveImage(image.id) : undefined}
                            onCopy={onCopyImageUrl ? () => onCopyImageUrl(image) : undefined}
                            onDownload={onDownloadImage ? () => onDownloadImage(image) : undefined}
                            onCheckedChange={(checked) => handleCheckedChange(image.id, checked)}
                            showCheckbox={selectionMode}
                            size={thumbnailSize}
                        />
                    ))}
                </div>

                {onLoadMore && (
                    <div className="p-4 flex justify-center border-t border-border/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onLoadMore}
                            disabled={isLoadingMore}
                            className="text-xs text-muted-foreground"
                        >
                            {isLoadingMore ? (
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            ) : null}
                            Load More
                        </Button>
                    </div>
                )}
            </ScrollArea>
        </div>
    )
})
