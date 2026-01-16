"use client"

import { FEED_TYPE_LABELS, FEED_TYPES, type FeedType } from "@/lib/feed-types"
import { cn } from "@/lib/utils"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"

interface FeedTabsProps {
    activeType: FeedType
}

/**
 * Tab navigation for feed types.
 * Renders as links for proper routing instead of local state.
 * The "Following" tab is only shown to authenticated users.
 */
export function FeedTabs({ activeType }: FeedTabsProps) {
    const { isSignedIn } = useAuth()

    // Filter tabs: show all for authenticated, only "public" for guests
    const visibleTabs = isSignedIn
        ? FEED_TYPES
        : FEED_TYPES.filter((type) => type === "public")

    // Don't render tabs container if only one tab (cleaner UX for guests)
    if (visibleTabs.length <= 1) {
        return null
    }

    return (
        <div className="flex justify-center mb-8">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-[400px]">
                {visibleTabs.map((type) => (
                    <Link
                        key={type}
                        href={`/feed/${type}`}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1",
                            activeType === type
                                ? "bg-background text-foreground shadow-sm"
                                : "hover:bg-background/50 hover:text-foreground"
                        )}
                    >
                        {FEED_TYPE_LABELS[type]}
                    </Link>
                ))}
            </div>
        </div>
    )
}
