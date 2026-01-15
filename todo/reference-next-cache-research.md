With **Vercel + Next.js 16 + Clerk + Convex**, the “idiomatic best practice” is:

* **Cache list JSON on the server** with **Cache Components** (`'use cache'` + `cacheLife` + `cacheTag`)
* **Key private caches by `userId`** (derived from Clerk on the server, never trusted from the client)
* **Invalidate via tags on writes** (`updateTag` in Server Actions for “read-your-own-writes”; `revalidateTag(..., 'max')` elsewhere for SWR)

This is exactly what Next’s caching APIs are designed for. ([Next.js][1])

---

## Concrete layout (works well for scalability)

### 1) Enable Cache Components and define long-lived profiles

**`next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true, // required for cacheLife/use cache features
  cacheLife: {
    // “Long cache, but with fast invalidation via tags”
    studioLong: {
      stale: 60 * 5,            // 5 min client/router stale window (minimum-ish anyway)
      revalidate: 60 * 60 * 24, // 1 day background refresh cadence
      expire: 60 * 60 * 24 * 30 // 30 days hard expiry
    },
    // Public feed can be a bit fresher if you like
    feedLong: {
      stale: 60 * 5,
      revalidate: 60 * 30,      // 30 min
      expire: 60 * 60 * 24 * 7  // 7 days
    }
  }
};

export default nextConfig;
```

Why: Next recommends setting explicit `cacheLife` so behavior is predictable. ([Next.js][2])

---

### 2) Create a single “server data layer” that all UI uses

Suggested folders:

```
src/
  server/
    convex/
      client.ts        // convex/nextjs fetchQuery/fetchMutation wrappers
      queries.ts       // typed query calls
      mutations.ts     // typed mutation calls
    cache/
      lists.ts         // cached list functions + tagging scheme
      invalidate.ts    // central invalidation helpers (tags)
  app/
    (studio)/
      ...pages
    actions/
      ...server-actions
```

This keeps caching decisions centralized and prevents random client components from hitting Convex directly.

---

## Cached list functions (the core of it)

### Tag scheme (simple + powerful)

Use **coarse tags**:

* `feed:public`
* `user:{userId}:history`
* `user:{userId}:favorites`

You do **not** need a separate tag per page/cursor. Keep it coarse so invalidation stays cheap and reliable (and avoids tag explosion; Vercel has tag limits per item). ([Vercel][3])

### `src/server/cache/lists.ts`

```ts
import { cacheLife, cacheTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// PUBLIC FEED (shared cache across all users — good)
export async function getPublicFeedPage(cursor?: string, limit = 24) {
  "use cache";
  cacheLife("feedLong");
  cacheTag("feed:public");

  return fetchQuery(api.feed.publicPage, { cursor, limit });
}

// USER HISTORY (cache is “shared infrastructure”, but key isolates by userId)
export async function getUserHistoryPage(userId: string, cursor?: string, limit = 24) {
  "use cache";
  cacheLife("studioLong");
  cacheTag(`user:${userId}:history`);

  return fetchQuery(api.images.historyPage, { userId, cursor, limit });
}

export async function getUserFavoritesPage(userId: string, cursor?: string, limit = 24) {
  "use cache";
  cacheLife("studioLong");
  cacheTag(`user:${userId}:favorites`);

  return fetchQuery(api.images.favoritesPage, { userId, cursor, limit });
}
```

**Important best practice:** don’t call `auth()` or read cookies inside the cached functions — pass stable arguments (like `userId`) into them. Next’s caching model is designed around cache keys derived from arguments. ([Next.js][4])

---

## Clerk integration (safe + idiomatic)

### A server-only “resolver” wrapper that derives userId

**Never** accept `userId` from the client for private endpoints.

`src/server/convex/withUser.ts`

```ts
import { auth } from "@clerk/nextjs/server";

export async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
```

Clerk’s `auth()` helper is explicitly for server-side (Server Components / Route Handlers / Server Actions) and requires middleware. ([Clerk][5])

---

## Use it in pages (server-first, cached JSON, client infinite scroll)

### History sidebar initial load (Server Component)

```ts
import { requireUserId } from "@/server/convex/withUser";
import { getUserHistoryPage } from "@/server/cache/lists";

export default async function HistorySidebar() {
  const userId = await requireUserId();
  const firstPage = await getUserHistoryPage(userId, undefined, 24);

  return <HistoryClient initialPage={firstPage} />;
}
```

### Infinite scroll “load more”

For “load more”, you have two good options:

**Option A (recommended): Route Handler that calls the same cached function**

* Keeps Convex calls server-side
* Uses the same cache + tags

`app/api/history/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireUserId } from "@/server/convex/withUser";
import { getUserHistoryPage } from "@/server/cache/lists";

export async function GET(req: Request) {
  const userId = await requireUserId();
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "24");

  const page = await getUserHistoryPage(userId, cursor, limit);
  return NextResponse.json(page);
}
```

**Option B: Keep Convex on the client for “load more”, but cache only the first page**
This is viable if you want to keep client reactivity. You still win big because most users bounce before deep pages. (But since you said “aggressively caching JSON for these pages”, Option A is the move.)

---

## Invalidation you should implement (confidently)

### 1) Use `updateTag` in Server Actions for “read-your-own-writes”

This is the cleanest way to guarantee the user sees new items immediately after they generate/favorite.

Next explicitly distinguishes:

* `updateTag`: **Server Actions only**, immediate expiry, read-your-own-writes
* `revalidateTag('tag', 'max')`: SWR semantics (serve stale while refreshing) ([Next.js][1])

`app/actions/toggleFavorite.ts`

```ts
"use server";

import { updateTag } from "next/cache";
import { requireUserId } from "@/server/convex/withUser";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function toggleFavorite(imageId: string) {
  const userId = await requireUserId();

  await fetchMutation(api.images.toggleFavorite, { imageId, userId });

  // Immediately expire these list caches for this user
  updateTag(`user:${userId}:favorites`);
  updateTag(`user:${userId}:history`);
}
```

### 2) Public feed invalidation

When an image becomes public / hidden, invalidate the feed tag:

* If done in a **Server Action**: you can `updateTag("feed:public")`
* If done in a **Route Handler** (webhook/admin): use `revalidateTag("feed:public", "max")` ([Next.js][1])

---

## If your writes happen directly in Convex from the client (paths x / y / z)

### Path X (best): route **all user mutations through Next Server Actions**

This gives you the cleanest invalidation story (`updateTag`) and consistent security boundaries (Clerk → server → Convex).

### Path Y: keep Convex client mutations, but trigger invalidation via a protected Route Handler

* Convex action (or any trusted backend step) calls your Next endpoint
* The Next endpoint calls `revalidateTag(...)`
* Protect it with a secret header so it’s not public

Route handlers are an allowed place to call `revalidateTag`. ([Next.js][1])

### Path Z: accept eventual consistency

If you truly don’t want any invalidation plumbing, just set `cacheLife` long and rely on revalidate windows. It will be fast, but you will occasionally show stale history/favorites right after an action. (Most studios hate this UX.)

---

## Pro tips that materially improve cache hit rate & Convex bandwidth

1. **Cache the first page “hard”; cache deep pages “soft”**
   The first page is hot. Deep pages are cold and cursor-specific.

2. **Keep cached payloads tiny (< 2MB)**
   Vercel Data Cache won’t cache items larger than **2MB**. ([Vercel][3])
   So cached results should be card JSON (ids, thumbUrl, maybe dims/status) — never base64 bytes (you already solved this with R2).

3. **One userId = one cache key space**
   Because Vercel’s cache is shared across the project/environment ([Vercel][3]), privacy depends on:

* deriving `userId` from Clerk server-side
* including `userId` in cached-function arguments
* never letting the client choose a different userId

4. **Use tag invalidation, not short TTLs**
   Long caches + explicit invalidation is the sweet spot for your “rarely changes but must update when it does” lists. Next’s tag APIs are designed exactly for this. ([Next.js][1])

5. **Prefer coarse tags**
   Tag explosion is a real footgun. One coarse tag per list per user is ideal.

---

## Full, un-truncated source links
https://nextjs.org/docs/app/getting-started/caching-and-revalidating
https://nextjs.org/docs/app/api-reference/functions/cacheLife
https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheLife
https://nextjs.org/docs/app/api-reference/directives/use-cache-remote
https://vercel.com/docs/data-cache
https://clerk.com/docs/reference/nextjs/app-router/auth
https://clerk.com/docs/reference/nextjs/app-router/server-actions
https://docs.convex.dev/client/nextjs/app-router/server-rendering
https://docs.convex.dev/api/modules/nextjs

[1]: https://nextjs.org/docs/app/getting-started/caching-and-revalidating "Getting Started: Caching and Revalidating | Next.js"
[2]: https://nextjs.org/docs/app/api-reference/functions/cacheLife "Functions: cacheLife | Next.js"
[3]: https://vercel.com/docs/data-cache "Data Cache for Next.js"
[4]: https://nextjs.org/docs/app/api-reference/directives/use-cache-remote "Directives: use cache: remote | Next.js"
[5]: https://clerk.com/docs/reference/nextjs/app-router/auth "SDK Reference: auth()"
