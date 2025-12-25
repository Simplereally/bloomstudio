"use client"

import { usePublicFeed } from "@/hooks/queries/use-image-history"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { Loader2, Share2, Heart } from "lucide-react"

/**
 * Component to display the community feed of public AI-generated images.
 * Supports infinite scrolling with a "Load More" button.
 */
export function CommunityFeed() {
    const { results, status, loadMore } = usePublicFeed()

    const isLoading = status === "LoadingFirstPage"
    const isLoadingMore = status === "LoadingMore"

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square rounded-2xl animate-pulse bg-muted" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4 animate-pulse bg-muted" />
                            <Skeleton className="h-3 w-1/2 animate-pulse bg-muted opacity-50" />
                        </div>
                    </div>
                ))}
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
        <div className="space-y-12 p-4 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {results.map((image) => (
                    <div
                        key={image._id}
                        className="group flex flex-col space-y-4 rounded-3xl p-3 bg-card/40 backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer hover:border-primary/20"
                    >
                        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-inner">
                            <Image
                                src={image.url}
                                alt={image.prompt || "Generated image"}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md">
                                        <Heart className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="px-1 space-y-2">
                            <p className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                {image.prompt}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded-full font-mono">
                                    {image.model}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60">
                                    {new Date(image.createdAt || image._creationTime).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {status === "CanLoadMore" && (
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
        </div>
    )
}

import Link from "next/link"
