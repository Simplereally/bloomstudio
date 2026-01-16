# Next.js Data Cache Implementation Plan

## Overview

This document outlines a phased implementation plan to add **server-side caching** to Bloom Studio's list pages. The goal is to reduce Convex bandwidth usage (which counts toward usage costs) while maintaining or improving UX through faster page loads and reduced client-side data fetching.

### Core Problem

Currently, all list views (`/history`, `/favorites`, `/feed/public`, `/feed/following`, and the Studio sidebar gallery) use **Convex client hooks** (`usePaginatedQuery`) directly. While this provides excellent reactivity, it means:

1. **Repeated JSON transfers** — Every page load re-fetches the same data from Convex
2. **No cross-user caching** — Public feed data is fetched separately for each user
3. **Bandwidth costs** — Each read counts toward Convex usage metrics

### Solution Architecture

Leverage **Next.js 16 Data Cache** with `unstable_cache()` to:

1. Cache list page JSON on the server (Vercel's globally distributed cache)
2. Share public feed cache across all users
3. Isolate private caches (history, favorites) by `userId`
4. Use time-based revalidation with optional tag-based invalidation for mutations

---

## Current State Analysis

### Files Involved

| Area | Current Implementation | Key Files |
|------|----------------------|------------|
| **Public Feed** | `usePaginatedQuery` → `api.generatedImages.getPublicFeed` | `hooks/queries/use-image-history.ts` (`useFeed`, `usePublicFeed`), `components/gallery/feed-client.tsx`, `app/feed/[type]/page.tsx` |
| **History** | `usePaginatedQuery` → `api.generatedImages.getMyImages` / `getMyImagesWithDisplayData` | `hooks/queries/use-image-history.ts`, `components/gallery/history-client.tsx`, `app/history/page.tsx` |
| **Favorites** | `usePaginatedQuery` → `api.favorites.list` | `hooks/queries/use-favorites.ts`, `components/gallery/favorites-client.tsx`, `app/favorites/page.tsx` |
| **Studio Gallery** | `usePaginatedQuery` → `api.generatedImages.getMyImages` | `hooks/queries/use-image-history.ts`, `components/studio/gallery/persistent-image-gallery.tsx` |
| **Mutations** | Client-side Convex mutations via hooks | `hooks/mutations/use-delete-image.ts`, `hooks/mutations/use-set-visibility.ts`, `hooks/queries/use-favorites.ts` |

### Convex Queries to Cache

Based on codebase analysis, these are the Convex queries that should be cached:

```typescript
// High-value caching targets (most repeated reads)
api.generatedImages.getPublicFeed        // Shared across ALL users
api.generatedImages.getMyImages          // Per-user, studio gallery (lightweight)
api.generatedImages.getMyImagesWithDisplayData  // Per-user, history page
api.favorites.list                       // Per-user, favorites page
api.generatedImages.getFollowingFeed     // Per-user, following feed
```

### Write Operations That Would Invalidate Cache

```typescript
// Image mutations (affect history, feed caches)
api.generatedImages.create               // New image → invalidate history
api.generatedImages.remove               // Delete → invalidate history, feed
api.generatedImages.removeMany           // Bulk delete → invalidate history, feed  
api.generatedImages.setVisibility        // Visibility change → invalidate history, feed
api.generatedImages.setBulkVisibility    // Bulk visibility → invalidate history, feed

// Favorite mutations (affect favorites cache)
api.favorites.toggle                     // Toggle favorite → invalidate favorites

// Generation (affects history)
api.singleGeneration.startGeneration     // Triggers async generation → eventually invalidates history
```

---

## Implementation Phases

## Phase 0: Infrastructure Setup ✅ COMPLETED

**Goal:** Set up the foundational caching infrastructure without changing any existing UI behavior.

**Status:** Completed on 2026-01-15

### 0.1 Create Server Data Layer Directory Structure ✅

Created the following structure:

```
app/
  _server/                     # Server-only utilities (co-located with app)
    convex/
      client.ts                # Convex client wrapper with auth ✅
    cache/
      config.ts                # Cache TTL configuration ✅
      feed.ts                  # Public feed cached queries ✅
      history.ts               # User history cached queries ✅
      favorites.ts             # User favorites cached queries ✅
    actions/
      feed.ts                  # Feed server actions ✅
      history.ts               # History server actions ✅
      favorites.ts             # Favorites server actions ✅
      invalidation.ts          # Cache invalidation helpers ✅
```


### 0.2 Create Convex Auth Helper ✅

**File: `app/_server/convex/client.ts`**

```typescript
import "server-only"
import { auth } from "@clerk/nextjs/server"

/**
 * Get Convex JWT token from Clerk for server-side authenticated requests.
 * Uses the "convex" JWT template configured in Clerk dashboard.
 */
export async function getConvexClerkToken(): Promise<string | undefined> {
    const { getToken } = await auth()
    const token = await getToken({ template: "convex" })
    return token ?? undefined
}

/**
 * Get the current user's Clerk ID for cache key generation.
 * Returns undefined if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | undefined> {
    const { userId } = await auth()
    return userId ?? undefined
}

/**
 * Require authenticated user, throw if not authenticated.
 */
export async function requireUserId(): Promise<string> {
    const userId = await getCurrentUserId()
    if (!userId) {
        throw new Error("Authentication required")
    }
    return userId
}
```

### 0.3 Create Cache Configuration ✅

**File: `app/_server/cache/config.ts`**

```typescript
import "server-only"

/**
 * Cache TTL configuration for different data types.
 * 
 * Strategy:
 * - First page (cursor = null): Short TTL for fresh content at the top
 * - Subsequent pages: Long TTL since older content rarely changes
 * - Public data: Shared cache across users
 * - Private data: Per-user cache keyed by userId
 */
export const CACHE_TTL = {
    // Public feed - shared across all users
    FEED_PUBLIC_FIRST_PAGE: 60,           // 1 minute - fresh content matters
    FEED_PUBLIC_LATER_PAGES: 60 * 60 * 6, // 6 hours - older content is stable
    
    // User history - per-user cache
    HISTORY_FIRST_PAGE: 30,               // 30 seconds - new generations show up fast
    HISTORY_LATER_PAGES: 60 * 60 * 12,    // 12 hours - historical data is stable
    
    // User favorites - per-user cache  
    FAVORITES_FIRST_PAGE: 60,             // 1 minute
    FAVORITES_LATER_PAGES: 60 * 60 * 6,   // 6 hours
    
    // Following feed - per-user cache
    FEED_FOLLOWING_FIRST_PAGE: 60,        // 1 minute
    FEED_FOLLOWING_LATER_PAGES: 60 * 60,  // 1 hour
} as const

/**
 * Cache tag prefixes for invalidation.
 * Format: `{prefix}:{identifier}`
 */
export const CACHE_TAGS = {
    // Shared caches
    FEED_PUBLIC: "feed:public",
    
    // Per-user caches (append userId)
    HISTORY_USER: (userId: string) => `history:user:${userId}`,
    FAVORITES_USER: (userId: string) => `favorites:user:${userId}`,
    FEED_FOLLOWING_USER: (userId: string) => `feed:following:${userId}`,
} as const

/**
 * Default page sizes for cached queries.
 * Keep consistent with client-side hooks for cache key stability.
 */
export const PAGE_SIZES = {
    DEFAULT: 20,
    STUDIO_GALLERY: 20,
    HISTORY: 20,
    FAVORITES: 20,
    FEED: 20,
} as const
```

---

## Phase 1: Public Feed Caching (Highest Impact) ✅ COMPLETED

**Goal:** Cache the public feed, which is the highest-impact opportunity since it's shared across all users.

**Status:** Completed on 2026-01-15

**Impact:** Every visitor to `/feed/public` shares the same cached data, dramatically reducing Convex reads.

### 1.1 Create Public Feed Cached Query ✅

**File: `app/_server/cache/feed.ts`**

```typescript
import "server-only"
import { unstable_cache } from "next/cache"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { CACHE_TTL, CACHE_TAGS, PAGE_SIZES } from "./config"

type Cursor = string | null

/**
 * Cached public feed page query.
 * This is a SHARED cache - the same cached data is used for all users.
 * 
 * Two-tier TTL strategy:
 * - First page (cursor = null): Short TTL for freshness
 * - Later pages: Long TTL since older content rarely changes
 */
export function getPublicFeedPageCached(cursor: Cursor, numItems: number = PAGE_SIZES.FEED) {
    const isFirstPage = cursor === null
    
    return unstable_cache(
        async () => {
            // Note: filterPreference is omitted for caching simplicity
            // If you need user-specific filtering, this becomes per-user
            return fetchQuery(api.generatedImages.getPublicFeed, {
                paginationOpts: { numItems, cursor },
                filterPreference: undefined, // Use default (no filter for cached)
            })
        },
        // Cache key parts: distinguish first page from later pages
        ["feed:public", isFirstPage ? "first" : "later", String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.FEED_PUBLIC_FIRST_PAGE : CACHE_TTL.FEED_PUBLIC_LATER_PAGES,
            tags: [CACHE_TAGS.FEED_PUBLIC],
        }
    )()
}
```

### 1.2 Create Public Feed Server Action ✅

**File: `app/_server/actions/feed.ts`**

```typescript
"use server"

import { getPublicFeedPageCached } from "@/app/_server/cache/feed"

/**
 * Server action to load a page of the public feed.
 * Used by client components for "load more" pagination.
 */
export async function loadPublicFeedPage(input: {
    cursor: string | null
    numItems?: number
}) {
    return getPublicFeedPageCached(input.cursor, input.numItems)
}
```

### 1.3 Update Public Feed Page (Server Component) ✅

**File: `app/feed/[type]/page.tsx`** (update existing)

```typescript
import { FeedClient } from "@/components/gallery/feed-client"
import { FeedCta } from "@/components/gallery/feed-cta"
import { getPublicFeedPageCached } from "@/app/_server/cache/feed"
import { FEED_TYPES, isValidFeedType, type FeedType } from "@/lib/feed-types"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

// ... existing metadata and generateStaticParams ...

export default async function FeedTypePage({ params }: FeedPageProps) {
    const { type } = await params

    if (!isValidFeedType(type)) {
        notFound()
    }

    const feedType: FeedType = type
    const isPublicFeed = feedType === "public"

    // Fetch initial page on server for public feed (cached)
    const initialPage = isPublicFeed 
        ? await getPublicFeedPageCached(null)
        : undefined

    return (
        <div className="min-h-screen bg-background">
            <main className="py-8">
                <FeedClient 
                    feedType={feedType} 
                    initialPage={initialPage}
                />
            </main>
            {/* ... rest of footer, CTA, JSON-LD ... */}
        </div>
    )
}
```

### 1.4 Update Feed Client Component ✅

**File: `components/gallery/feed-client.tsx`** (update existing)

```typescript
"use client"

import { FeedTabs } from "@/components/gallery/feed-tabs"
import { PaginatedImageGrid } from "@/components/gallery/paginated-image-grid"
import { Button } from "@/components/ui/button"
import { useFeed } from "@/hooks/queries/use-image-history"
import { loadPublicFeedPage } from "@/app/_server/actions/feed"
import { trackFeedView } from "@/lib/analytics"
import type { FeedType } from "@/lib/feed-types"
import { useAuth } from "@clerk/nextjs"
import { ImageOffIcon, ScanSearch } from "lucide-react"
import Link from "next/link"
import * as React from "react"

// Type for the paginated result from Convex
type PaginatedResult = Awaited<ReturnType<typeof loadPublicFeedPage>>

interface FeedClientProps {
    feedType: FeedType
    initialPage?: PaginatedResult  // NEW: Server-provided initial page
}

/**
 * Client component for the feed page.
 * For PUBLIC feed: Uses server-provided initial page + server actions for "load more"
 * For FOLLOWING feed: Uses Convex hooks for reactivity (requires auth)
 */
export function FeedClient({ feedType, initialPage }: FeedClientProps) {
    const { isSignedIn, isLoaded } = useAuth()
    
    // For FOLLOWING feed, use reactive Convex hooks
    const followingFeed = useFeed("following")
    
    // For PUBLIC feed with server-side caching
    const [publicItems, setPublicItems] = React.useState(() => initialPage?.page ?? [])
    const [publicCursor, setPublicCursor] = React.useState(() => initialPage?.continueCursor ?? null)
    const [publicIsDone, setPublicIsDone] = React.useState(() => initialPage?.isDone ?? false)
    const [isLoadingMore, setIsLoadingMore] = React.useState(false)
    
    const isPublicFeed = feedType === "public"
    
    // Track feed view on mount
    React.useEffect(() => {
        if (isLoaded) {
            trackFeedView(feedType, !!isSignedIn)
        }
    }, [feedType, isSignedIn, isLoaded])
    
    // Load more handler for public feed
    const loadMorePublic = React.useCallback(async () => {
        if (publicIsDone || isLoadingMore || !publicCursor) return
        
        setIsLoadingMore(true)
        try {
            const result = await loadPublicFeedPage({ cursor: publicCursor })
            setPublicItems(prev => [...prev, ...result.page])
            setPublicCursor(result.continueCursor)
            setPublicIsDone(result.isDone)
        } catch (error) {
            console.error("Failed to load more:", error)
        } finally {
            setIsLoadingMore(false)
        }
    }, [publicCursor, publicIsDone, isLoadingMore])
    
    // Determine which data source to use
    const results = isPublicFeed ? publicItems : followingFeed.results
    const status = isPublicFeed 
        ? (publicIsDone ? "Exhausted" : isLoadingMore ? "LoadingMore" : "CanLoadMore")
        : followingFeed.status
    const loadMore = isPublicFeed 
        ? loadMorePublic 
        : () => followingFeed.loadMore(20)

    // Auto-load more if we got an empty page but aren't done
    React.useEffect(() => {
        if (status === "CanLoadMore" && results.length === 0) {
            loadMore()
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

// ... keep existing empty state components ...
```

### 1.5 Phase 1 Testing Checklist

- [x] Public feed loads from server cache on first visit ✅
- [x] "Load more" works correctly via server action ✅
- [ ] Cache is shared across users (verify in Vercel logs after deploy)
- [x] ~~Following feed still uses reactive Convex hooks (unchanged)~~ → Migrated to server caching in Phase 6 ✅
- [ ] No hydration errors or flash of content (test in browser)
- [ ] Empty states render correctly (test in browser)

---

## Phase 2: User History Caching ✅ COMPLETED

**Goal:** Cache user history for both the Studio sidebar and `/history` page.

**Status:** Completed on 2026-01-15

**Impact:** Reduces repeated fetches during browsing sessions. Each user gets their own cache entry.

### 2.1 Create History Cached Queries

**File: `app/_server/cache/history.ts`**

```typescript
import "server-only"
import { unstable_cache } from "next/cache"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { CACHE_TTL, CACHE_TAGS, PAGE_SIZES } from "./config"
import { getConvexClerkToken } from "../convex/client"

type Cursor = string | null

interface HistoryFilters {
    visibility?: "public" | "unlisted"
    models?: string[]
}

/**
 * Cached user history page query (lightweight - for studio gallery).
 * Cache is per-user, keyed by userId.
 * 
 * Note: Token is captured in closure but NOT part of cache key.
 * userId provides stable cache key isolation.
 */
export async function getMyImagesPageCached(
    userId: string,
    cursor: Cursor,
    numItems: number = PAGE_SIZES.STUDIO_GALLERY,
    filters?: HistoryFilters
) {
    const token = await getConvexClerkToken()
    const isFirstPage = cursor === null
    
    // Normalize filters for stable cache key
    const filterKey = filters 
        ? JSON.stringify({ v: filters.visibility, m: filters.models?.sort() })
        : "none"
    
    return unstable_cache(
        async () => {
            return fetchQuery(
                api.generatedImages.getMyImages,
                {
                    paginationOpts: { numItems, cursor },
                    visibility: filters?.visibility,
                    models: filters?.models,
                },
                { token }
            )
        },
        ["history:my-images", userId, isFirstPage ? "first" : "later", filterKey, String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.HISTORY_FIRST_PAGE : CACHE_TTL.HISTORY_LATER_PAGES,
            tags: [CACHE_TAGS.HISTORY_USER(userId)],
        }
    )()
}

/**
 * Cached user history with display data (for history page with cards).
 */
export async function getMyImagesWithDisplayDataCached(
    userId: string,
    cursor: Cursor,
    numItems: number = PAGE_SIZES.HISTORY,
    filters?: HistoryFilters
) {
    const token = await getConvexClerkToken()
    const isFirstPage = cursor === null
    
    const filterKey = filters 
        ? JSON.stringify({ v: filters.visibility, m: filters.models?.sort() })
        : "none"
    
    return unstable_cache(
        async () => {
            return fetchQuery(
                api.generatedImages.getMyImagesWithDisplayData,
                {
                    paginationOpts: { numItems, cursor },
                    visibility: filters?.visibility,
                    models: filters?.models,
                },
                { token }
            )
        },
        ["history:display", userId, isFirstPage ? "first" : "later", filterKey, String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.HISTORY_FIRST_PAGE : CACHE_TTL.HISTORY_LATER_PAGES,
            tags: [CACHE_TAGS.HISTORY_USER(userId)],
        }
    )()
}
```

### 2.2 Create History Server Actions

**File: `app/_server/actions/history.ts`**

```typescript
"use server"

import { requireUserId } from "../convex/client"
import { getMyImagesPageCached, getMyImagesWithDisplayDataCached } from "../cache/history"

interface HistoryFilters {
    visibility?: "public" | "unlisted"
    models?: string[]
}

/**
 * Load user's image history page (lightweight - studio gallery).
 */
export async function loadMyHistoryPage(input: {
    cursor: string | null
    numItems?: number
    filters?: HistoryFilters
}) {
    const userId = await requireUserId()
    return getMyImagesPageCached(userId, input.cursor, input.numItems, input.filters)
}

/**
 * Load user's image history with display data (history page).
 */
export async function loadMyHistoryWithDisplayPage(input: {
    cursor: string | null
    numItems?: number
    filters?: HistoryFilters
}) {
    const userId = await requireUserId()
    return getMyImagesWithDisplayDataCached(userId, input.cursor, input.numItems, input.filters)
}
```

### 2.3 Update History Page

**File: `app/history/page.tsx`** (update existing)

```typescript
import { HistoryClient } from "@/components/gallery/history-client"
import { getMyImagesWithDisplayDataCached } from "@/app/_server/cache/history"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Your History | Bloom Studio",
  description: "View all your generated images in one place.",
  robots: { index: false, follow: false },
}

export default async function HistoryPage() {
    const { userId } = await auth()

    if (!userId) {
        redirect("/sign-in")
    }

    // Fetch initial page on server (cached)
    const initialPage = await getMyImagesWithDisplayDataCached(userId, null)

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Your History</h1>
                    <p className="text-muted-foreground">
                        All the images {"you've"} created, from newest to oldest.
                    </p>
                </div>
                <HistoryClient initialPage={initialPage} />
            </div>
        </div>
    )
}
```

### 2.4 Update History Client Component

Similar pattern to feed-client.tsx - manage local state for cached pages, use server action for "load more".

**Note:** The `HistoryClient` has filtering capabilities. When filters change, the component should fetch new data via server action with the new filters. This requires careful state management to handle filter changes resetting the pagination.

### 2.5 Phase 2 Testing Checklist

- [x] History page loads initial page from cache ✅
- [x] Load more works via server action ✅
- [x] Cache is isolated per user (different users get different cache entries) ✅
- [x] Filter changes fetch new data correctly ✅
- [x] Studio gallery sidebar loads cached data (Phase 5) ✅
- [x] No auth leakage (can't access another user's cache) ✅

---

## Phase 3: Favorites Caching ✅ COMPLETED

**Goal:** Cache user favorites with the same pattern as history.

**Status:** Completed on 2026-01-15

**Impact:** Reduces repeated fetches during browsing sessions. Each user gets their own cache entry keyed by `userId`.

### 3.1 Create Favorites Cached Query ✅

**File: `app/_server/cache/favorites.ts`** (created in Phase 0)

```typescript
import "server-only"
import { unstable_cache } from "next/cache"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { CACHE_TTL, CACHE_TAGS, PAGE_SIZES } from "./config"
import { getConvexClerkToken } from "../convex/client"

type Cursor = string | null

/**
 * Cached user favorites page query.
 * Cache is per-user, keyed by userId.
 */
export async function getFavoritesPageCached(
    userId: string,
    cursor: Cursor,
    numItems: number = PAGE_SIZES.FAVORITES
) {
    const token = await getConvexClerkToken()
    const isFirstPage = cursor === null
    
    return unstable_cache(
        async () => {
            return fetchQuery(
                api.favorites.list,
                { paginationOpts: { numItems, cursor } },
                { token }
            )
        },
        ["favorites", userId, isFirstPage ? "first" : "later", String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.FAVORITES_FIRST_PAGE : CACHE_TTL.FAVORITES_LATER_PAGES,
            tags: [CACHE_TAGS.FAVORITES_USER(userId)],
        }
    )()
}
```

### 3.2 Create Favorites Server Actions ✅

**File: `app/_server/actions/favorites.ts`** (created in Phase 0)

### 3.3 Update Favorites Page ✅

**File: `app/favorites/page.tsx`** - Updated to fetch initial page from cache

### 3.4 Update Favorites Client Component ✅

**File: `components/gallery/favorites-client.tsx`** - Refactored to use server action pattern

### 3.5 Phase 3 Testing Checklist

- [x] Favorites page loads initial page from cache ✅
- [x] Load more works via server action ✅
- [x] Cache is isolated per user (different users get different cache entries) ✅
- [x] Empty state renders correctly ✅
- [x] No auth leakage (can't access another user's cache) ✅

---

## Phase 4: Cache Invalidation ✅ COMPLETED

**Goal:** Ensure cache stays fresh when users perform mutations.

**Status:** Completed on 2026-01-15

### 4.1 Invalidation Strategy Options

#### Option A: TTL-Only (Recommended for MVP)

Rely purely on time-based revalidation. Users may see stale data for up to the TTL duration after mutations.

**Pros:**
- Zero additional complexity
- No plumbing between mutations and cache
- Very reliable

**Cons:**
- User may not immediately see new images after generation
- Deleted/hidden images may still show briefly

#### Option B: Server Action Mutations + Tag Invalidation

Route all user mutations through Server Actions, which can call `revalidateTag()`.

**Pros:**
- Immediate cache updates after user actions
- Better UX for "read-your-own-writes"

**Cons:**
- Requires migrating all Convex client mutations to Server Actions
- More complex architecture
- Current mutations use TanStack Query + Convex hooks together

#### Option C: Hybrid Approach (Recommended Long-term)

Keep TTL for eventual consistency, but add client-side refresh triggers after mutations.

The client can manually trigger a refetch of server data after a mutation completes successfully.

### 4.2 Invalidation Helpers

**File: `app/_server/actions/invalidation.ts`**

```typescript
"use server"

import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "../cache/config"
import { requireUserId } from "../convex/client"

/**
 * Invalidate the current user's history cache.
 * Call after image creation, deletion, or visibility changes.
 */
export async function invalidateUserHistoryCache() {
    const userId = await requireUserId()
    revalidateTag(CACHE_TAGS.HISTORY_USER(userId))
}

/**
 * Invalidate the current user's favorites cache.
 * Call after toggling favorites.
 */
export async function invalidateUserFavoritesCache() {
    const userId = await requireUserId()
    revalidateTag(CACHE_TAGS.FAVORITES_USER(userId))
}

/**
 * Invalidate the public feed cache.
 * Call after an image becomes public or is removed from public.
 */
export async function invalidatePublicFeedCache() {
    revalidateTag(CACHE_TAGS.FEED_PUBLIC)
}

/**
 * Invalidate all caches affected by visibility change.
 */
export async function invalidateVisibilityChange() {
    await invalidateUserHistoryCache()
    await invalidatePublicFeedCache()
}

/**
 * Invalidate all caches affected by image deletion.
 */
export async function invalidateImageDeletion() {
    await invalidateUserHistoryCache()
    await invalidatePublicFeedCache()
}
```

### 4.3 Integration Points

To use invalidation, modify existing mutation hooks to call invalidation actions on success:

**Example: `hooks/mutations/use-set-visibility.ts`**

```typescript
// In onSuccess callback:
onSuccess: async (_result, { visibility }) => {
    // ... existing toast logic ...
    
    // Invalidate server-side cache
    if (visibility === "public") {
        // Image became public - invalidate feed
        await invalidatePublicFeedCache()
    }
    await invalidateUserHistoryCache()
    
    // ... existing query invalidation ...
}
```

**Note:** Generation completion is handled by Convex actions. For those, you have two options:

1. **Client-triggered invalidation:** After `useGenerateImage` success, call invalidation action
2. **Webhook approach:** Have Convex call a Next.js API route to trigger invalidation

---

## Phase 5: Studio Gallery Migration ✅ COMPLETED

**Goal:** Migrate the studio sidebar gallery to use cached data.

**Status:** Completed on 2026-01-15

This is the most complex migration because:
1. The gallery needs to update in near-real-time after generation
2. It has selection/bulk operations
3. It has local filtering

### 5.1 Implemented Approach: Hybrid

Implemented a hybrid approach that keeps Convex reactive hooks for real-time updates while using server-cached data for pagination:

**Key Changes:**

1. **`app/studio/page.tsx`** - Server component now fetches initial gallery page from cache
2. **`components/studio/layout/studio-shell.tsx`** - Accepts and passes down `initialGalleryPage` prop
3. **`components/studio/features/history/gallery-feature.tsx`** - Passes initial page to view
4. **`components/studio/features/history/gallery-view.tsx`** - Passes initial page to gallery
5. **`components/studio/gallery/persistent-image-gallery.tsx`** - Hybrid data strategy:
   - Uses Convex reactive hooks for first page (instant updates on generation)
   - Uses server actions for "load more" pagination (cached)
   - Combines both data sources seamlessly

**Benefits:**
- Fast initial load from server cache (reduces Convex bandwidth)
- Instant updates when new images are generated (Convex reactivity)
- Reduced Convex bandwidth for pagination (server-cached pages)
- Filter changes reset to Convex-only mode for accuracy

### 5.2 Phase 5 Testing Checklist

- [x] Studio gallery loads initial page from server cache ✅
- [x] New generations appear instantly (Convex reactivity preserved) ✅
- [x] Load more works via server action (cached) ✅
- [x] Filter changes work correctly (resets to Convex-only) ✅
- [x] Selection mode and bulk actions work correctly ✅
- [x] Build compiles without errors ✅
- [ ] No hydration errors or flash of content (test in browser)
- [ ] Cache is isolated per user (verify in Vercel logs after deploy)

---

## Phase 6: Following Feed Caching ✅ COMPLETED

**Goal:** Cache the following feed with per-user isolation, completing the feed caching implementation.

**Status:** Completed on 2026-01-15

**Impact:** Reduces Convex bandwidth for authenticated users viewing their following feed. Each user gets their own cache entry keyed by `userId`.

### 6.1 Background

The cache configuration already had TTL values and tags defined for the following feed in Phase 0, but the actual cached query and server action were never implemented. The `FeedClient` component was using Convex reactive hooks (`useFeed("following")`) directly for the following feed while only the public feed used server-side caching.

### 6.2 Create Following Feed Cached Query ✅

**File: `app/_server/cache/feed.ts`** (updated)

```typescript
/**
 * Cached following feed page query.
 * Cache is per-user, keyed by userId - each user sees images from people they follow.
 * 
 * Two-tier TTL strategy:
 * - First page (cursor = null): Short TTL for fresh content from followed creators
 * - Later pages: Longer TTL since older content is stable
 * 
 * Note: Token is captured in closure but NOT part of cache key.
 * userId provides stable cache key isolation.
 */
export async function getFollowingFeedPageCached(
    userId: string,
    cursor: Cursor,
    numItems: number = PAGE_SIZES.FEED
) {
    const token = await getConvexClerkToken()
    const isFirstPage = cursor === null

    return unstable_cache(
        async () => {
            return fetchQuery(
                api.generatedImages.getFollowingFeed,
                { paginationOpts: { numItems, cursor } },
                { token }
            )
        },
        // Cache key parts: per-user, distinguish first page from later pages
        ["feed:following", userId, isFirstPage ? "first" : "later", String(numItems), cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.FEED_FOLLOWING_FIRST_PAGE : CACHE_TTL.FEED_FOLLOWING_LATER_PAGES,
            tags: [CACHE_TAGS.FEED_FOLLOWING_USER(userId)],
        }
    )()
}
```

### 6.3 Create Following Feed Server Action ✅

**File: `app/_server/actions/feed.ts`** (updated)

```typescript
/**
 * Server action to load a page of the following feed.
 * Requires authentication - returns empty result if not authenticated.
 * Used by client components for "load more" pagination.
 */
export async function loadFollowingFeedPage(input: {
    cursor: string | null
    numItems?: number
}) {
    const userId = await getCurrentUserId()
    if (!userId) {
        // Return empty result for unauthenticated users
        return { page: [], isDone: true, continueCursor: "" }
    }
    return getFollowingFeedPageCached(userId, input.cursor, input.numItems)
}
```

### 6.4 Add Following Feed Cache Invalidation ✅

**File: `app/_server/actions/invalidation.ts`** (updated)

```typescript
/**
 * Invalidate the current user's following feed cache.
 * Call when followed users' content changes or when follow relationships change.
 */
export async function invalidateUserFollowingFeedCache() {
    const userId = await requireUserId()
    revalidateTag(CACHE_TAGS.FEED_FOLLOWING_USER(userId), "max")
}

/**
 * Invalidate all caches affected by follow/unfollow action.
 * Call when the current user follows or unfollows someone.
 */
export async function invalidateFollowChange() {
    await invalidateUserFollowingFeedCache()
}
```

### 6.5 Update Feed Page (Server Component) ✅

**File: `app/feed/[type]/page.tsx`** (updated)

The page now fetches the initial following feed page on the server for authenticated users:

```typescript
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
```

### 6.6 Update Feed Client Component ✅

**File: `components/gallery/feed-client.tsx`** (refactored)

The component was refactored to use a unified caching approach for both feed types:

- Removed the Convex `useFeed("following")` hook dependency
- Both public and following feeds now use server-provided initial page
- Both use server actions for "load more" pagination
- State management is unified for both feed types
- Added `useEffect` to reset state when `feedType` or `initialPage` changes

Key changes:
```typescript
// State for cached feed data (works for both public and following)
const [items, setItems] = React.useState(() => initialPage?.page ?? [])
const [cursor, setCursor] = React.useState(() => initialPage?.continueCursor ?? null)
const [isDone, setIsDone] = React.useState(() => initialPage?.isDone ?? false)

// Load more handler using server action
const loadMore = React.useCallback(async () => {
    const result = isPublicFeed
        ? await loadPublicFeedPage({ cursor })
        : await loadFollowingFeedPage({ cursor })
    // ... update state
}, [cursor, isDone, isLoadingMore, isPublicFeed])
```

### 6.7 Create Comprehensive Tests ✅

**File: `components/gallery/feed-client.test.tsx`** (new)

Created 22 RTL tests covering:

- **Rendering:** FeedTabs active type, PaginatedImageGrid with initial data
- **Public feed:** Empty state, load more calls correct server action, appends items, exhausted status
- **Following feed:** Empty state, load more calls correct server action, appends items
- **State management:** Resets on feedType change, resets on initialPage change, prevents duplicate loads, respects isDone/cursor
- **Error handling:** Graceful error recovery
- **Auto-load behavior:** Auto-loads when empty but not done, doesn't auto-load with items or when done
- **Empty states:** Correct links for public and following empty states

### 6.8 Phase 6 Testing Checklist

- [x] Following feed loads initial page from server cache ✅
- [x] "Load more" works correctly via server action ✅
- [x] Cache is isolated per user (keyed by userId) ✅
- [x] Unauthenticated users get empty result gracefully ✅
- [x] State resets correctly when switching between feed types ✅
- [x] Empty states render correctly ✅
- [x] Build compiles without errors ✅
- [x] All 22 tests pass ✅
- [x] Cache invalidation works on follow/unfollow ✅
- [ ] No hydration errors or flash of content (test in browser)

---

## Implementation Order & Timeline

| Phase | Scope | Effort | Impact | Status |
|-------|-------|--------|--------|--------|
| **Phase 0** | Infrastructure setup | 1-2 hours | Foundation | ✅ Complete |
| **Phase 1** | Public feed caching | 2-3 hours | **HIGH** - Shared cache across all users | ✅ Complete |
| **Phase 2** | History page caching | 2-3 hours | Medium - Per-user, most browsed page | ✅ Complete |
| **Phase 3** | Favorites page caching | 1-2 hours | Low - Less traffic | ✅ Complete |
| **Phase 4** | Invalidation for mutations | 2-3 hours | UX improvement | ✅ Complete |
| **Phase 5** | Studio gallery | 3-4 hours | Medium - Complex due to reactivity needs | ✅ Complete |
| **Phase 6** | Following feed caching | 1-2 hours | Medium - Per-user, completes feed caching | ✅ Complete |

**All phases completed on 2026-01-15.**

---

## Monitoring & Validation

### Metrics to Track

1. **Convex bandwidth usage** (primary KPI)
   - Check Convex dashboard before/after each phase
   - Target: 50%+ reduction in list query bandwidth

2. **Cache hit rate** (Vercel dashboard)
   - Data Cache metrics
   - Target: >80% hit rate for public feed

3. **Page load times** (Vercel Speed Insights)
   - Should improve due to cached SSR

### Validation Steps After Each Phase

1. Clear browser cache, visit page → Should load from server cache
2. Load more → Should work via server action
3. Different user → Should get appropriate cache (shared for public, isolated for private)
4. Perform mutation → Cache should invalidate (if invalidation is implemented)

---

## Rollback Strategy

Each phase is independently reversible:

1. **To rollback a page:** Revert to previous component that uses Convex hooks directly
2. **To rollback completely:** Remove `app/_server/cache/` and `app/_server/actions/`, revert page components

Since existing Convex queries are unchanged, rollback is simply a matter of which component/hook the page uses.

---

## Appendix: Important Constraints

### Vercel Data Cache Limits

- **Max cached item size:** 2MB ([Vercel docs](https://vercel.com/docs/data-cache))
- Keep cached payloads lean (use thumbnail URLs, not base64)
- Current implementation already uses thumbnails ✓

### Cache Key Stability

- Don't include rotating tokens (JWT) in cache keys
- Use stable identifiers: `userId`, `cursor`, `numItems`, `filterKey`
- Normalize filter objects for consistent key generation

### Auth Token Handling

- Read auth OUTSIDE the cached function
- Pass stable `userId` as argument for per-user caching
- Token is captured in closure for the fetchQuery call, not the cache key

### Convex Cursor Pagination

- Cursors are opaque strings returned by Convex
- `cursor = null` means first page
- `continueCursor` from response is used for next page
- `isDone` indicates no more pages

---

## Optional Future Optimization: Two-Layer Shared Image Caching

> **Status:** Deferred - Revisit after measuring cache efficiency with usage metrics

### The Observation

While user-specific lists (history, favorites, following) require per-user cache entries, the **underlying image data is identical** across all users. For example:

- If Image `abc123` appears in 1,000 users' favorites, we currently cache that same image JSON 1,000 times (once per user's cached favorites result)
- Popular creators whose images appear in many following feeds cause duplicate caching

### Current vs. Optimized Architecture

**Current Approach (Per-User List Caching):**
```
User X's Favorites → Cache FULL paginated result (includes image data) → per-user
User Y's Favorites → Cache FULL paginated result (includes image data) → per-user
                     ↑ Same image data duplicated in both cache entries
```

**Potential Two-Layer Approach:**
```
Layer 1: User X's Favorites → Cache just [imageId1, imageId2, ...] → per-user
Layer 2: Image Data         → Cache individual images by ID        → SHARED across all users
```

### Why This Works

Looking at the existing `favorites.list` query, it already has a two-step pattern:

```typescript
// Step 1: Get the user's favorite IDs (paginated) - USER-SPECIFIC
const favoritesResult = await ctx.db
    .query("favorites")
    .withIndex("by_user", (q) => q.eq("userId", identity.subject))
    .paginate(args.paginationOpts)

// Step 2: Fetch the actual images by ID - SAME FOR EVERYONE
const images = await Promise.all(
    favoritesResult.page.map((fav) => ctx.db.get(fav.imageId))
)
```

### Implementation Approach

**File: `app/_server/cache/images.ts`** (new file)

```typescript
import "server-only"
import { unstable_cache } from "next/cache"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

/**
 * SHARED image cache - same image data served to ALL users.
 * Cache key is just the imageId, not userId.
 * 
 * Popular images accessed by 10,000 users = 1 cached copy, not 10,000.
 */
export async function getCachedImageById(imageId: Id<"generatedImages">) {
    return unstable_cache(
        async () => {
            return fetchQuery(api.generatedImages.getById, { imageId })
        },
        ["image", imageId],  // Cache key is just the imageId - shared!
        { 
            revalidate: 60 * 60 * 6,  // 6 hours - images rarely change
            tags: [`image:${imageId}`] 
        }
    )()
}

/**
 * Batch fetch multiple cached images.
 * Each image checked against shared cache individually.
 */
export async function getCachedImagesByIds(imageIds: Id<"generatedImages">[]) {
    return Promise.all(imageIds.map(getCachedImageById))
}
```

**Updated Favorites Cached Query:**

```typescript
// File: app/_server/cache/favorites.ts (optimized version)

import { getCachedImagesByIds } from "./images"

export async function getFavoritesPageCachedOptimized(
    userId: string,
    cursor: Cursor,
    numItems: number = PAGE_SIZES.FAVORITES
) {
    const token = await getConvexClerkToken()
    const isFirstPage = cursor === null
    
    // Layer 1: Cache the LIST of favorite imageIds (per-user, lightweight)
    const favoriteIds = await unstable_cache(
        async () => {
            const result = await fetchQuery(
                api.favorites.listIds,  // New query that returns just IDs
                { paginationOpts: { numItems, cursor } },
                { token }
            )
            return result
        },
        ["favorites:ids", userId, isFirstPage ? "first" : "later", cursor ?? "start"],
        {
            revalidate: isFirstPage ? CACHE_TTL.FAVORITES_FIRST_PAGE : CACHE_TTL.FAVORITES_LATER_PAGES,
            tags: [CACHE_TAGS.FAVORITES_USER(userId)],
        }
    )()
    
    // Layer 2: Fetch actual images from SHARED cache
    const images = await getCachedImagesByIds(favoriteIds.page)
    
    return {
        ...favoriteIds,
        page: images.filter((img): img is NonNullable<typeof img> => img !== null),
    }
}
```

**Required Convex Query (new):**

```typescript
// File: convex/favorites.ts - add this query

export const listIds = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return { page: [], isDone: true, continueCursor: "" }
        }

        const favoritesResult = await ctx.db
            .query("favorites")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .paginate(args.paginationOpts)

        // Return just the imageIds, not full image data
        return {
            ...favoritesResult,
            page: favoritesResult.page.map(fav => fav.imageId),
        }
    },
})
```

### Expected Benefits

| Scenario | Current (Per-User) | Optimized (Two-Layer) |
|----------|-------------------|----------------------|
| 100 users view same popular creator's images | 100 × N image copies | 100 ID lists + N shared images |
| Following feed for shared follows | Duplicate image data | Shared image data |
| Cache storage efficiency | O(users × images) | O(users × IDs) + O(unique images) |

### When to Implement

Consider implementing when:
1. **High cache miss rate:** If popular images are being re-fetched frequently
2. **Cache storage concerns:** If Vercel Data Cache usage is high
3. **Following feed usage grows:** More users following the same popular creators

### Tradeoffs

**Pros:**
- Dramatically better cache efficiency for popular content
- Reduced Convex bandwidth for shared images
- Individual image invalidation (without invalidating entire list)

**Cons:**
- More cache lookups per page (N+1 pattern, though all from cache)
- Requires new Convex queries (`listIds` variants)
- More complex invalidation (need to invalidate both list AND image caches)
- Slightly higher latency (sequential: get IDs → get images)

### Decision

**Deferred for now.** The current per-user caching provides significant value and is simpler to implement and debug. This optimization should be revisited after:
1. Phase 1-5 are complete and stable
2. Usage metrics show popular content duplication is significant
3. Cache storage or hit rates indicate optimization is needed

---



## References

- [Next.js unstable_cache API](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [Next.js Caching Guide](https://nextjs.org/docs/app/guides/caching)
- [Vercel Data Cache](https://vercel.com/docs/data-cache)
- [Convex Next.js Server Rendering](https://docs.convex.dev/client/react/nextjs/server-rendering)
- [Convex Pagination](https://docs.convex.dev/database/pagination)
- Research Document: `todo/reference-next-cache-research.md`
- Implementation Research: `todo/reference-next-cache-and-actions-implementation.md`
