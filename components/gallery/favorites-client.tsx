"use client"

import { PaginatedImageGrid } from "@/components/gallery/paginated-image-grid"
import { Button } from "@/components/ui/button"
import { loadFavoritesPage } from "@/app/_server/actions/favorites"
import { Heart } from "lucide-react"
import Link from "next/link"
import * as React from "react"

// Type for the paginated result from the cached query/server action
type PaginatedFavoritesResult = Awaited<ReturnType<typeof loadFavoritesPage>>

interface FavoritesClientProps {
    /** Server-provided initial page (from cache) */
    initialPage: PaginatedFavoritesResult
}

/**
 * Client component for the dedicated favorites page.
 * Displays the current user's favorited images with pagination.
 *
 * Uses server-side caching:
 * - Initial page is provided by the server (cached)
 * - "Load more" fetches via server action (also cached)
 */
export function FavoritesClient({ initialPage }: FavoritesClientProps) {
    // Pagination state managed locally (server action pattern)
    const [items, setItems] = React.useState(() => initialPage.page)
    const [cursor, setCursor] = React.useState(() => initialPage.continueCursor)
    const [isDone, setIsDone] = React.useState(() => initialPage.isDone)
    const [isLoadingMore, setIsLoadingMore] = React.useState(false)

    // Load more handler using server action
    const loadMore = React.useCallback(async () => {
        if (isDone || isLoadingMore || !cursor) return

        setIsLoadingMore(true)
        try {
            const result = await loadFavoritesPage({ cursor })
            setItems(prev => [...prev, ...result.page])
            setCursor(result.continueCursor)
            setIsDone(result.isDone)
        } catch (error) {
            console.error("Failed to load more favorites:", error)
        } finally {
            setIsLoadingMore(false)
        }
    }, [cursor, isDone, isLoadingMore])

    // Compute status compatible with PaginatedImageGrid
    const status = isDone ? "Exhausted" : isLoadingMore ? "LoadingMore" : "CanLoadMore"

    return (
        <PaginatedImageGrid
            images={items.map((r) => r as any)}
            status={status}
            loadMore={loadMore}
            showUser={true}
            emptyState={<FavoritesEmptyState />}
        />
    )
}

function FavoritesEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <div className="bg-primary/5 rounded-full p-8 mb-6 border border-primary/10">
                <Heart className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No favorites yet</h3>
            <p className="text-muted-foreground max-w-sm">
                Browse the feed and tap the heart icon on images you love!
            </p>
            <Link href="/feed">
                <Button className="mt-8 rounded-full px-8">Browse Feed</Button>
            </Link>
        </div>
    )
}

