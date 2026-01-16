"use client"

import { FeedTabs } from "@/components/gallery/feed-tabs"
import { PaginatedImageGrid } from "@/components/gallery/paginated-image-grid"
import { Button } from "@/components/ui/button"
import { loadPublicFeedPage, loadFollowingFeedPage } from "@/app/_server/actions/feed"
import { trackFeedView } from "@/lib/analytics"
import type { FeedType } from "@/lib/feed-types"
import { useAuth } from "@clerk/nextjs"
import { ImageOffIcon, ScanSearch } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"

// Type for the paginated result from Convex/cached query
type PaginatedFeedResult = Awaited<ReturnType<typeof loadPublicFeedPage>>

interface FeedClientProps {
    feedType: FeedType
    /** Server-provided initial page (from cache) */
    initialPage?: PaginatedFeedResult
    /** Initial user preference (from server) */
    initialPreference?: "block" | "blur" | "allow"
}

/**
 * Client component for the feed page.
 * 
 * Both PUBLIC and FOLLOWING feeds now use server-side caching:
 * - PUBLIC feed: Shared cache across all users
 * - FOLLOWING feed: Per-user cache keyed by userId
 * 
 * Uses server-provided initial page + server actions for "load more" pagination.
 */
export function FeedClient({ feedType, initialPage, initialPreference }: FeedClientProps) {
    const { isSignedIn, isLoaded } = useAuth()

    // State for cached feed data (works for both public and following)
    const [items, setItems] = React.useState(() => initialPage?.page ?? [])
    const [cursor, setCursor] = React.useState(() => initialPage?.continueCursor ?? null)
    const [isDone, setIsDone] = React.useState(() => initialPage?.isDone ?? false)
    const [isLoadingMore, setIsLoadingMore] = React.useState(false)
    
    // Get real-time preference to keep UI in sync, falling back to server-provided initial value
    const preferenceQuery = useQuery(api.users.getSensitiveContentPreference)
    const preference = preferenceQuery ?? initialPreference ?? "blur"
    
    // If preference is 'allow', we show sensitive content without overlay
    const userShowsSensitive = preference === "allow"

    const isPublicFeed = feedType === "public"

    // Track feed view on mount (once auth state is loaded)
    React.useEffect(() => {
        if (isLoaded) {
            trackFeedView(feedType, !!isSignedIn)
        }
    }, [feedType, isSignedIn, isLoaded])

    // Reset state when feedType or initialPage changes
    React.useEffect(() => {
        setItems(initialPage?.page ?? [])
        setCursor(initialPage?.continueCursor ?? null)
        setIsDone(initialPage?.isDone ?? false)
    }, [feedType, initialPage])

    // Load more handler using server action
    const loadMore = React.useCallback(async () => {
        // Allow null cursor only for the first fetch (when items.length === 0)
        // Short-circuit if: done, already loading, or no cursor after we already have items
        if (isDone || isLoadingMore || (cursor === null && items.length > 0)) return

        setIsLoadingMore(true)
        try {
            const result = isPublicFeed
                ? await loadPublicFeedPage({ cursor, filterPreference: preference })
                : await loadFollowingFeedPage({ cursor })
            setItems(prev => [...prev, ...result.page])
            setCursor(result.continueCursor)
            setIsDone(result.isDone)
        } catch (error) {
            console.error("Failed to load more:", error)
        } finally {
            setIsLoadingMore(false)
        }
    }, [cursor, isDone, isLoadingMore, isPublicFeed, preference, items.length])

    // Determine status for PaginatedImageGrid
    const status = isDone ? "Exhausted" : isLoadingMore ? "LoadingMore" : "CanLoadMore"

    // Auto-load more if we got an empty page but aren't done
    // This is particularly useful for the following feed which can be sparse
    React.useEffect(() => {
        if (status === "CanLoadMore" && items.length === 0) {
            loadMore()
        }
    }, [status, items.length, loadMore])

    const emptyState = feedType === "public" ? (
        <PublicEmptyState />
    ) : (
        <FollowingEmptyState />
    )

    return (
        <div className="space-y-6">
            <FeedTabs activeType={feedType} />
            <PaginatedImageGrid
                images={items}
                status={status}
                loadMore={loadMore}
                emptyState={emptyState}
                userShowsSensitive={userShowsSensitive}
            />
        </div>
    )
}

function PublicEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="bg-primary/5 rounded-full p-8 mb-6 border border-primary/10">
                <ScanSearch className="h-10 w-10 text-primary/40" />
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

