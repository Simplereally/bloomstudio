# Video Preview Refactor Plan

> **Goal:** Remove the blocking ~40s ffmpeg video preview transcode from the critical generation path so the UI shows completed videos immediately, and serve raw R2 files on the feed page instead.

---

## 1. Current Architecture

### Generation Flow (Critical Path)

```
Pollinations API → fetch response → Buffer
  ↓
uploadMediaWithThumbnail(buffer, r2Key, contentType)
  ↓ (for videos, runs in Promise.all)
  ├── uploadToR2(buffer, r2Key)              ~2-5s   (R2 upload)
  ├── extractVideoThumbnail(buffer)          ~3-5s   (ffmpeg first frame → 128x128 JPEG)
  └── generateVideoPreview(buffer)           ~30-40s (ffmpeg full transcode → 720p H.264)
  ↓
  Upload thumbnail to R2 (if extraction succeeded)
  Upload preview to R2  (if generation succeeded)   ← ONLY NOW DOES Promise.all RESOLVE
  ↓
storeGeneratedImage mutation (writes to Convex DB)
  ↓
updateGenerationStatus → "completed"                 ← UI finally sees the video
```

### Where Preview Is Generated

- **`convex/lib/videoPreview.ts`** — `generateVideoPreview()`: writes buffer to temp file, runs ffmpeg with H.264 encoding (720p, 1.5 Mbps, CRF 23, `veryfast` preset), reads output, returns `VideoPreviewResult`.
- **`convex/lib/r2.ts`** — `uploadMediaWithThumbnail()`: orchestrates the `Promise.all` that blocks on preview generation.

### Where Preview Is Consumed

- **`convex/generatedImages.ts`** — `toPublicFeedImages()` helper (line 108-113):
  ```ts
  const isVideo = img.contentType?.startsWith("video/")
  const feedUrl = isVideo && img.previewUrl ? img.previewUrl : img.url
  ```
  Used by `getPublicFeed`, `getImagesByUsername`, and `getFollowingFeed` queries.
- **`components/ui/image-card.tsx`** — Receives `image.url` (which is the `feedUrl` from above). Videos auto-play via `<video src={image.url}>`.

### Where Preview Metadata Is Stored

Schema fields on `generatedImages`:
- `previewR2Key: v.optional(v.string())`
- `previewUrl: v.optional(v.string())`

Written by:
- `convex/singleGeneration.ts` → `storeGeneratedImage`
- `convex/batchGeneration.ts` → `storeGeneratedImage`

### Processors That Call It

Both `singleGenerationProcessor.ts` and `batchProcessor.ts` call `uploadMediaWithThumbnail` and pass `previewR2Key` / `previewUrl` to `storeGeneratedImage`.

---

## 2. Problems

### P0: Blocking Critical Path (~40s delay)
The ffmpeg transcode inside `Promise.all` prevents `uploadMediaWithThumbnail` from returning until the preview is done. The UI cannot mark the generation as "completed" until this finishes, making users wait ~40s after the video is already downloaded from Pollinations.

### P1: Convex Action Compute Cost
Each video preview generation consumes ~40s of action compute (Node.js runtime). On the free plan:
- **2 GB-hours/month** limit
- Each transcode ≈ 0.018 GB-hours (assuming ~256MB memory × 40s)
- ~111 video generations would exhaust the monthly budget
- This does NOT scale for a growing user base

### P2: Unnecessary for Current Use Case
The feed currently auto-plays videos in `<video>` tags. Modern browsers handle progressive download of MP4 files natively (especially with `moov atom` at start from Pollinations). The bandwidth savings from transcoding (~30-50% reduction) don't justify the latency and compute cost at this stage.

### P3: Fragile Error Handling
If `generateVideoPreview` throws an unexpected error (OOM, disk full, ffmpeg crash), it could theoretically break the entire generation despite the `Promise.all` resolving `null` on internal catches. The transcode touching disk I/O and spawning child processes in a serverless environment is inherently fragile.

### P4: Preview R2 Storage Waste
Preview files are additional R2 objects (~60-70% of original size) that duplicate content. The orphan cleanup system (`orphanCleanupQueries.ts`) doesn't even track `previewR2Key`, so previews can become orphaned silently.

---

## 3. Target Architecture

### 3.1 Remove Preview Generation from Critical Path

**Approach:** Simply stop generating video previews entirely. The feed will serve the raw R2 video URL directly.

This is the simplest, most impactful change. We are NOT deferring preview generation to a background job — we are removing it completely for now.

**Rationale:**
- Pollinations already returns reasonably-sized MP4 files (~5-20MB for 5-10s clips)
- Cloudflare R2 has no egress fees, so serving raw files costs the same
- Browser video players handle progressive download well
- If compression becomes needed later, it should be done by a dedicated media pipeline (e.g., Cloudflare Stream, external worker), not in Convex actions

### 3.2 Feed Page Serves Raw R2 Files

**Before:** `toPublicFeedImages()` prefers `previewUrl` over `url` for videos.  
**After:** `toPublicFeedImages()` always uses `url` (the raw R2 URL) for both images and videos.

```ts
// BEFORE
const isVideo = img.contentType?.startsWith("video/")
const feedUrl = isVideo && img.previewUrl ? img.previewUrl : img.url

// AFTER
const feedUrl = img.url  // Always serve raw R2 file
```

The `originalUrl` field in `PublicFeedImage` becomes redundant (it was only distinct from `url` when `previewUrl` was used for feed display), but we keep it for backward compatibility — both will point to `img.url`.

### 3.3 Error Handling Strategy

Since we're removing preview generation, not deferring it, the error handling simplifies dramatically:

- **Thumbnail extraction** (`extractVideoThumbnail`): Stays as-is. It's fast (~3-5s), useful for gallery grids, and already gracefully returns `null` on failure.
- **Preview generation**: Removed from the call site entirely. No error handling needed.
- **Video upload**: Unchanged — already has proper error propagation.

### 3.4 Future Considerations (Out of Scope)

If video compression is needed later, the recommended approach is:
1. **Cloudflare Stream** — Upload to Stream API after R2 upload; get adaptive bitrate HLS URLs
2. **External worker** — Trigger a Cloudflare Worker or external service via webhook after generation completes
3. **Convex scheduled action** — Fire-and-forget background action that transcodes and patches `previewUrl` onto the record after the fact

None of these block the critical path.

---

## 4. Files to Modify

### 4.1 `convex/lib/r2.ts` — Remove preview from upload pipeline

**Changes:**
1. Remove import of `generateVideoPreview` and `shouldGeneratePreview` from `./videoPreview`
2. Remove `generatePreviewKey()` function (or keep as dead code for future use — prefer removal)
3. Simplify `MediaUploadResult` interface — remove `preview` field
4. Simplify `uploadMediaWithThumbnail()`:
   - Remove the `shouldGeneratePreview` / `generateVideoPreview` call from `Promise.all`
   - Remove preview upload logic
   - Return `{ media, thumbnail }` only (no `preview`)

```ts
// BEFORE (video path)
const [mediaResult, thumbnailBuffer, previewResult] = await Promise.all([
    uploadToR2(buffer, r2Key, contentType),
    extractVideoThumbnail(buffer),
    generatePreview ? generateVideoPreview(buffer) : Promise.resolve(null),
])

// AFTER (video path)
const [mediaResult, thumbnailBuffer] = await Promise.all([
    uploadToR2(buffer, r2Key, contentType),
    extractVideoThumbnail(buffer),
])
```

### 4.2 `convex/lib/videoPreview.ts` — Delete file

The entire file can be deleted. Nothing else imports from it except `r2.ts`.

If preferred, keep the file but add a deprecation comment and remove all exports from `r2.ts`.

**Recommendation:** Delete the file. It's 237 lines of dead code. Git history preserves it if we ever need reference.

### 4.3 `convex/lib/index.ts` — Remove re-exports

**Changes:**
- Remove `generatePreviewKey` from the R2 re-exports
- Remove `preview` from `MediaUploadResult` type (if it was exported)
- The `videoPreview.ts` exports are not re-exported here, so no change needed for those

### 4.4 `convex/singleGenerationProcessor.ts` — Stop passing preview data

**Changes:**
1. Remove `generatePreviewKey` from the import
2. Remove preview-related logging
3. Remove `previewR2Key` and `previewUrl` from the `storeGeneratedImage` call
4. Remove preview R2 key from the cancellation cleanup (`keysToDelete`)
5. Update destructuring: `{ media: uploadResult, thumbnail: thumbnailResult }` (drop `preview: previewResult`)

### 4.5 `convex/batchProcessor.ts` — Stop passing preview data

**Same changes as singleGenerationProcessor.ts:**
1. Remove `generatePreviewKey` from the import
2. Remove preview-related logging
3. Remove `previewR2Key` and `previewUrl` from the `storeGeneratedImage` call
4. Update destructuring to drop `preview`

### 4.6 `convex/singleGeneration.ts` — Remove preview args from storeGeneratedImage

**Changes to `storeGeneratedImage` internal mutation:**
1. Remove `previewR2Key` and `previewUrl` from args validator
2. Remove these fields from the `ctx.db.insert` call

### 4.7 `convex/batchGeneration.ts` — Remove preview args from storeGeneratedImage

**Same changes as singleGeneration.ts** for its own `storeGeneratedImage` mutation.

### 4.8 `convex/generatedImages.ts` — Simplify feed URL logic

**Changes to `toPublicFeedImages()`:**
```ts
// BEFORE
const isVideo = img.contentType?.startsWith("video/")
const feedUrl = isVideo && img.previewUrl ? img.previewUrl : img.url

// AFTER
const feedUrl = img.url
```

Also update the JSDoc comments that reference preview URLs.

**Changes to `PublicFeedImage` type:**
- Keep `originalUrl` field but set it to `img.url` (same as `url` now). This avoids breaking any downstream consumers that rely on the `originalUrl` field.
- Update JSDoc: remove references to "preview" and "compressed" versions.

**Changes to `remove` mutation:**
- Currently returns `{ r2Key, thumbnailR2Key }` — this is fine. Preview R2 keys were never returned here for cleanup anyway (this is actually the P4 bug mentioned above).

### 4.9 `convex/orphanCleanupQueries.ts` — Add preview key tracking

**Changes:**
- Add `previewR2Key` collection alongside `thumbnailR2Key`:
  ```ts
  if (img.previewR2Key) {
      keys.push(img.previewR2Key)
  }
  ```
- This ensures the orphan cleanup system properly handles existing preview R2 objects and any that might be in the `previews/` prefix.

**Also add `previews/` prefix to `orphanCleanup.ts`:**
- The `prefixes` array currently only scans `["generated/", "thumbnails/", "reference/"]`
- Add `"previews/"` so orphaned preview files get cleaned up

### 4.10 `convex/generatedImages.ts` — `removeMany` mutation

**Changes:**
- Collect `previewR2Key` alongside `thumbnailR2Key` for R2 cleanup:
  ```ts
  if (image.previewR2Key) {
      // Return for R2 cleanup along with other keys
  }
  ```
- This fixes the pre-existing bug where deleting an image with a preview leaves the preview orphaned in R2 until the nightly cron catches it.

### 4.11 UI Components — No changes needed

- **`components/ui/image-card.tsx`**: No changes. It receives `image.url` from the query layer and renders it. The query layer change (4.8) handles the URL switch transparently.
- **`components/ui/smart-video.tsx`**: No changes. Used in `VideoSlideshow`, not in the feed path.
- **`components/ui/media-player.tsx`**: No changes. Used in lightbox, receives `url` prop.
- **`components/gallery/feed-client.tsx`**: No changes. Passes data from server action to `PaginatedImageGrid`.
- **`components/gallery/paginated-image-grid.tsx`**: No changes. Passes `image` to `ImageCard`.

---

## 5. Database Schema Changes

### No schema migration required.

The `previewR2Key` and `previewUrl` fields on `generatedImages` are already `v.optional(v.string())`. We simply stop writing to them for new records. Existing records retain their values harmlessly.

**Schema fields (unchanged):**
```ts
// These stay in schema.ts — removing them would require a migration
previewR2Key: v.optional(v.string()),
previewUrl: v.optional(v.string()),
```

**Why not remove from schema?**
- Convex schema changes that remove fields require all existing documents to not have those fields, OR the fields must be optional (they already are)
- Keeping them optional and unused is safe — they consume no space when absent on new records
- Existing records with preview data still need these fields to be valid

---

## 6. Migration Strategy

### Phase 1: Deploy Code Changes (Day 1)

1. **Remove preview generation from processors** (4.4, 4.5)
   - New generations immediately benefit — no preview transcode, ~35s faster
   - This is the highest-impact change and should ship first

2. **Update feed queries to use raw URL** (4.8)
   - New videos serve raw URL immediately
   - Existing videos with `previewUrl` will now serve raw URL too (slight bandwidth increase for those specific videos, but better consistency)

3. **Remove preview from upload pipeline** (4.1, 4.2, 4.3)
   - Cleanup code that's no longer called
   - Remove `videoPreview.ts`

4. **Remove preview args from store mutations** (4.6, 4.7)
   - These mutations will no longer receive preview data

5. **Fix orphan cleanup** (4.9, 4.10)
   - Add `previewR2Key` tracking and `previews/` prefix scanning
   - Ensures existing previews get cleaned up on image deletion

### Phase 2: Cleanup Existing Preview R2 Objects (Day 2-7)

Existing preview files in R2 (under `previews/` prefix) become orphaned once we stop referencing them in feed queries. Clean them up:

1. **Run orphan audit** first (via Convex dashboard):
   ```
   internal.orphanCleanup.auditOrphanedR2Objects
   ```
   This will now include `previews/` prefix and show how many preview files exist.

2. **Run cleanup** (dry run first, then real):
   ```
   internal.orphanCleanup.cleanupOrphanedR2Objects({ dryRun: true })
   internal.orphanCleanup.cleanupOrphanedR2Objects({ dryRun: false })
   ```

3. **Alternatively**, let the nightly cron handle it automatically (it runs at 3:00 AM UTC daily). Once the `previews/` prefix is added, orphaned previews will be cleaned up within 24 hours.

### Phase 3: Schema Cleanup (Optional, Low Priority)

After all existing preview R2 objects are deleted and enough time has passed:

1. **Null out preview fields on existing records** (optional migration):
   ```ts
   // One-time migration: clear previewR2Key and previewUrl on all records
   const images = await ctx.db.query("generatedImages")
       .filter(q => q.neq(q.field("previewR2Key"), undefined))
       .collect()
   for (const img of images) {
       await ctx.db.patch(img._id, { previewR2Key: undefined, previewUrl: undefined })
   }
   ```

2. **Remove fields from schema** (truly optional — leaving them is harmless):
   - Only do this if the team wants a perfectly clean schema
   - Safe to do after all records have been patched

---

## 7. Rollback Plan

### Immediate Rollback (< 5 minutes)

If the feed page has issues after deployment:

1. **Revert the `toPublicFeedImages()` change** in `generatedImages.ts` to restore the `previewUrl` preference logic
2. Deploy — existing records with `previewUrl` will resume serving compressed previews
3. New records (generated after the main change) won't have `previewUrl`, so they'll naturally fall back to `img.url`

### Full Rollback (< 30 minutes)

If we need to fully restore preview generation:

1. `git revert` the merge commit
2. Deploy — restores all preview generation code
3. New generations will again block on ffmpeg transcode

### Partial Rollback (Keep speed, restore quality)

If raw videos are too large for feed bandwidth:

1. Keep preview generation removed from critical path
2. Add a **background job** that generates previews after the fact:
   ```ts
   // In storeGeneratedImage, after insert:
   if (isVideo) {
       await ctx.scheduler.runAfter(0, internal.videoPreviewWorker.generatePreview, {
           imageId,
           r2Key,
       })
   }
   ```
3. The feed query already handles `previewUrl ?? url` gracefully, so previews will appear once generated

### Data Safety

- No data is deleted during Phase 1 deployment
- Existing preview R2 objects remain accessible
- Schema fields remain in place
- The only irreversible action is Phase 2 (R2 object deletion), which is deferred and optional

---

## 8. Testing Checklist

### Pre-Deploy Verification

- [ ] `bun run build` passes with no type errors
- [ ] `bun run lint` passes
- [ ] `bun run test` passes (no broken imports from deleted `videoPreview.ts`)

### Critical Path Tests

- [ ] **Single video generation completes in <10s** after Pollinations returns (vs ~40s before)
- [ ] **Batch video generation** processes items without preview-related errors
- [ ] **Generation cancellation** still cleans up R2 objects (no preview key in cleanup array)
- [ ] **Pending generation status** transitions: pending → processing → completed (no stuck state)

### Feed Display Tests

- [ ] **Public feed** renders videos correctly (auto-play, loop, muted)
- [ ] **Following feed** renders videos correctly
- [ ] **Profile page** (`getImagesByUsername`) renders videos correctly
- [ ] **Videos with existing `previewUrl`** now serve raw URL instead (verify in browser network tab)
- [ ] **New videos** (no `previewUrl`) display correctly in feed
- [ ] **Image content** (non-video) unaffected — still uses `img.url` as before

### Lightbox / Detail Tests

- [ ] **Lightbox** opens and plays video from `originalUrl` (should be same as `url` now)
- [ ] **Image detail page** (`getById`) returns correct URLs

### Gallery Tests

- [ ] **User gallery** (`getMyImages`) — thumbnails still work for videos (thumbnail extraction is unchanged)
- [ ] **History page** (`getMyImagesWithDisplayData`) — videos display correctly

### Deletion / Cleanup Tests

- [ ] **Single delete** (`remove`) returns correct R2 keys (no preview key crash)
- [ ] **Bulk delete** (`removeMany`) handles records with and without preview keys
- [ ] **Orphan audit** now scans `previews/` prefix
- [ ] **Orphan cleanup** deletes orphaned preview files

### Edge Cases

- [ ] **Video < 5MB** (was below `shouldGeneratePreview` threshold) — should work identically to before
- [ ] **Video > 5MB** — no longer triggers preview generation, uploads raw only
- [ ] **Image generation** (non-video) — completely unaffected
- [ ] **Concurrent generations** — no race conditions from removed preview logic

### Performance Validation

- [ ] Measure action execution time for video generation (before vs after)
- [ ] Check Convex dashboard for action compute usage reduction
- [ ] Monitor R2 bandwidth for feed page (should increase slightly for videos previously using previews)

---

## 9. Cost Impact

### Action Compute Savings

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Video gen action time | ~45-50s | ~8-12s | **~35-40s per generation** |
| Compute per video gen | ~0.018 GB-hrs | ~0.004 GB-hrs | **~78% reduction** |
| Videos before hitting 2GB-hr limit | ~111 | ~500 | **~4.5x more capacity** |
| Monthly cost at 100 videos/month | ~1.8 GB-hrs | ~0.4 GB-hrs | **Well within free tier** |

### R2 Storage Savings

| Metric | Before | After |
|--------|--------|-------|
| R2 objects per video | 3 (raw + thumbnail + preview) | 2 (raw + thumbnail) |
| Preview storage per video | ~3-15 MB | 0 |
| Monthly storage at 100 videos | ~300-1500 MB of previews | 0 |

### R2 Bandwidth Impact

| Metric | Before | After | Notes |
|--------|--------|-------|-------|
| Feed video bandwidth | ~3-10 MB per view | ~5-20 MB per view | Slight increase |
| R2 egress cost | $0 (Cloudflare) | $0 (Cloudflare) | No cost difference |

**Net impact:** Significant compute savings with zero additional cost, at the tradeoff of slightly higher bandwidth per video view (which is free on Cloudflare R2).

---

## Appendix: Dependency Graph

```
Files that CHANGE:
  convex/lib/r2.ts                      ← Remove preview from Promise.all
  convex/lib/index.ts                   ← Remove re-export of generatePreviewKey
  convex/singleGenerationProcessor.ts   ← Stop passing preview data
  convex/batchProcessor.ts              ← Stop passing preview data
  convex/singleGeneration.ts            ← Remove preview args from storeGeneratedImage
  convex/batchGeneration.ts             ← Remove preview args from storeGeneratedImage
  convex/generatedImages.ts             ← Simplify feed URL logic, fix delete cleanup
  convex/orphanCleanup.ts               ← Add "previews/" prefix
  convex/orphanCleanupQueries.ts        ← Track previewR2Key

Files that are DELETED:
  convex/lib/videoPreview.ts            ← Entire file removed

Files that do NOT change:
  convex/schema.ts                      ← Fields stay optional, no migration
  convex/lib/videoThumbnail.ts          ← Thumbnail extraction stays
  components/ui/image-card.tsx          ← Receives url from query layer
  components/ui/smart-video.tsx         ← Not in feed path
  components/ui/media-player.tsx        ← Lightbox, receives url prop
  components/gallery/feed-client.tsx    ← Passes data through
  components/gallery/paginated-image-grid.tsx ← Passes data through
  app/_server/actions/feed.ts           ← Server actions unchanged
  app/_server/cache/feed.ts             ← Cache layer unchanged
```
