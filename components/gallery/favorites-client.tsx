"use client"

import { PaginatedImageGrid } from "@/components/gallery/paginated-image-grid"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/queries/use-favorites"
import { Heart } from "lucide-react"
import Link from "next/link"

/**
 * Client component for the dedicated favorites page.
 * Displays the current user's favorited images with pagination.
 */
export function FavoritesClient() {
    const { results, status, loadMore } = useFavorites()

    return (
        <PaginatedImageGrid
            images={results.map((r) => r as any)}
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
