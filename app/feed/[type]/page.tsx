import { FeedClient } from "@/components/gallery/feed-client"
import { FeedCta } from "@/components/gallery/feed-cta"
import { getPublicFeedPageCached, getFollowingFeedPageCached } from "@/app/_server/cache/feed"
import { getCurrentUserId } from "@/app/_server/convex/client"
import { FEED_TYPES, isValidFeedType, type FeedType } from "@/lib/feed-types"
import type { Metadata } from "next"
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

/**
 * Generate dynamic metadata based on feed type.
 */
export async function generateMetadata({ params }: FeedPageProps): Promise<Metadata> {
    const { type } = await params

    const isPublic = type === "public"
    const title = isPublic
        ? "Community Creations | Bloom Studio"
        : "Following Feed | Bloom Studio"
    const description = isPublic
        ? "Explore stunning AI-generated images and videos created by the Bloom Studio community. Get inspired by thousands of creative works and create your own masterpieces."
        : "See the latest creations from creators you follow on Bloom Studio."

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            siteName: "Bloom Studio",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        // Only index public feed, not following (which requires auth)
        robots: isPublic
            ? { index: true, follow: true }
            : { index: false, follow: false },
    }
}

export default async function FeedTypePage({ params }: FeedPageProps) {
    const { type } = await params

    // Validate feed type at runtime
    if (!isValidFeedType(type)) {
        notFound()
    }

    const feedType: FeedType = type
    const isPublicFeed = feedType === "public"

    // Fetch initial page on server (cached)
    // Public feed: shared cache across all users
    // Following feed: per-user cache, requires auth
    let initialPage
    if (isPublicFeed) {
        initialPage = await getPublicFeedPageCached(null)
    } else {
        // Following feed requires authentication
        const userId = await getCurrentUserId()
        if (userId) {
            initialPage = await getFollowingFeedPageCached(userId, null)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="py-8">

                {/* Grid Section - Full width */}
                <FeedClient feedType={feedType} initialPage={initialPage} />
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 py-12 bg-muted/20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Built with passion by the Bloom Studio team.
                    </p>
                </div>
            </footer>

            {/* Floating CTA for unauthenticated users (only on public feed) */}
            {isPublicFeed && <FeedCta />}

            {/* JSON-LD Structured Data for SEO (public feed only) */}
            {isPublicFeed && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "ImageGallery",
                            name: "Bloom Studio Community Creations",
                            description:
                                "A curated feed of AI-generated images and videos created by the Bloom Studio community using cutting-edge AI models.",
                            url: "https://bloomstudio.fun/feed/public",
                            provider: {
                                "@type": "Organization",
                                name: "Bloom Studio",
                                url: "https://bloomstudio.fun",
                            },
                        }),
                    }}
                />
            )}
        </div>
    )
}

