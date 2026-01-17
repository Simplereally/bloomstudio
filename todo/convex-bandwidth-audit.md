# Convex Database Bandwidth Audit (Pixelstream)

**Date**: 2026-01-17  
**Scope**: `c:\Code\pixelstream\convex\` + `c:\Code\pixelstream\app\_server\convex\` plus all repo callers of Convex `api.*`

This document focuses on reducing **Convex database bandwidth** (bytes read/written from the database by Convex functions) and secondarily the **response payload size** to clients. In Convex, returning a “projected” object helps client payload size, but **does not necessarily reduce database bandwidth** if the function still reads a large document.

## Executive Summary

The dominant bandwidth drivers are:

1. **Large documents in hot tables** (`generatedImages`, `batchJobs`, `pendingGenerations`, `users`) being read frequently.
2. **`collect()` over heavy docs** (reads *all* matching documents into the function).
3. **Join/enrichment patterns** that repeatedly load full `users` docs just to display username/avatar.
4. **Following feed** implemented as a filtered scan of the public feed index, which will not scale.

Some optimizations are already implemented (server-cached feed pagination, batched favorite statuses). This audit calls those out as “already mitigated” to avoid rework.

---

## Prioritized Opportunities

| Priority | Opportunity | Current Bandwidth Impact | Est. Improvement | Effort |
| --- | --- | --- | --- | --- |
| **P0** | Split heavy fields out of `generatedImages` | Every feed/history read pulls `generationParams` + analyses | **40–90%** lower DB bandwidth on hot reads | High |
| **P0** | Fix `collect()` scans on heavy job tables | `batchJobs`/`pendingGenerations` list endpoints read *all* docs | **10–100×** lower reads for large accounts | Medium |
| **P0** | Favorites list reads full image docs | `favorites.list` loads full `generatedImages` per favorite | **40–90%** lower per-page DB reads | Medium |
| **P1** | Replace following feed filtered scan | `getFollowingFeed` scans public index and OR-filters owners | Prevents timeouts; **order-of-magnitude** cost reduction | High |
| **P1** | Avoid full-doc reads in `getBatchImages` | Reads full `generatedImages` for each batch image | **40–90%** lower per-batch view reads | Low–Med |
| **P2** | Denormalize/public-profile table for enrichment | Feed queries load full user docs per unique owner | **5–50%** lower on feed reads (depends on user doc size) | Medium |
| **P3** | Gate/limit admin migrations & stats scans | Several migration/stats functions `collect()`/scan tables | Reduces accidental spikes | Low |

---

## Detailed Findings (with code locations)

### P0 — Split heavy fields out of `generatedImages`

**Why it matters**  
`generatedImages` documents contain multiple heavy fields:
- `generationParams: v.any()` (unbounded; often KBs–10s of KBs)
- `contentAnalysis` (object)
- `promptInference.reasoning` (string; can be large)

These fields are not required for most list views (feed/history grids), but Convex reads the whole document when queried.

**Schema locations**
- [schema.ts](file:///c:/Code/pixelstream/convex/schema.ts#L61-L161)

**Hot read paths (examples)**
- Public feed query: [generatedImages.ts:getPublicFeed](file:///c:/Code/pixelstream/convex/generatedImages.ts#L513-L568)
- Following feed query: [generatedImages.ts:getFollowingFeed](file:///c:/Code/pixelstream/convex/generatedImages.ts#L653-L702)
- Profile gallery: [generatedImages.ts:getImagesByUsername](file:///c:/Code/pixelstream/convex/generatedImages.ts#L574-L647)
- Lightbox details: [generatedImages.ts:getById](file:///c:/Code/pixelstream/convex/generatedImages.ts#L200-L223)

**Consumers / fields actually used**
- `ImageCard` grid tiles render: `url`, `prompt`, `model`, `width`, `height`, `seed`, `contentType`, `ownerName`, `ownerPictureUrl`, `isSensitive` ([image-card.tsx](file:///c:/Code/pixelstream/components/ui/image-card.tsx#L167-L211)).
- Lightbox only needs the same display fields (and *does not* use `generationParams`, `contentAnalysis`, or `promptInference`) ([image-lightbox.tsx](file:///c:/Code/pixelstream/components/images/image-lightbox.tsx#L31-L55)).

**Recommendation**
- Create a 1:1 “details” table and keep `generatedImages` lean:
  - `generatedImages` (hot): urls, dimensions, prompt, model, seed, visibility, isSensitive, createdAt, ownerId, etc.
  - `generatedImageDetails` (cold): `generationParams`, `contentAnalysis`, `promptInference`, anything verbose.
- Update `getById` (and generation completion paths) to join details **only when needed**.

**Estimated improvement**
- If `generationParams + analyses` average **5–20KB**, removing them from hot reads yields **~40–90%** less database bandwidth for feed/history/favorites queries.

---

### P0 — Eliminate `collect()` scans over heavy job documents

#### `batchGeneration.getUserActiveBatches`
**Location**: [batchGeneration.ts:getUserActiveBatches](file:///c:/Code/pixelstream/convex/batchGeneration.ts#L446-L467)

**Current behavior**
- Uses `.collect()` over all `batchJobs` for the user, then filters in JS.
- Even though it returns a lightweight summary, the `.collect()` already reads the full docs, including `generationParams`, `apiKey`, and `imageIds`.

**Recommendation**
- Add an index like `by_owner_status_createdAt` on `batchJobs` and query only active statuses.
- Or create a separate lightweight table for list views (e.g., `batchJobSummaries`) kept in sync when updating the job.

**Estimated improvement**
- For users with many jobs, reduces reads from “all jobs ever” to “active subset”, often **10–100×** fewer document bytes read.

#### `singleGeneration.getActiveGenerations`
**Location**: [singleGeneration.ts:getActiveGenerations](file:///c:/Code/pixelstream/convex/singleGeneration.ts#L127-L145)

**Current behavior**
- Uses `.collect()` over all `pendingGenerations` for a user, then filters to pending/processing.
- `pendingGenerations.generationParams` is `v.any()` and can be large ([schema.ts](file:///c:/Code/pixelstream/convex/schema.ts#L228-L255)).

**Recommendation**
- Add an index like `by_owner_status_createdAt` on `pendingGenerations`, and query statuses directly.
- Consider splitting `generationParams` out similarly to the `generatedImages` recommendation if it grows.

---

### P0 — Favorites list reads full `generatedImages` docs

**Location**: [favorites.ts:list](file:///c:/Code/pixelstream/convex/favorites.ts#L121-L158)

**Current behavior**
- Reads favorites via `by_user` pagination, then `ctx.db.get(fav.imageId)` for each favorite.
- Returns the full enriched image documents (includes heavy fields).

**Consumers**
- Favorites page renders `ImageCard`-style fields (url/prompt/model/dimensions/seed/owner badge) ([favorites-client.tsx](file:///c:/Code/pixelstream/components/gallery/favorites-client.tsx#L18-L64)).

**Recommendation**
- After splitting `generatedImages` heavy fields (P0 above), this becomes much cheaper automatically.
- If you want a smaller change first:
  - Return a minimal “card” shape from `favorites.list` (matching `ImageCardData`) and stop returning the full doc.
  - Consider caching/denormalizing `ownerName`/`ownerPictureUrl` onto the returned shape to avoid repeated user reads.

**Estimated improvement**
- If the average `generatedImages` doc carries **5–20KB** of extra fields, favorites pages will drop by **~40–90%** DB bandwidth per page.

---

### P1 — Following feed scales as a filtered scan of public images

**Location**: [generatedImages.ts:getFollowingFeed](file:///c:/Code/pixelstream/convex/generatedImages.ts#L653-L702)

**Current behavior**
- Reads all follow records via `.collect()` ([generatedImages.ts](file:///c:/Code/pixelstream/convex/generatedImages.ts#L663-L668)).
- Queries public images by `by_visibility` and filters by `ownerId IN followedIds` using an `OR(...)` expression.

**Bandwidth + scalability impact**
- As `generatedImages` grows, this behaves like scanning the public feed index to find followed owners.
- Large follow lists also expand the filter expression and increase cost.

**Recommendation**
- Long-term: “fan-out on write” timeline table:
  - On creating a public image, write timeline entries for followers (or for a capped recent window).
  - Following feed becomes a simple paginated query by `followerId`.
- Short-term: merge strategy:
  - Fetch the most recent N per followee via `by_owner_visibility`, merge+sort in memory, and paginate at the app layer.

**Estimated improvement**
- Prevents query timeouts and reduces reads by an **order of magnitude** once public feed is large.

---

### P1 — `getBatchImages` returns full `generatedImages` docs

**Location**: [batchGeneration.ts:getBatchImages](file:///c:/Code/pixelstream/convex/batchGeneration.ts#L499-L522)

**Current behavior**
- Fetches `ctx.db.get(id)` for each imageId and returns full docs.

**Consumers**
- Used by client hook [useBatchImages](file:///c:/Code/pixelstream/hooks/queries/use-batch-generation.ts#L202-L212).

**Recommendation**
- Provide a dedicated “thumbnail / card fields only” variant (or reuse the same card shape used everywhere else).
- If you implement the P0 “details table” split, `ctx.db.get(id)` becomes cheap for list views automatically.

---

### P2 — Reduce user-doc reads during enrichment

**Locations**
- [generatedImages.ts:enrichImages](file:///c:/Code/pixelstream/convex/generatedImages.ts#L29-L59)
- [favorites.ts:enrichImages](file:///c:/Code/pixelstream/convex/favorites.ts#L21-L51)

**Current behavior**
- Loads full `users` documents per unique `ownerId` in the page.
- `users` includes `pollinationsApiKey` which is irrelevant for public display ([schema.ts](file:///c:/Code/pixelstream/convex/schema.ts#L13-L56)).

**Recommendations**
- Split secrets out of `users` into a `userSecrets` table keyed by clerkId (or by users doc id), so feed enrichment never reads API keys.
- Optionally denormalize `ownerName` and `ownerPictureUrl` onto `generatedImages` at write-time and update on username/avatar changes.

**Estimated improvement**
- Depends on user doc size; typically **5–50%** reduction on feed/favorites queries with many distinct owners per page.

---

### P3 — Admin migrations & stats scans (protect against spikes)

These are likely not on hot user paths, but they read entire tables and can create bandwidth spikes if triggered accidentally.

**Examples**
- [tempTagStats.ts:getTaggingStatus](file:///c:/Code/pixelstream/convex/tempTagStats.ts#L15-L58) (`collect()` all images)
- [thumbnailMigration.ts:getMigrationStats](file:///c:/Code/pixelstream/convex/thumbnailMigration.ts#L73-L90) (`collect()` all images)
- [sensitivityMigration.ts:previewMigration](file:///c:/Code/pixelstream/convex/sensitivityMigration.ts#L113-L148)
- [orphanCleanupQueries.ts:getAllR2Keys](file:///c:/Code/pixelstream/convex/orphanCleanupQueries.ts#L20-L48)

**Recommendations**
- Require admin auth, add hard limits, and/or ensure they only run as scheduled maintenance.

---

## Already Mitigated (Good Patterns to Keep)

- Batched favorite status lookups for grids: [paginated-image-grid.tsx](file:///c:/Code/pixelstream/components/gallery/paginated-image-grid.tsx#L87-L97) passes `isFavorited` into `ImageCard`, skipping per-card subscriptions.
- Server-side cached feed pagination (avoids realtime `usePaginatedQuery` for feed): [feed.ts](file:///c:/Code/pixelstream/app/_server/cache/feed.ts#L18-L75), [feed-client.tsx](file:///c:/Code/pixelstream/components/gallery/feed-client.tsx#L36-L118).
- `batchGeneration.getUserBatchJobs` returning summaries (response-wise): [batchGeneration.ts:getUserBatchJobs](file:///c:/Code/pixelstream/convex/batchGeneration.ts#L472-L493). Note: DB bandwidth still depends on document size read.

---

## Next Best Actions (Fastest to Biggest Wins)

1. **Remove `collect()` over heavy job docs** (`getUserActiveBatches`, `getActiveGenerations`) via new composite indexes or summary tables.
2. **Split `generatedImages` heavy fields** into a details table (largest broad-spectrum win).
3. **Refactor following feed** to a timeline table (prevents scale failures).
4. **Fix favorites list shape** (and optionally denormalize owner fields).

