"use client"

import { FeedTabs } from "@/components/gallery/feed-tabs"
import { PaginatedImageGrid } from "@/components/gallery/paginated-image-grid"
import { Button } from "@/components/ui/button"
import { useFeed } from "@/hooks/queries/use-image-history"
import type { FeedType } from "@/lib/feed-types"
import { ImageOffIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"

interface FeedClientProps {
    feedType: FeedType
}

/**
 * Client component for the feed page.
 * Uses useFeed hook for client-side reactivity and pagination.
 */
export function FeedClient({ feedType }: FeedClientProps) {
    const { results, status, loadMore } = useFeed(feedType)

    // Auto-load more if we got an empty page but aren't done
    // This is particularly useful for the following feed which can be sparse
    React.useEffect(() => {
        if (status === "CanLoadMore" && results.length === 0) {
            loadMore(20)
        }
    }, [status, results.length, loadMore])

    const emptyState = feedType === "public" ? (
        <PublicEmptyState />
    ) : (
        <FollowingEmptyState />
    )

    return (
        <div className="space-y-6">
            <FeedTabs activeType={feedType} />
            <PaginatedImageGrid
                images={results}
                status={status}
                loadMore={loadMore}
                emptyState={emptyState}
            />
        </div>
    )
}

function PublicEmptyState() {
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

function FollowingEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="bg-primary/5 rounded-full p-8 mb-6 border border-primary/10">
                <ImageOffIcon className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No posts yet</h3>
            <p className="text-muted-foreground max-w-sm">
                Follow creators to see their latest masterpieces here.
            </p>
            <div className="mt-8">
                <Link href="/feed/public">
                    <Button variant="outline" className="rounded-full px-8">
                        Browse Public Feed
                    </Button>
                </Link>
            </div>
        </div>
    )
}
