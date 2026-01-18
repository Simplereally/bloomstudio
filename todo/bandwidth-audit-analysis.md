# Convex Bandwidth Audit - Implementation Status & Analysis

**Analysis Date**: 2026-01-18
**Verified By**: Antigravity
**Reference Documents**:
- `todo/bandwidth-optimization.md` (Superseded - Completed)
- `todo/convex-bandwidth-audit.md` (Current Audit - Partially Outdated)

---

## Executive Summary

This document serves as the master status tracker for bandwidth optimizations.
**Status Verification**: a fresh code review of `convex/` confirms that while **application-layer** optimizations (payload reduction) have been applied, **database-layer** optimizations (indexes, table splits) are largely **outstanding**.

The superseded document (`bandwidth-optimization.md`) is **100% Complete**.
The new audit (`convex-bandwidth-audit.md`) contains the remaining critical work, but its text is partially outdated regarding the Following Feed and Image Card implementation.

---

## Part 1: Completed Items (Archive `bandwidth-optimization.md`)

The following items from the superseded audit are **DONE** and working in production.

| Item | Status | Implementation Details |
| :--- | :--- | :--- |
| **Fix `getFollowingFeed` Scan** | ✅ **COMPLETE** | Rewritten to use `Promise.all` + `by_owner_visibility` index. No longer scans the full public index. |
| **Fix `getUserBatchJobs` Payload** | ✅ **COMPLETE** | Uses `toBatchJobSummary()` to strip heavy `generationParams` before returning to client. |
| **Fix `ImageCard` N+1** | ✅ **COMPLETE** | Components use `api.favorites.batchIsFavorited` to fetch status in one batch. |
| **Enrichment Warnings** | ✅ **COMPLETE** | Code comments added to `enrichImages` regarding user doc size. |

---

## Part 2: Outstanding Actions (Primary Focus)

The following items are **PENDING** and represent the biggest opportunities to reduce database bandwidth and costs.

### 🔴 P0: Split Heavy Fields (Critical)

**Status**: ✅ **FULLY COMPLETE** (Schema finalized, all data migrated)

*   **Action Taken**:
    1.  Created `generatedImageDetails` table in `schema.ts`.
    2.  Moved `generationParams`, `contentAnalysis`, `promptInference` to the new table for **new writes**.
    3.  Updated `batchGeneration` and `singleGeneration` writers to write to details table.
    4.  Updated `generatedImages` update mutations to patch the details table.
    5.  Added `aspectRatio` calculation to batch generation (was missing).
    6.  Created `detailsMigration.ts` with complete 2-phase migration.
    7.  **Ran Phase 1**: Copied 1326 legacy records to `generatedImageDetails`.
    8.  **Ran Phase 2**: Stripped legacy fields from 1326 `generatedImages` records.
    9.  **Ran Phase 3**: Removed deprecated fields from `schema.ts`.
*   **Result**: Feed queries now read lightweight documents, saving 5-50KB per row entirely on the database side.

**Migration Complete**: All 1326 images migrated. Schema is clean.

### 🔴 P0: Eliminate `collect()` Scans (Critical)

**Status**: ✅ **COMPLETE**

*   **Action Taken**:
    1.  Added `by_owner_status` index to `batchJobs` and `pendingGenerations`.
    2.  Refactored `getUserActiveBatches` to use `Promise.all([pending, processing, paused])` indexed queries.
    3.  Refactored `getActiveGenerations` to use indexed queries.
*   **Result**: Reduced reads from O(total_history) to O(active_items).

### 🔴 P0: Optimize Favorites & Batch Image Lookups

**Status**: ✅ **COMPLETE (Via Table Split)**

*   **Action Taken**:
    *   By splitting the heavy fields (P0 above), the `ctx.db.get(imageId)` calls in Favorites and Batch Image lists are now retrieving lightweight documents.
    *   The expensive JSON blobs are no longer loaded into memory or counted against DB read bandwidth for these lists.
*   **Result**: List views are now highly efficient without further code changes.

### 🟡 P1: Following Feed Scalability (Long Term)

**Status**: ⚠️ **SHORT-TERM FIX IMPLEMENTED**

*   **Current State**: Uses `Promise.all` to fetch latest 10 images for each followed user. Works well for <50 follows.
*   **Optimization Gap**: As follow counts grow >100, this N+1 query pattern will degrade.
*   **Required Action**: Implement "Fan-out on Write" (Timeline Architecture) where entries are written to a `timeline` table upon creation.

### 🔵 P2: Privacy & Efficiency

**Status**: ❌ **NOT IMPLEMENTED**

*   **Issue**: `enrichImages` loads the full `users` document (including encrypted `pollinationsApiKey`).
*   **Required Action**: Split secrets into a `userSecrets` table to keep the main user profile lightweight.

---

## Part 3: Corrections to `convex-bandwidth-audit.md`

The file `todo/convex-bandwidth-audit.md` is the current working document but contains these inaccuracies:

1.  **Following Feed**: It claims the feed "scans public index and OR-filters".
    *   *Correction*: This is **FIXED**. It now uses indexed lookups per user.
2.  **ImageCard N+1**: It claims "Each card opens a separate `isFavorited` socket".
    *   *Correction*: This is **FIXED** via `batchIsFavorited`.
3.  **collect() Scans**: It implies `getUserActiveBatches` is fixed or better.
    *   *Correction*: The DB-read cost is **UNCHANGED**. Only the client response size was fixed.

---

## Next Steps

1.  **Execute P0 Schema Change**: Add `by_owner_status` indexes to `schema.ts`.
2.  **Execute P0 Code Fix**: Update `getUserActiveBatches` and `getActiveGenerations` to utilize the new indexes.
3.  **Plan P0 Major Refactor**: Begin planning the `generatedImages` table split (this is a heavy migration).
