"use client"

import { useImageHistory } from "@/hooks/queries/use-image-history"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { useDeleteGeneratedImage } from "@/hooks/mutations/use-delete-image"
import { DeleteImageDialog } from "@/components/studio/delete-image-dialog"
import { VisibilityToggle } from "@/components/gallery/visibility-toggle"

/**
 * Component to display the user's generated image history.
 * Supports infinite scrolling with a "Load More" button.
 */
export function ImageHistory() {
    const { results, status, loadMore } = useImageHistory()
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

    if (results.length === 0) {
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
                                    {image.model}
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
