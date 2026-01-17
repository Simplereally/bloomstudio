
# Convex Bandwidth & Performance Audit (Superseded)

This document is superseded by [convex-bandwidth-audit.md](file:///c:/Code/pixelstream/todo/convex-bandwidth-audit.md).

**Date**: 2026-01-17
**Scope**: Database queries, schema design, and frontend data consumption.

## Executive Summary

This audit identified **5 key areas** for optimization. The most critical findings relate to **scalability risks** in the Following Feed (currently a full table scan) and **excessive bandwidth consumption** in the Batch Job history (fetching heavy JSON objects for list views). Addressing these two items alone will significantly improve long-term stability and reduce egress costs.

## Prioritized Optimization Opportunities

| Priority | Area | Issue | Impact | Effort |
| :--- | :--- | :--- | :--- | :--- |
| 🔴 **Critical** | `getFollowingFeed` | **Full Table Scan**: Scans *all* public images to filter by followed users. Will fail as DB grows. | High CPU & internal read throughput | Medium |
| 🔴 **Critical** | `getUserBatchJobs` | **Massive Over-fetching**: Returns full `generationParams` (can be large) for every job in the list view. | High client bandwidth | Low |
| 🟡 **Medium** | `ImageCard` | **N+1 Subscriptions**: Each card opens a separate `isFavorited` socket. 50 cards = 50 listeners. | High connection overhead | Medium |
| 🟡 **Medium** | `enrichImages` | **Internal Over-fetch**: Fetches full `users` document (including encrypted keys) just to get username/avatar. | Wasted internal bandwidth | Low |
| 🟢 **Low** | Schema | `generationParams` is `v.any()` and unconstrained. | Risk of unbounded document growth | Low |

---

## Detailed Analysis

### 1. `getFollowingFeed` Scalability Risk (Critical)
**Location**: `convex/generatedImages.ts:653`
- **Current Behavior**: Fetches a list of followees, then queries `generatedImages` by `by_visibility` (public) and uses a filter for `ownerId`.
- **Problem**: Filters in Convex scan the entire index range. This query scans **every single public image** in the database to find matches. As `generatedImages` grows to 10k+ items, this query will timeout.
- **Recommendation**:
  - **Short term**: Use `Promise.all` to fetch the latest N images for *each* followed user using `by_owner_visibility` index, then merge and sort in memory.
  - **Long term**: Implement a "Fan-out on Write" architecture where a `timeline` table receives entries when followed users post.

### 2. `getUserBatchJobs` Bandwidth Usage (Critical)
**Location**: `convex/batchGeneration.ts:434`
- **Current Behavior**: Returns the full `batchJobs` document, filtering out only `apiKey`.
- **Problem**: `generationParams` is included. For complex workflows (e.g. ComfyUI), this JSON can be 10-50KB per job. Listing 50 jobs = ~2.5MB payload just for a history list.
- **Recommendation**:
  - Create a specialized `toBatchJobSummary` helper that strips `generationParams` and only returns `id`, `status`, `counts`, and `createdAt`.
  - Only fetch full params in a detail view (`getBatchJob`).

### 3. `ImageCard` N+1 Subscriptions (Medium)
**Location**: `components/ui/image-card.tsx:97`
- **Current Behavior**: `useQuery(api.favorites.isFavorited, ...)` is called inside every card.
- **Problem**: React loops over 50 items -> 50 individual subscriptions. This overhead slows down the client and burdens the Convex backend with managing 50x more reactive queries than necessary.
- **Recommendation**:
  - Update `FeedClient` to fetch a **batch** of favorite statuses for the current page using `api.favorites.batchIsFavorited` (which already exists!).
  - Pass `isFavorited` status down as a prop to `ImageCard`.

### 4. `enrichImages` Internal Efficiency (Medium)
**Location**: `convex/generatedImages.ts:29`
- **Current Behavior**: `enrichImages` fetches `ctx.db.query("users")...unique()`.
- **Problem**: This loads the **entire user document** into server memory, including `pollinationsApiKey` (encrypted string) and other internal fields, just to read `username` and `pictureUrl`.
- **Recommendation**:
  - Since Convex doesn't support field selection at the DB layer for primary docs yet, this is less actionable *unless* user docs become huge.
  - **Preemptive fix**: If user docs grow, split "public profile" data into a separate `userProfiles` table that is lightweight.

### 5. Schema & Filtering (Low)
**Location**: `convex/schema.ts`
- **Issue**: `generationParams` is `v.any()`.
- **Risk**: No validation on size or structure. A bug could insert 10MB of JSON.
- **Recommendation**: Define a stricter schema or adding a mutation-time check to limit the size of this field.

**Location**: `getPublicFeed` (ALLOW mode)
- **Issue**: Filters by `isSensitive != null`. This scans the `by_visibility` index.
- **Recommendation**: Add a specialized index `by_visibility_analyzed` closest to `["visibility", "isSensitive", "createdAt"]` to optimize the "allow" feed if safe/sensitive counts are lopsided.

---

## Action Plan (Recommended Order)

- [x] **Fix `getUserBatchJobs`**: Created `toBatchJobSummary` helper to strip `generationParams`, `apiKey`, and `imageIds` from list views. (Quick win, high impact).
- [x] **Refactor `ImageCard` favorites**: Added `batchIsFavorited` query to `PaginatedImageGrid`, passing pre-fetched status to `ImageCard`. (Improves client performance).
- [x] **Optimize `getFollowingFeed`**: Rewrote to use per-user indexed queries with `by_owner_visibility` instead of full table scan. (Prevents future outages).
- [x] **Document `enrichImages`**: Added bandwidth limitation note about fetching full user docs.
- [x] **Document `generationParams`**: Added warning in schema about v.any() and size concerns.
