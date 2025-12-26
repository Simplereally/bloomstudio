"use client"

import { Button } from "@/components/ui/button"
import { ImageCard, type ImageCardData } from "@/components/ui/image-card"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { MasonryGrid } from "@/components/ui/masonry-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { usePublicFeed } from "@/hooks/queries/use-image-history"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

/**
 * Component to display the community feed of public AI-generated images.
 * Uses a masonry grid layout similar to Leonardo AI and Kling.
 * Supports infinite scrolling with a "Load More" button.
 */
export function CommunityFeed() {
    const { results, status, loadMore } = usePublicFeed()
    const [selectedImage, setSelectedImage] = useState<ImageCardData | null>(null)

    const isLoading = status === "LoadingFirstPage"
    const isLoadingMore = status === "LoadingMore"

    if (isLoading) {
        return (
            <div className="px-1 md:px-2 max-w-[2400px] mx-auto">
                <MasonryGrid minColumnWidth={260} gap={4}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="rounded-lg animate-pulse bg-muted"
                            style={{
                                // Random aspect ratios for skeleton loading
                                aspectRatio: [1, 0.75, 1.33, 0.56, 1.78][i % 5],
                            }}
                        />
                    ))}
                </MasonryGrid>
            </div>
        )
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                <div className="bg-primary/5 rounded-full p-8 mb-6 border border-primary/10">
                    <Loader2 className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Feed is quiet...</h3>
                <p className="text-muted-foreground max-w-sm">
                    No public images found. Be the first to share one of your creations with the community!
                </p>
                <Link href="/studio">
                    <Button className="mt-8 rounded-full px-8">
                        Go to Studio
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-12 px-1 md:px-2 max-w-[2400px] mx-auto">
            <MasonryGrid minColumnWidth={360} gap={4}>
                {results.map((image) => (
                    <ImageCard
                        key={image._id}
                        image={image as ImageCardData}
                        showUser={true}
                        onClick={() => setSelectedImage(image as ImageCardData)}
                    />
                ))}
            </MasonryGrid>

            {(status === "CanLoadMore" || status === "LoadingMore") && (
                <div className="flex justify-center pb-12">
                    <Button
                        variant="outline"
                        onClick={() => loadMore(20)}
                        disabled={isLoadingMore}
                        className="rounded-full px-12 h-12 text-base font-medium border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                Discovering...
                            </>
                        ) : (
                            "Explore More"
                        )}
                    </Button>
                </div>
            )}

            <ImageLightbox
                image={selectedImage}
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
            />
        </div>
    )
}
