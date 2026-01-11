# Public Feed for Unauthenticated Users

## Overview

### Motivation

The public feed presents a significant opportunity to drive organic user acquisition. By making community creations visible to non-signed-in users, visitors who discover Bloom Studio through search engines or direct links can immediately see the quality and variety of content that can be generated on the platform. This "inspiration effect" serves as a powerful conversion tool—when potential users see beautiful AI-generated images and videos created by the community, they're naturally drawn to sign up and create their own.

This approach is modeled after **Leonardo AI's** community creations page (`app.leonardo.ai`), where all public generations are visible in an infinite-scrolling feed layout, accessible to anyone. This gives potential users a good indication of the quality achievable through the platform's models before committing to sign up.

### Key Considerations

1. **Authorization**: The public feed must be accessible without authentication, while protecting user-specific features like the "Following" feed and favorites.

2. **Image Optimization**: While images should display at the same visual size in the dynamic masonry layout, we need to serve compressed/thumbnail versions to save bandwidth when serving to the general public. Full-resolution images would only be loaded when a user clicks to view details.

3. **Feature Gating**: Authenticated features like "Copy Prompt" and "Save to Library" should either be hidden or shown in a disabled state with sign-in prompts—demonstrating the value of creating an account while not cluttering the unauthenticated experience.

4. **SEO & Indexing**: The feed page should be indexed by Google since it's excellent discovery content. Users searching for AI image generation examples could land on the feed and be inspired to sign up.

5. **Video Handling**: Videos in the feed should auto-play (muted) to showcase motion content effectively. However, compression must be balanced carefully—too much compression would degrade quality, defeating the purpose of showcasing what the platform can produce.

**Created:** 2026-01-12

---

## Goals

1. Inspire visitors to sign up by showcasing high-quality community creations
2. Improve SEO with crawlable, indexable content
3. Maintain performance with optimized asset delivery
4. Provide clear upgrade prompts for premium features

---

## Phase 1: Authorization & Access Control

### 1.1 Remove Feed Route from Protected Routes

**Current State:**
- `proxy.ts` defines protected routes via `isProtectedRoute` matcher
- `/feed` is NOT currently in the protected routes list (good!)
- However, the feed uses `useFeed()` hook which calls Convex queries

**Research Needed:**
- [ ] Verify if `getPublicFeed` Convex query requires authentication
- [ ] Check if Convex client works without Clerk auth token for public queries

**Implementation:**
- [ ] Audit `convex/generatedImages.ts` → `getPublicFeed` query
  - Currently: No auth check - queries `by_visibility` index for `"public"` images
  - Appears to already work without auth ✓
- [ ] Test feed page in incognito/logged-out state
- [ ] Ensure `ConvexClientProvider` works without auth for public queries

**Files to Modify:**
- `app/feed/[type]/page.tsx` - May need conditional rendering for auth state
- `components/gallery/feed-client.tsx` - Check for auth dependencies
- `hooks/queries/use-image-history.ts` - `useFeed` hook

### 1.2 Separate Public vs Following Feed Access

**Current State:**
- `FeedType = "public" | "following"`
- Following feed requires auth (calls `getFollowingFeed` which checks `ctx.auth`)

**Implementation:**
- [ ] Add route-level access control for `/feed/following`
  - Option A: Add to `isProtectedRoute` in `proxy.ts`
  - Option B: Redirect unauthenticated users from following feed to public feed
- [ ] Update `FeedTabs` component to hide/disable "Following" tab for unauthenticated users
- [ ] Show sign-in prompt if unauthenticated user tries to access following feed

**Files to Modify:**
- `proxy.ts` - Add `/feed/following` to protected routes (preferred)
- `components/gallery/feed-tabs.tsx` - Conditional tab rendering

---

## Phase 2: Image Optimization & Thumbnails

### 2.1 Thumbnail Serving for Feed

**Current State:**
- Thumbnail migration completed - images have `thumbnailUrl` field
- `toThumbnails()` helper already uses `thumbnailUrl` when available
- Feed queries return full image data, not thumbnail-optimized format

**Research Needed:**
- [ ] Measure current payload size for feed queries
- [ ] Determine optimal thumbnail dimensions for feed cards
- [ ] Research Cloudflare R2 image resizing/optimization options

**Best Practice Research:**
- [ ] Cloudflare Image Resizing (if available on R2)
- [ ] Sharp.js on-the-fly resizing via API route
- [ ] Pre-generated responsive sizes (320w, 640w, 1280w)
- [ ] Modern formats: WebP/AVIF support

**Implementation:**
- [ ] Create new query for feed optimized for public display:
  ```typescript
  // Returns: id, thumbnailUrl, originalUrl, width, height, prompt (truncated?), ownerName, ownerPictureUrl
  export const getPublicFeedOptimized = query({ ... })
  ```
- [ ] Ensure `PaginatedImageGrid` uses `thumbnailUrl` for display, `originalUrl` for lightbox
- [ ] Add `srcset` responsive images for better bandwidth on mobile

**Files to Modify:**
- `convex/generatedImages.ts` - Add optimized public feed query
- `components/gallery/paginated-image-grid.tsx` - Use optimized data
- `components/ui/image-card.tsx` - Implement responsive images

### 2.2 Lightbox Full-Resolution Loading

**Current State:**
- Lightbox receives full image URL from feed data
- No lazy loading of full-res on lightbox open

**Implementation:**
- [ ] Update `ImageLightbox` to:
  1. Display thumbnail immediately (already loaded)
  2. Load full resolution in background
  3. Crossfade when full-res is ready
- [ ] Consider blur-up placeholder effect for premium feel

**Files to Modify:**
- `components/images/image-lightbox.tsx`
- `hooks/use-image-lightbox.ts` (if exists)

---

## Phase 3: UI Changes for Unauthenticated Users

### 3.1 Hide/Disable Auth-Required Features

**Current State:**
- `ImageCard` shows copy prompt button (works without auth)
- `ImageCard` shows favorite button (requires auth - already gated with `isSignedIn`)
- `ImageLightbox` shows "Save to Library" button

**Implementation:**
- [ ] Audit all interactive features on feed/lightbox for auth requirements
- [ ] For unauthenticated users:
  
  **Option A: Hide completely**
  - Cleaner UI, less confusion
  - User doesn't know features exist until sign-up
  
  **Option B: Show disabled with tooltip/prompt**
  - Shows value of signing up
  - "Sign in to save to your library" tooltip
  - Recommended approach for conversion ✓

- [ ] Update `ImageCard`:
  - Copy prompt: Keep enabled (great hook for engagement)
  - Favorite heart: Already hidden when `!isSignedIn` ✓
  - Add "Sign in to save" tooltip on hover for unauthenticated

- [ ] Update `ImageLightbox`:
  - "Save to Library" button: Show disabled with sign-in prompt
  - Other metadata: Keep visible

**Files to Modify:**
- `components/ui/image-card.tsx` - Lines 260-310 (button section)
- `components/images/image-lightbox.tsx` - Lines 298-320 (save button section)

### 3.2 Add Sign-Up Call-to-Action

**Implementation:**
- [ ] Add floating CTA on feed page for unauthenticated users:
  - "Create your own masterpiece" button
  - Link to `/sign-up`
- [ ] Add CTA in lightbox footer for unauthenticated users
- [ ] Consider sticky banner after scrolling X images

**Files to Create/Modify:**
- `components/gallery/feed-cta.tsx` (new)
- `app/feed/[type]/page.tsx` - Add CTA component

---

## Phase 4: Video Optimization

### 4.1 Video Thumbnail & Preview

**Current State:**
- Videos use `<video>` tag with `preload="metadata"`
- Shows play button overlay
- No autoplay on feed

**Research Needed:**
- [ ] Research video thumbnail extraction options:
  - Server-side: FFmpeg frame extraction (already have `videoThumbnail.ts`)
  - Client-side: Canvas scrubbing
- [ ] Analyze competitor implementations (Leonardo AI, etc.)
- [ ] Measure bandwidth impact of video previews

**Implementation:**
- [ ] Ensure video thumbnails are generated (static image from first frame)
- [ ] For feed display:
  - Show static thumbnail by default
  - On hover: Play first 2-3 seconds muted (GIF-like preview)
  - Lazy load video source on intersection
- [ ] Consider compressed preview versions:
  - Source video: Full quality (user's creation)
  - Preview: Lower bitrate for feed display (e.g., 720p, 30fps, lower CRF)

**Quality vs Performance Balance:**
- [ ] Define target bitrate for feed preview videos
- [ ] A/B test quality thresholds with user feedback
- [ ] Consider resolution tier: 480p for mobile, 720p for desktop

**Files to Modify:**
- `components/ui/image-card.tsx` - Video preview behavior (lines 165-182)
- `convex/lib/videoThumbnail.ts` - If enhancements needed
- `components/ui/smart-video.tsx` - Add hover autoplay functionality

### 4.2 Video Autoplay on Feed

**Implementation:**
- [ ] Add hover-to-play behavior:
  ```tsx
  // On mouse enter: video.play()
  // On mouse leave: video.pause(); video.currentTime = 0
  ```
- [ ] Ensure muted for autoplay compliance
- [ ] Limit concurrent autoplaying videos (performance)
- [ ] Use Intersection Observer to pause off-screen videos

**Files to Modify:**
- `components/ui/image-card.tsx`
- `hooks/use-smart-video.ts` - Enhance for hover behavior

---

## Phase 5: SEO & Indexing

### 5.1 Add Feed to Sitemap

**Current State:**
- `app/sitemap.ts` generates sitemap with static pages and solutions
- Feed pages not included

**Implementation:**
- [ ] Add `/feed/public` to sitemap:
  ```typescript
  // Add to staticPages array
  "/feed/public",
  ```
- [ ] Consider: Should individual images be in sitemap?
  - Pros: More crawlable content, long-tail SEO
  - Cons: Sitemap bloat, dynamic content management
  - Recommendation: Start with feed page only, evaluate later

**Files to Modify:**
- `app/sitemap.ts` - Add feed routes

### 5.2 Update robots.txt

**Current State:**
- `app/robots.ts` disallows `/api/` and `/studio/`
- Feed pages are allowed (not disallowed)

**Implementation:**
- [ ] Verify feed is crawlable (no unintended disallow)
- [ ] Consider adding explicit allow for clarity:
  ```typescript
  allow: ["/", "/feed/"],
  ```

**Files to Modify:**
- `app/robots.ts` - Explicit allow if desired

### 5.3 Feed Page SEO Metadata

**Current State:**
- Feed page has no custom metadata

**Implementation:**
- [ ] Add metadata to feed page:
  ```typescript
  export const metadata: Metadata = {
    title: "Community Creations | Bloom Studio",
    description: "Explore stunning AI-generated images and videos created by the Bloom Studio community. Get inspired and create your own masterpieces.",
    openGraph: {
      title: "Community Creations | Bloom Studio",
      description: "...",
      images: [/* Dynamic or curated showcase image */],
    },
  }
  ```
- [ ] Consider dynamic OG image with recent creations collage

**Files to Modify:**
- `app/feed/[type]/page.tsx` - Add metadata export

### 5.4 Structured Data (JSON-LD)

**Implementation:**
- [ ] Add ImageGallery schema for feed:
  ```typescript
  <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": "Bloom Studio Community Creations",
    "description": "...",
  }} />
  ```

**Files to Modify:**
- `app/feed/[type]/page.tsx` - Add JsonLd component

---

## Phase 6: Performance & Caching

### 6.1 Edge Caching for Public Feed

**Research Needed:**
- [ ] Investigate CDN caching options:
  - Vercel Edge caching for API responses
  - Cloudflare R2 caching headers
  - Convex caching strategies

**Implementation:**
- [ ] Add appropriate cache headers for public feed data
- [ ] Consider ISR (Incremental Static Regeneration) for feed page
- [ ] Cache public image URLs at edge

### 6.2 Lazy Loading Optimization

**Implementation:**
- [ ] Implement progressive image loading:
  - Load above-fold images immediately
  - Use Intersection Observer for below-fold
  - Preload next batch on scroll
- [ ] Consider virtual scrolling for very long feeds

---

## Phase 7: Analytics & Conversion Tracking

### 7.1 Track Unauthenticated User Behavior

**Implementation:**
- [ ] Add analytics events:
  - Feed page view (unauthenticated vs authenticated)
  - Image interactions (click, hover, lightbox open)
  - Sign-up click from feed
  - Time spent on feed
- [ ] Track conversion funnel: Feed → Sign-up → First creation

**Files to Modify:**
- Consider adding Vercel Analytics custom events
- Or integrate with analytics provider

---

## Implementation Priority Order

### High Priority (MVP)
1. [ ] Verify public feed works without auth
2. [ ] Hide "Following" tab for unauthenticated users
3. [ ] Add feed to sitemap
4. [ ] Add feed page metadata
5. [ ] Disable "Save to Library" for unauthenticated (show prompt)

### Medium Priority (Enhancement)
6. [ ] Optimize feed query for thumbnail-only data
7. [ ] Add responsive images (srcset)
8. [ ] Video hover-to-play
9. [ ] Add sign-up CTA component
10. [ ] Structured data (JSON-LD)

### Low Priority (Polish)
11. [ ] Lightbox thumbnail-to-full-res crossfade
12. [ ] Compressed video previews
13. [ ] Edge caching optimizations
14. [ ] Conversion analytics

---

## Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Convex public queries rate limiting | High | Monitor usage, implement client-side caching |
| Bandwidth costs for thumbnails | Medium | Use aggressive caching, optimize sizes |
| Video autoplay performance | Medium | Limit concurrent videos, use Intersection Observer |
| SEO indexing delays | Low | Submit sitemap to Search Console, monitor coverage |
| Spam/abuse of public feed | Medium | Moderation tools, rate limiting (future) |

---

## Related Files Summary

### Core Files to Modify
- `proxy.ts` - Protected routes
- `app/feed/[type]/page.tsx` - Feed page layout
- `app/sitemap.ts` - SEO sitemap
- `app/robots.ts` - Crawler rules
- `components/gallery/feed-client.tsx` - Feed component
- `components/gallery/feed-tabs.tsx` - Navigation tabs
- `components/gallery/paginated-image-grid.tsx` - Image grid
- `components/ui/image-card.tsx` - Individual cards
- `components/images/image-lightbox.tsx` - Modal viewer
- `convex/generatedImages.ts` - Data queries

### Supporting Files
- `lib/feed-types.ts` - Type definitions
- `hooks/queries/use-image-history.ts` - Data hooks
- `components/ui/smart-video.tsx` - Video component
- `convex/lib/r2.ts` - Storage utilities
- `convex/thumbnailMigration.ts` - Thumbnail system

---

## References

- [Leonardo AI Community Creations](https://app.leonardo.ai/ai-generations) - Competitive reference
- [Pollinations API](https://pollinations.ai/) - Image generation API
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
- [Vercel Image Optimization](https://vercel.com/docs/concepts/image-optimization)
- [Web Core Vitals](https://web.dev/vitals/) - Performance targets
