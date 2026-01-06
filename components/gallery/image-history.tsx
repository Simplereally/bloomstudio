"use client"

import { VisibilityToggle } from "@/components/gallery/visibility-toggle"
import { DeleteImageDialog } from "@/components/studio/delete-image-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeleteGeneratedImage } from "@/hooks/mutations/use-delete-image"
import { useImageHistoryWithDisplayData } from "@/hooks/queries/use-image-history"
import { getModelDisplayName } from "@/lib/config/models"
import { Loader2 } from "lucide-react"
import Image from "next/image"

/**
 * Render the user's generated image history as a responsive grid with controls for visibility, deletion, and pagination.
 *
 * Displays skeleton placeholders while the first page is loading, an empty state when there are no images, and a grid of image cards otherwise. Each card shows the prompt and model name and provides a visibility toggle and delete action. When additional pages are available, a "Load More" button is shown to fetch more items.
 *
 * @returns The React element representing the image history UI
 */
export function ImageHistory() {
    const { results, status, loadMore } = useImageHistoryWithDisplayData()
    const deleteMutation = useDeleteGeneratedImage()

    const isLoading = status === "LoadingFirstPage"
    const isLoadingMore = status === "LoadingMore"

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg animate-pulse bg-muted" />
                ))}
            </div>
        )
    }

    const isExhausted = status === "Exhausted"

    if (results.length === 0 && isExhausted) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="bg-muted rounded-full p-6 mb-4">
                    <Image
                        src="/logo.png"
                        alt="No images"
                        width={48}
                        height={48}
                        className="opacity-20 grayscale"
                    />
                </div>
                <h3 className="text-xl font-semibold mb-2">No generations yet</h3>
                <p className="text-muted-foreground max-w-xs">
                    Your generated images will appear here once you start creating.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((image) => (
                    <div
                        key={image._id}
                        className="relative aspect-square rounded-xl overflow-hidden group bg-muted border border-border/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
                    >
                        <Image
                            src={image.url}
                            alt={image.prompt || "Generated image"}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                            <p className="text-white text-xs font-medium line-clamp-2 leading-relaxed mb-2">
                                {image.prompt}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-white/60 font-mono truncate">
                                    {getModelDisplayName(image.model) || image.model}
                                </span>
                                <div className="flex items-center gap-1">
                                    <VisibilityToggle
                                        imageId={image._id}
                                        currentVisibility={image.visibility}
                                    />
                                    <DeleteImageDialog
                                        onConfirm={async () => {
                                            await deleteMutation.mutateAsync(image._id)
                                        }}
                                        isDeleting={deleteMutation.isPending}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {status === "CanLoadMore" && (
                <div className="flex justify-center pb-8 border-t border-border/50 pt-8">
                    <Button
                        variant="secondary"
                        onClick={() => loadMore(20)}
                        disabled={isLoadingMore}
                        className="px-8"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More"
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}