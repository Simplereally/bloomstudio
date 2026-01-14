# Public Feed Phase 2: Image Quality & Priority Loading

## Overview

The public feed currently serves pre-generated thumbnails (`thumbnailUrl`) which are tiny dimensions (optimized for minimal bandwidth). While this was an intentional optimization, it results in stretched, low-quality, blurry images when displayed at the actual card dimensions in the masonry feed layout.

Rather than setting up a full image processing pipeline to generate appropriately-sized thumbnails that match the feed card dimensions, the immediate solution is to serve the original full-size images. To mitigate the bandwidth impact of this change, we need a smart loading strategy that:

1. Prioritizes the first batch of visible images (above-the-fold)
2. Maintains lazy loading for images below the fold
3. Does not negatively impact JavaScript time-to-paint or LCP metrics

**Created:** 2026-01-14

---

## Goals

1. Display full-quality images in the feed instead of stretched thumbnails
2. Implement tiered priority loading for optimal perceived performance
3. Maintain good Core Web Vitals (LCP, FID, CLS)
4. Keep lazy loading for below-the-fold content

---

## Phase 1: Switch to Original Image URLs

### 1.1 Update toPublicFeedImages Helper

**Current State (convex/generatedImages.ts, lines 93-112):**
```typescript
function toPublicFeedImages(images: EnrichedImage[]): PublicFeedImage[] {
    return images.map(img => ({
        // ...
        // Prefer thumbnail for gallery display, fall back to original for legacy images
        url: img.thumbnailUrl ?? img.url,  // <-- Problem: thumbnailUrl is tiny
        // Always include original URL for when user opens lightbox
        originalUrl: img.url,
        // ...
    }))
}
```

**Problem:**
- `thumbnailUrl` is a tiny pre-generated thumbnail (e.g., 150x150px)
- Feed cards display at 360px+ width (see `PaginatedImageGrid` minColumnWidth)
- Resulting stretch makes images appear blurry and pixelated

**Implementation:**
- [x] Modify `toPublicFeedImages` to use `img.url` instead of `img.thumbnailUrl`
- [x] Keep `originalUrl` field for API consistency (can be same as `url`)   
- [x] Consider renaming or documenting the change clearly

**Proposed Code Change:**
```typescript
function toPublicFeedImages(images: EnrichedImage[]): PublicFeedImage[] {
    return images.map(img => ({
        // ...
        // Use full-size image for proper display quality
        // Note: thumbnailUrl is too small for feed card dimensions
        url: img.url,
        originalUrl: img.url,
        // ...
    }))
}
```

**Files to Modify:**
- `convex/generatedImages.ts` - Update `toPublicFeedImages` function (line 98)

### 1.2 Consider toThumbnails for Other Use Cases

**Current State:**
- `toThumbnails` (lines 224-237) is used for personal gallery/history views
- Also uses `thumbnailUrl ?? url`

**Decision Point:**
- [ ] Audit where `toThumbnails` is used
- [ ] If used in contexts where small thumbnails are acceptable (e.g., compact history sidebar), leave as-is
- [ ] If used in full gallery views, apply same fix

**Research Needed:**
- Trace usage of `getMyImages` query to determine appropriate thumbnail vs full-size decision

---

## Phase 2: Priority-Based Image Loading

### 2.1 Add Priority Prop to ImageCard

**Current State (components/ui/image-card.tsx):**
```tsx
<Image
    src={image.url}
    alt={image.prompt || "Generated image"}
    width={width}
    height={height}
    className="..."
    loading="lazy"  // <-- Always lazy
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
/>
```

**Problem:**
- All images use `loading="lazy"` regardless of position
- First batch (above-the-fold) should load with higher priority

**Implementation:**
- [x] Add `priority?: boolean` prop to `ImageCardProps` interface
- [x] Add `eager?: boolean` prop for explicit eager loading
- [x] Pass `priority` to `next/image` component
- [x] Set `loading={priority ? "eager" : "lazy"}` based on prop

**Proposed Interface Update:**
```typescript
interface ImageCardProps {
    image: ImageCardData
    showUser?: boolean
    onSelect?: (image: ImageCardData) => void
    selectionMode?: boolean
    isSelected?: boolean
    onSelectionChange?: (id: string, selected: boolean) => void
    className?: string
    /** If true, image loads with high priority (above-the-fold) */
    priority?: boolean
}
```

**Proposed Image Component Update:**
```tsx
<Image
    src={image.url}
    alt={image.prompt || "Generated image"}
    width={width}
    height={height}
    className="..."
    loading={priority ? "eager" : "lazy"}
    priority={priority}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
/>
```

**Files to Modify:**
- `components/ui/image-card.tsx` - Add priority prop and pass to Image

### 2.2 Update PaginatedImageGrid to Pass Priority

**Current State (components/gallery/paginated-image-grid.tsx, lines 167-177):**
```tsx
{images.map((image) => (
    <ImageCard
        key={image._id}
        image={image}
        showUser={showUser}
        onSelect={handleSelectImage}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(image._id)}
        onSelectionChange={onSelectionChange}
    />
))}
```

**Implementation:**
- [ ] Determine first batch size (e.g., first 8-12 images)
- [ ] Pass `priority={true}` for first batch
- [ ] Pass `priority={false}` or omit for subsequent batches

**Priority Strategy:**
The number of "above-the-fold" images varies by viewport, but we can estimate:
- Mobile (1 col): ~3-4 images
- Tablet (2-3 cols): ~6-8 images
- Desktop (3-4 cols): ~8-12 images

Conservative approach: First 8 images get priority.

**Proposed Code Change:**
```tsx
const PRIORITY_COUNT = 8  // First N images load with priority

{images.map((image, index) => (
    <ImageCard
        key={image._id}
        image={image}
        showUser={showUser}
        onSelect={handleSelectImage}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(image._id)}
        onSelectionChange={onSelectionChange}
        priority={index < PRIORITY_COUNT}
    />
))}
```

**Edge Case: Pagination**
When new batches load, only the very first page should have priority images. Once the user scrolls and triggers `loadMore`, new images should NOT get priority.

- [x] Track whether this is the first batch of images
- [x] Only apply priority to first render, not appended batches

**Refined Implementation:**
```tsx
// Track if this is the initial load to avoid prioritizing scrolled-in images
const isInitialRender = useRef(true)
useEffect(() => {
    if (images.length > 0) {
        isInitialRender.current = false
    }
}, [images.length])

// Only first PRIORITY_COUNT images AND only on initial render
const shouldPrioritize = (index: number) => 
    isInitialRender.current && index < PRIORITY_COUNT
```

**Files to Modify:**
- `components/gallery/paginated-image-grid.tsx` - Pass priority to ImageCard based on index

---

## Phase 3: Video Priority Consideration

### 3.1 Apply Priority to Video Thumbnails

**Current State:**
- Videos display with a poster/thumbnail initially
- Video element uses `preload="metadata"`

**Consideration:**
- Videos are less common in the feed but should also benefit from priority loading
- Video poster/thumbnail should load with priority if in first batch
- Actual video source should remain lazy (load on hover)

**Implementation:**
- [ ] If video has a separate thumbnail URL, that could use priority
- [ ] Currently, videos just show first frame via `preload="metadata"`
- [ ] May not need changes for videos in MVP

---

## Phase 4: Performance Validation

### 4.1 Verify Core Web Vitals

**Metrics to Monitor:**
- **LCP (Largest Contentful Paint):** Should improve with priority loading
- **FID (First Input Delay):** Should not regress from larger image downloads
- **CLS (Cumulative Layout Shift):** Already handled by aspect ratio styling

**Implementation:**
- [ ] Test on Lighthouse before and after changes
- [ ] Check Network waterfall for priority image loading
- [ ] Verify lazy images don't block JavaScript execution

### 4.2 Bandwidth Considerations

**Trade-off:**
- Original images are larger (1-5MB) vs thumbnails (~10-50KB)
- Acceptable for public feed since it's the hero experience
- Images are cached at edge (R2 with CacheControl: immutable)

**Mitigations Already in Place:**
- `sizes` attribute limits download size based on viewport
- Next.js image optimization serves appropriate resolutions
- Lazy loading prevents downloading all images at once

---

## Phase 5: Future Optimization (Not in Scope)

### 5.1 Generate Feed-Optimized Thumbnails (Future)

If bandwidth becomes a concern, consider:
- Generate thumbnails at 600px, 900px, 1200px widths
- Store in R2 with naming convention (e.g., `{key}_600w.webp`)
- Update queries to return appropriate thumbnail for context

This is explicitly **not** in scope for this story to avoid pipeline complexity.

---

## Implementation Priority Order

### High Priority (MVP)
1. [x] Update `toPublicFeedImages` to use `img.url` instead of `thumbnailUrl`
2. [x] Add `priority` prop to `ImageCard` component
3. [x] Update `ImageCard` to pass `priority` to `next/image`
4. [x] Update `PaginatedImageGrid` to set `priority={true}` for first batch

### Medium Priority (Polish)
5. [x] Only apply priority on initial render (not paginated batches)
6. [ ] Verify no regression in LCP/FID metrics
7. [ ] Test on various viewport sizes

### Low Priority (Future)
8. [ ] Audit `toThumbnails` usage for similar fixes
9. [ ] Consider feed-optimized thumbnail pipeline (future story)

---

## Technical Considerations

### Next.js Image Optimization

The Next.js `<Image>` component with `priority={true}`:
- Adds `fetchpriority="high"` attribute
- Disables lazy loading
- Preloads image in `<head>`

This ensures critical images load as early as possible in the rendering waterfall.

### Batch Detection Logic

To avoid prioritizing images from paginated batches:
```tsx
// Simple approach: track initial image count
const [initialCount] = useState(images.length)
const isFromInitialBatch = (index: number) => index < initialCount && index < PRIORITY_COUNT
```

Or use a ref to track initial render state.

### Masonry Grid Considerations

The `MasonryGrid` component renders items in column order, not row order. This means "first N items" may not be exactly "top N visible items." However, for priority loading, this approximation is acceptable since all above-the-fold images will be in the first batch anyway.

---

## Related Files Summary

### Files to Modify
- `convex/generatedImages.ts` - Change `toPublicFeedImages` to use full URL (line 98)
- `components/ui/image-card.tsx` - Add priority prop, pass to Image component
- `components/gallery/paginated-image-grid.tsx` - Pass priority to first batch of cards

### Files to Potentially Audit
- `convex/generatedImages.ts` - Check `toThumbnails` usage
- Any other gallery components using ImageCard

### No New Files Required

---

## Testing Checklist

- [ ] Feed displays crisp, full-quality images (not blurry)
- [ ] First 8 images load immediately (check Network tab)
- [ ] Subsequent images lazy load on scroll
- [ ] Paginated batches do NOT get priority loading
- [ ] LCP metric is maintained or improved
- [ ] No layout shift from image loading
- [ ] Mobile, tablet, and desktop viewports tested

---

## References

- [Next.js Image Priority](https://nextjs.org/docs/pages/api-reference/components/image#priority)
- [Web.dev LCP Guide](https://web.dev/lcp/)
- [ImageCard Component](components/ui/image-card.tsx)
- [PaginatedImageGrid](components/gallery/paginated-image-grid.tsx)
- [Convex Queries](convex/generatedImages.ts)
