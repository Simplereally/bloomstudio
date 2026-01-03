import { FeedClient } from "@/components/gallery/feed-client"
import { FEED_TYPES, isValidFeedType, type FeedType } from "@/lib/feed-types"
import { notFound } from "next/navigation"

interface FeedPageProps {
    params: Promise<{ type: string }>
}

/**
 * Generate static params to constrain valid feed type segments.
 */
export function generateStaticParams() {
    return FEED_TYPES.map((type) => ({ type }))
}

export default async function FeedTypePage({ params }: FeedPageProps) {
    const { type } = await params

    // Validate feed type at runtime
    if (!isValidFeedType(type)) {
        notFound()
    }

    const feedType: FeedType = type

    return (
        <div className="min-h-screen bg-background">
            <main className="py-8">
                {/* Title Section - Constrained for readability */}
                <div className="container mx-auto px-4">
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Community Feed
                    </p>
                </div>

                {/* Grid Section - Full width */}
                <FeedClient feedType={feedType} />
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 py-12 bg-muted/20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Built with passion by the Bloom Studio team.
                    </p>
                </div>
            </footer>
        </div>
    )
}

