"use client"

/**
 * BatchImageGrid - Grid display for batch generated images
 * Shows images in a responsive grid with max 4 per row
 */

import type { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import Image from "next/image"
import * as React from "react"

export interface BatchImageGridProps {
    /** Array of generated images */
    images: Doc<"generatedImages">[]
    /** Total count for the batch (for showing placeholders) */
    totalCount: number
    /** Number of completed images */
    completedCount: number
    /** Whether the batch is still processing */
    isProcessing: boolean
    /** Callback when an image is clicked */
    onImageClick?: (image: Doc<"generatedImages">) => void
    /** Additional class names */
    className?: string
}

export const BatchImageGrid = React.memo(function BatchImageGrid({
    images,
    totalCount,
    completedCount,
    isProcessing,
    onImageClick,
    className,
}: BatchImageGridProps) {
    const pendingCount = totalCount - completedCount
    const pendingSlots = isProcessing ? Math.min(pendingCount, 8) : 0 // Show up to 8 pending placeholders

    return (
        <div className={cn("w-full h-full overflow-auto p-4", className)} data-testid="batch-image-grid">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {/* Completed images */}
                {images.map((image) => (
                    <button
                        key={image._id}
                        onClick={() => onImageClick?.(image)}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                        data-testid={`batch-image-${image._id}`}
                    >
                        <Image
                            src={image.url}
                            alt={image.prompt}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            className="object-cover"
                        />
                    </button>
                ))}

                {/* Pending placeholders */}
                {Array.from({ length: pendingSlots }).map((_, i) => (
                    <div
                        key={`pending-${i}`}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted/50 border border-border/50"
                        data-testid={`batch-pending-${i}`}
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                            <span className="text-xs text-muted-foreground">
                                {i === 0 ? "Generating..." : `+${pendingCount - i}`}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {images.length === 0 && !isProcessing && (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No images generated yet
                </div>
            )}
        </div>
    )
})
