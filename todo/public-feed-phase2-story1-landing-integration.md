# Public Feed Phase 2: Landing Page Integration

## Overview

The public feed, designed as a "hero" discovery instrument, currently exists at `/feed/public` but has no presence on the home landing page. There is no clear navigation path to the feed, nor any preview of community content that showcases the platform's creative potential to first-time visitors.

The landing page is already polished and well-designed with sections for Showcase, Features, and Models. However, integrating the infinite feed or a preview of it would significantly enhance the conversion funnel by letting visitors immediately see real community creations.

**Created:** 2026-01-14

---

## Goals

1. Add a navigation link to the Community Feed in the header menu
2. Create a new landing page section that showcases community creations
3. Link prominently to the full feed experience from this section
4. Maintain the existing premium aesthetic of the landing page

---

## Phase 1: Navigation Menu Updates

### 1.1 Add Feed Link to Landing Header

**Current State:**
- `LandingHeader` (`components/landing/landing-header.tsx`) has desktop and mobile navigation
- Nav items: Showcase, Compare, Features, Models, Pricing
- No link to `/feed/public` (community creations)

**Implementation:**
- [x] Add "Community" or "Explore" nav link to desktop navigation
  - Position: After "Models" (hash link), before "Pricing" (route link)
  - Link to `/feed/public`
  - Use same button styling as other nav items
- [x] Add corresponding link to mobile navigation menu
- [x] Consider adding a subtle badge or sparkle indicator (optional, for visibility)

**Files to Modify:**
- `components/landing/landing-header.tsx` - Add nav link to both desktop (lines ~89-161) and mobile (lines ~210-277) navigation

### 1.2 Consider Header Feed Link on Other Pages

**Current State:**
- Main app header (`components/layout/header.tsx`) exists for authenticated views
- May or may not include a link to the feed

**Research Needed:**
- [ ] Check if `components/layout/header.tsx` needs a feed link
- [ ] Ensure consistent navigation across all page types

---

## Phase 2: Community Creations Section on Landing Page

### 2.1 Create FeedPreviewSection Component

**Purpose:**
A new landing page section that displays a curated preview of community creations, encouraging visitors to explore the full feed.

**Design Considerations:**
- Should integrate with existing landing page aesthetic (glass morphism, gradients, animations)
- Show 6-9 images in a compact, visually appealing grid
- Images should be striking examples (possibly curated or top-rated)
- Include clear CTA to "Explore All Creations" → `/feed/public`

**Implementation Options:**

**Option A: Static Curated Preview (Recommended for MVP)**
- Pre-select 6-9 high-quality images to showcase
- Store as static data or fetch a curated subset server-side
- Pros: Fast, no API calls, guaranteed quality
- Cons: Not dynamic, requires manual curation

**Option B: Dynamic Recent Creations**
- Fetch recent public images using `getPublicFeed` with small page size
- Shows real-time community activity
- Pros: Always fresh content
- Cons: Quality variance, requires Convex client on landing page

**Option C: Hybrid Approach**
- Server-side fetch of recent images at build time (ISR)
- Fallback to curated static images
- Best of both worlds

**Proposed Implementation (Option A for initial release):**
- [x] Create `components/landing/community-section.tsx`
- [x] Use `ScrollReveal` for entrance animation
- [x] Create a responsive grid (2 cols mobile, 3 cols tablet, 4+ cols desktop)
- [x] Each image: thumbnail with hover overlay showing prompt preview
- [x] Large CTA button: "Explore Community Creations" → `/feed/public`
- [x] Add section ID `#community` for anchor navigation

**Component Structure:**
```tsx
// Proposed structure
export function CommunitySection() {
  return (
    <section 
      id="community" 
      className="py-24 xl:py-28 2xl:py-32 3xl:py-40 4xl:py-48 5xl:py-56 3xl:min-h-[calc(100vh-4rem)] 3xl:flex 3xl:flex-col 3xl:justify-center relative"
    >
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Join Our Creative Community</h2>
          <p className="text-lg text-muted-foreground mb-8">See what the community is creating with AI</p>
        </ScrollReveal>
        
        <ScrollReveal delay={200}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 3xl:gap-6 4xl:gap-8">
            {/* Preview images with glass overlay on hover - recommend 1:1 aspect ratio for consistency */}
          </div>
        </ScrollReveal>
        
        <ScrollReveal delay={400}>
          <Link href="/feed/public">
            <Button size="lg">
              Explore All Creations
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
```

**Files to Create:**
- `components/landing/community-section.tsx` - New section component

### 2.2 Integrate Section into Landing Page

**Current Landing Page Structure (app/page.tsx):**
```tsx
<HeroSection />
<ShowcaseSection />
<ValuePropSection />
<FeaturesSection />
<ModelsSection />
<CtaSection />
<Footer />
```

**Proposed Placement:**
- Insert `CommunitySection` between `ModelsSection` and `CtaSection`
- This creates a natural flow: See Models → See Community Results → Sign Up

**Implementation:**
- [x] Import `CommunitySection` in `app/page.tsx`
- [x] Add between ModelsSection and CtaSection
- [x] Update `LANDING_SECTIONS` in `landing-header.tsx` to include "community" for scroll spy: `"hero", "showcase", "compare", "features", "models", "community", "get-started"`

**Files to Modify:**
- `app/page.tsx` - Add CommunitySection import and render
- `components/landing/landing-header.tsx` - Add "community" to LANDING_SECTIONS if adding to nav

---

## Phase 3: Preview Image Assets

### 3.1 Curate Community Images

**Implementation:**
- [x] Select 6-9 high-quality images from the public feed
- [x] Ensure variety: different models, styles, aspect ratios
- [x] Download and optimize for web (WebP, appropriate sizing)
- [x] Store in `public/community/` directory
- [x] Create data array with image paths and prompts

**Image Requirements:**
- Max 600px wide (thumbnail size for grid)
- WebP format for bandwidth
- Include prompt text for hover/accessibility
- Mix of portrait and landscape for visual interest (or standard 1:1 squares if masonry layout is not used)

**Files to Create:**
- `public/community/` directory with curated images
- Image metadata can be inline in the component or in a data file

---

## Phase 4: Responsive Design & Polish

### 4.1 Responsive Grid Layout

**Implementation:**
- [x] Mobile (< 640px): 2 columns, smaller images
- [x] Tablet (640-1024px): 3 columns
- [x] Desktop (> 1024px): 4 columns
- [x] Large screens: Add responsive gaps (`3xl:gap-6 4xl:gap-8`) and ensure section fills viewport height (`3xl:min-h-[calc(100vh-4rem)]`) to prevent section leakage

### 4.2 Hover Interactions

**Implementation:**
- [x] Hover overlay with prompt preview (truncated)
- [x] Subtle scale and shadow animations
- [x] Click navigates to `/feed/public` (not individual lightbox)

### 4.3 Section Styling

**Design Elements:**
- [x] Match existing landing page gradients and glass morphism
- [x] Use `ScrollReveal` for staggered entrance animations
- [x] Consider subtle background pattern or gradient
- [x] Ensure adequate spacing above and below section

---

## Implementation Priority Order

### High Priority (MVP)
1. [x] Add "Community" link to landing header navigation (desktop + mobile)
2. [x] Create basic `CommunitySection` component with static images
3. [x] Integrate section into landing page

### Medium Priority (Enhancement)
4. [x] Curate and optimize preview images
5. [x] Add hover overlays with prompt previews
6. [x] Responsive grid refinements
7. [x] Scroll spy integration for nav highlighting

### Low Priority (Polish)
8. [ ] Consider dynamic image fetching (ISR/SSR)
9. [ ] A/B test section placement and CTA copy
10. [ ] Add view count or engagement metrics to previews

---

## Technical Considerations

### Performance
- Static images: No API calls, fast load
- Lazy load below-fold images
- Use `next/image` with proper sizing
- Consider priority loading for first 3-4 images

### SEO
- Section adds crawlable content with alt text
- Internal link to `/feed/public` strengthens page authority
- JSON-LD could be extended to include ImageGallery reference

### Accessibility
- Alt text for all preview images (use prompt)
- Keyboard navigation for grid items
- Screen reader announcement for section purpose

---

## Related Files Summary

### Files to Create
- `components/landing/community-section.tsx` - New community preview section
- `public/community/` - Directory for curated preview images

### Files to Modify
- `app/page.tsx` - Add CommunitySection to page
- `components/landing/landing-header.tsx` - Add Community nav link + LANDING_SECTIONS

### Dependencies
- Existing: `ScrollReveal`, `Button`, `next/image`
- No new packages required

---

## Success Metrics

- **Navigation Discovery:** Clicks on "Community" nav link from landing page
- **Section Engagement:** Clicks on "Explore All Creations" CTA
- **User Flow:** Landing → Feed → Sign Up conversion rate
- **Time on Site:** Increase in average session duration

---

## References

- [Current Landing Page](app/page.tsx) - Page structure
- [Landing Header](components/landing/landing-header.tsx) - Navigation component
- [Showcase Section](components/landing/showcase-section.tsx) - Design reference for new section
- [Feed Page](app/feed/[type]/page.tsx) - Target destination
