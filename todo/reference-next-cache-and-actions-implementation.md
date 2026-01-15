# Next cache implementation overview + Server actions migration to enable it

This doc is written against the Bloom Studio repo tag **v0.1.7** (downloaded from GitHub). In that tag you’re on **Next 16.1.1**, App Router, Vercel hosting, Clerk auth, Convex backend, R2 for bytes. Your list UIs (Studio side gallery + `/history` + `/favorites` + `/feed/[type]`) currently hit Convex via **client hooks** (`usePaginatedQuery`) and then hit R2 for bytes.

Your R2 objects already ship with `Cache-Control: public, max-age=31536000, immutable`, which is perfect for byte-caching. The remaining bandwidth pain is the **JSON metadata pages** coming out of Convex.

The core move is: **shift “read-mostly list pages” from Convex client hooks → Next server-side reads (Server Actions / Server Components / Route Handlers)**, so you can put those reads behind **Next’s Data Cache** (on Vercel: globally distributed) instead of repeatedly transferring the same JSON from Convex.

---

## 1) What “Next cache” actually is (and whether it’s shared)

### Data Cache (the one you want)

When you use `unstable_cache()` (or Next’s newer “use cache” APIs), results are stored in **Next’s Data Cache**, which **persists across requests and deployments**. ([Vercel][1])

On Vercel specifically:

* Data Cache infra is **scaffolded automatically** when you use Next caching APIs (like `unstable_cache` / `fetch` cache options).
* Cache data is **isolated per Vercel project + environment (prod vs preview)**. ([Vercel][1])
* Revalidation marks a path/tag stale **globally across regions**, then the next request triggers refresh. ([Vercel][2])

### “Is it per-user or shared?”

**By default it’s shared** across requests. It becomes “per-user” only if your cache key includes user identity (e.g., `userId`) or anything user-specific. With `unstable_cache`, the cache key includes the function + its arguments, and you can add `keyParts` to make that explicit.

**Important constraint:** you can’t read `cookies()` / `headers()` *inside* a cache scope. Read auth outside, then pass what you need in.

### Invalidation: do you have to manage it?

You have two strategies:

1. **Time-based revalidate** (simple, reliable, minimal plumbing)
   Set `revalidate: seconds`. Great for feeds/history where “eventual freshness” is fine.

2. **Tag/path-based invalidation** (more “exact,” more plumbing)
   Use tags (e.g., `feed:public`, `history:user:${userId}`) and call `revalidateTag()` after relevant mutations. ([Vercel][1])

Because many of your writes happen inside **Convex actions/mutations**, Next won’t “automatically” know. If you want exact invalidation, you either:

* Perform those mutations via **Next Server Actions** (so you can call `revalidateTag()` right there), or
* Add a tiny “revalidate webhook” Route Handler in Next and call it from Convex when writes complete (optional).

---

## 2) Server Actions vs Convex client hooks: what’s better here?

### Keep Convex client hooks for:

* Realtime/reactive experiences that must update instantly (generation status tracking, single item detail views that can change, presence, etc.)

### Prefer Server Actions (or Server Components / Route Handlers) for:

* Read-mostly list views with heavy repetition across users/sessions:

  * Studio gallery side panel history
  * `/history`
  * `/favorites`
  * `/feed/public` (and optionally `/feed/following`)

**Reason:** Convex client hooks are reactive (amazing UX), but they still transfer JSON repeatedly and count toward DB bandwidth. Server-side reads let you put the results behind Next/Vercel cache and serve the same JSON to many users without re-reading Convex each time.

---

## 3) What we’ll build (concrete layout)

### Goal

Replace client `usePaginatedQuery` for list pages with:

* **Initial page** fetched on the server (fast SSR + cache hit),
* **Load-more pages** fetched via a **Server Action** (still can be cached),
* Optional tag-based invalidation when you want it.

### Proposed file layout

```
app/
  _server/
    convexAuth.ts          # Clerk -> Convex JWT helper (server-only)
    cachedQueries/
      feed.ts              # cached read functions for feed pages
      history.ts           # cached read functions for user history pages
      favorites.ts         # cached read functions for favorites pages
  actions/
    feed.ts                # "use server" actions (loadMore, etc.)
    history.ts
    favorites.ts
  api/
    revalidate/route.ts    # OPTIONAL webhook for Convex->Next invalidation

components/
  gallery/
    feed-client.tsx        # switch from useFeed() to server action paging
    history-client.tsx
    favorites-client.tsx
  studio/gallery/
    persistent-image-gallery.tsx  # same migration as history-client
```

---

## 4) Authentication: Clerk → Convex JWT (server-side)

Convex’s Next.js helpers (`fetchQuery`, `fetchMutation`, etc.) support passing an auth token. With Clerk, the recommended pattern is `getToken({ template: "convex" })`.

Create:

```ts
// app/_server/convexAuth.ts
import "server-only";
import { auth } from "@clerk/nextjs/server";

export async function getConvexClerkToken(): Promise<string | undefined> {
  const { getToken } = await auth();
  // Requires a Clerk JWT template named "convex"
  return (await getToken({ template: "convex" })) ?? undefined;
}
```

**Pro tip:** Do NOT include the token in cache keys. Tokens rotate; your cache would explode into per-token entries. Use `userId` as the stable key instead.

---

## 5) Caching strategy (what to cache, how long, and why)

### What to cache

Cache the **Convex query results** for:

* `api.generatedImages.getPublicFeed`
* `api.generatedImages.getMyImages` (studio + history)
* `api.generatedImages.getMyImagesWithDisplayData` (history with enrichment)
* `api.favorites.listFavorites`

These are paginated and append-mostly. Convex cursor pagination returns `continueCursor` you can pass back to get the next page.

### Two-tier TTLs (best practice for append-only feeds)

Use:

* **Short TTL** for the “first page” (cursor = null) because new images arrive there.
* **Long TTL** for subsequent cursors because those pages rarely change and are expensive to re-fetch.

Example:

* First page: `revalidate: 15–60s`
* Older pages: `revalidate: 6–24h` (or even indefinite + tag invalidation)

This gets you “feels fresh” while still nuking bandwidth.

---

## 6) Implementation: cached query modules

### 6.1 Public feed (shared cache across all users)

```ts
// app/_server/cachedQueries/feed.ts
import "server-only";
import { unstable_cache } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type Cursor = string | null;

export const getPublicFeedPageCached = unstable_cache(
  async (cursor: Cursor, numItems: number) => {
    return fetchQuery(api.generatedImages.getPublicFeed, {
      paginationOpts: { numItems, cursor },
    });
  },
  ["feed:public"],
  {
    revalidate: 60, // 1 minute baseline; tune to taste
    tags: ["feed:public"],
  }
);
```

This is **shared** (same cache entry used by everyone) because the key is only `(cursor, numItems)`.

### 6.2 User history (cache per user)

Here’s the pattern that avoids putting a rotating token in the key:

```ts
// app/_server/cachedQueries/history.ts
import "server-only";
import { unstable_cache } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// Keep arguments stable and serializable:
type Cursor = string | null;
type HistoryMode = "studio-gallery" | "history-page";

export function makeGetMyImagesPageCached(token: string | undefined) {
  // token is captured in the closure; NOT part of cache key
  return unstable_cache(
    async (
      userId: string,
      mode: HistoryMode,
      cursor: Cursor,
      numItems: number
    ) => {
      // Pick the lightest query that matches the UI
      const query =
        mode === "studio-gallery"
          ? api.generatedImages.getMyImages
          : api.generatedImages.getMyImagesWithDisplayData;

      return fetchQuery(
        query,
        { paginationOpts: { numItems, cursor } },
        { token }
      );
    },
    ["history:my-images"],
    {
      // We'll override TTL by “first page vs later pages” in the caller (see Actions section)
      revalidate: 60,
      tags: ["history"],
    }
  );
}
```

**Why this structure:** Next doesn’t support calling `cookies()`/`headers()` inside cache scope, so you must read auth outside.
But you also don’t want the token in the cache key, so you capture it in a closure and use `userId` as the stable arg.

---

## 7) Server Actions: load-more paging (and TTL tiering)

### 7.1 Public feed load-more

```ts
// app/actions/feed.ts
"use server";

import { getPublicFeedPageCached } from "@/app/_server/cachedQueries/feed";

export async function loadPublicFeedPage(input: {
  cursor: string | null;
  numItems?: number;
}) {
  const numItems = input.numItems ?? 20;
  return getPublicFeedPageCached(input.cursor, numItems);
}
```

### 7.2 History load-more with “first page short TTL, older pages long TTL”

Because `unstable_cache`’s `revalidate` is set at creation time, the simplest approach is to maintain **two cached functions**:

* one for first page (short TTL),
* one for subsequent pages (long TTL).

```ts
// app/actions/history.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getConvexClerkToken } from "@/app/_server/convexAuth";

type Cursor = string | null;

export async function loadMyHistoryPage(input: {
  cursor: Cursor;
  mode: "studio-gallery" | "history-page";
  numItems?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const token = await getConvexClerkToken();
  const numItems = input.numItems ?? 20;

  const query =
    input.mode === "studio-gallery"
      ? api.generatedImages.getMyImages
      : api.generatedImages.getMyImagesWithDisplayData;

  const isFirstPage = input.cursor === null;

  const cached = unstable_cache(
    async (cursor: Cursor) => {
      return fetchQuery(
        query,
        { paginationOpts: { numItems, cursor } },
        { token }
      );
    },
    // Cache key is stable: user + mode + cursor bucket
    [userId, input.mode, isFirstPage ? "first" : "later", String(numItems)],
    {
      // short TTL for first page; long TTL for older cursors
      revalidate: isFirstPage ? 30 : 60 * 60 * 12, // 30s vs 12h
      tags: [`history:user:${userId}`, `history:mode:${input.mode}`],
    }
  );

  return cached(input.cursor);
}
```

This gives you:

* Great UX on new items (first page refreshes quickly),
* Massive bandwidth reduction on deep scroll pages.

**Note:** `unstable_cache` explicitly warns dynamic data sources must be read outside the cache scope.
We’re doing that: `auth()` + `getToken()` are outside; cached function only receives stable args.

---

## 8) Updating your existing pages/components (repo-specific)

### 8.1 `/feed/[type]/page.tsx`

Currently server checks auth then renders `FeedClient`.

Upgrade pattern:

* Fetch initial page server-side for `public` (shared cache, no auth needed)
* For `following`, either:

  * keep it client-reactive (Convex hook), **or**
  * server-action it like history with per-user cache

Example for public:

```ts
// app/feed/[type]/page.tsx
import { getPublicFeedPageCached } from "@/app/_server/cachedQueries/feed";
import { FeedClient } from "@/components/gallery/feed-client";

export default async function FeedTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  if (type === "public") {
    const initial = await getPublicFeedPageCached(null, 20);
    return <FeedClient type={type as any} initialPage={initial} />;
  }

  // For following: either keep existing client hook or implement per-user server action paging
  return <FeedClient type={type as any} />;
}
```

### 8.2 `components/gallery/feed-client.tsx`

Replace `useFeed(type)` with:

* local state storing items + cursor,
* `loadPublicFeedPage()` server action calls for infinite scroll.

You’ll keep the same UI; only the data-source changes.

### 8.3 Studio side panel (`components/studio/gallery/persistent-image-gallery.tsx`)

It currently uses `useImageHistory("studio-gallery")`. Swap to:

* accept `initialPage` from server (Studio page can fetch it)
* load-more via `loadMyHistoryPage({ mode: "studio-gallery" })`

### 8.4 `/history` and `/favorites`

Same as above: server provides initial page, client uses server action for more.

---

## 9) Invalidation: practical “best effort” vs “exact”

### Option A (recommended to start): **TTL-only**

It’s robust and minimal. You’ll see a dramatic bandwidth reduction immediately.

### Option B: exact invalidation with tags

If you want “instant reflect” after:

* user toggles favorite
* user changes privacy/public visibility
* generation completes

Then route those writes through Server Actions and call:

* `revalidateTag('favorites:user:${userId}')`
* `revalidateTag('history:user:${userId}')`
* `revalidateTag('feed:public')`

`unstable_cache` supports tags + revalidate seconds; you can keep long TTL and still invalidate on demand.

### Bridging from Convex actions (optional)

If the write happens inside Convex (e.g., generation processor), Next can’t automatically revalidate. Two good patterns:

1. **Client-triggered revalidate on success**
   In `useGenerateImage` `onSuccess`, call a server action `notifyGenerationCompleted()` that does `revalidateTag('history:user:${userId}')` + maybe `revalidateTag('feed:public')`.

2. **Convex → Next webhook**
   Create `app/api/revalidate/route.ts` that checks a secret and calls `revalidateTag()`. Convex action can `fetch()` that URL after it writes the DB record.

---

## 10) “If X then Y” paths (so you don’t over-migrate)

### If you want the Studio gallery to update *instantly* after generation

* Keep Convex reactive hook for **just the newest page** (or even just the active session’s “recently generated” list).
* Cache everything older than that via server actions.

### If you want the smallest diff and fastest win

* Do **public feed** first (biggest shared benefit, simplest: no auth).
* Then do **history** (largest per-user repeated browsing).
* Favorites last.

### If server actions feel awkward for infinite scroll

Use a **Route Handler** that returns JSON with `Cache-Control: s-maxage=…` (edge CDN caching) and have the client `fetch()` it. (This is also “free,” and very fast on Vercel.) Vercel supports caching function responses globally using cache headers. ([Vercel][3])
Downside: less ergonomic tag invalidation compared to Data Cache APIs.

### If you outgrow “free”

Vercel caching is available on all plans but subject to limits/fair use. Check limits/pricing if you’re pushing huge scale. ([Vercel][4])
At that point, the next “free-ish” move people use is often **Cloudflare Workers + KV/Durable Objects** or a **Redis** service with a free tier—but since you’re already on Vercel and want idiomatic Next 16, the Vercel Data Cache is the cleanest first step.

---

## 11) Pro tips (battle-tested gotchas)

1. **Don’t cache Clerk tokens** (and don’t put them in cache keys). Use `userId` as the stable identity key.
2. **Cache explosion control:**

   * Only cache “popular” filter combos (e.g., no filters + common ones).
   * Or normalize filter objects into a small stable key string.
3. **Minimize payloads for list views**: consider “lite” Convex queries for lists (id, thumbnailUrl, createdAt, ownerName) and fetch heavy fields only on detail open.
4. **Measure wins quickly:** log Convex query call counts for the target queries before/after migration.
5. **Start with shared caches**: `feed/public` will give you the most dramatic “shared cache” win.

---

## Sources (explicit links)

```text
Repo (tag used in this writeup)
https://github.com/Simplereally/bloomstudio/releases/tag/v0.1.7

Next.js unstable_cache reference (dynamic sources + Data Cache persistence)
https://nextjs.org/docs/app/api-reference/functions/unstable_cache

Next.js caching guide
https://nextjs.org/docs/app/guides/caching

Next.js caching & revalidating guide (revalidateTag examples)
https://nextjs.org/docs/app/getting-started/caching-and-revalidating

Vercel Data Cache for Next.js (global infra, isolation per project/env)
https://vercel.com/docs/data-cache

Vercel pricing & limits (for “free but limited” reality)
https://vercel.com/docs/pricing
https://vercel.com/docs/limits

Convex Next.js server rendering + Clerk token template (“convex”)
https://docs.convex.dev/client/react/nextjs/server-rendering
https://docs.convex.dev/auth/clerk

Convex pagination docs (cursor + continueCursor)
https://docs.convex.dev/database/pagination
```

[1]: https://vercel.com/docs/data-cache?utm_source=chatgpt.com "Data Cache for Next.js - Vercel"
[2]: https://vercel.com/docs/data-cache.md?utm_source=chatgpt.com "vercel.com"
[3]: https://vercel.com/docs/storage?utm_source=chatgpt.com "Vercel Storage overview"
[4]: https://vercel.com/docs/pricing?utm_source=chatgpt.com "Pricing on Vercel"
