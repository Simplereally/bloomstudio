# The Living Strip: Real-Time Community Feed on Landing Page

## Overview

**Problem Statement:**  
The public feed at `/feed/public` has no presence on the landing page. Users must click through navigation to discover community creations. This creates a discovery gap—the landing page doesn't showcase the platform's creative potential through *real* user work.

**Solution: The Living Strip**  
An auto-scrolling, infinite marquee of recent community images positioned prominently below the Hero section. This creates immediate visual proof of platform activity and quality, driving conversion through social proof.

**Created:** 2026-01-14

---

## Design Thinking (per brainstorming-ui-and-design skill)

### Purpose
Show new visitors that Bloom Studio has an active, thriving creative community *immediately* upon landing. Reduce friction to discovery by bringing the feed to them.

### Tone
**Cinematic & Living** — The strip should feel like a window into an ever-flowing river of creativity. Dreamy motion, soft transitions, premium glass morphism that matches the existing landing page aesthetic.

### Constraints
- Must be a **Server Component** for SEO (static initial render)
- Client-side animation via CSS only (no JS animation library dependency)
- Minimal additional payload (no heavy data fetching on landing)
- Should work with the existing `GLBackground` and not fight for visual attention

### Differentiation
The **one thing** someone will remember: *"The images were flowing past like a dream—I could see real art people were making before I even scrolled."*

---

## User Story

### Title
As a first-time visitor, I want to immediately see a flowing preview of community creations on the landing page, so that I understand the platform's potential without clicking anywhere.

### Acceptance Criteria

- [ ] **AC1**: A horizontal strip of images appears below the Hero section
- [ ] **AC2**: Images auto-scroll horizontally in a seamless loop (no jump when resetting)
- [ ] **AC3**: Hovering pauses the scroll and slightly enlarges the hovered image
- [ ] **AC4**: Clicking any image navigates to `/feed/public`
- [ ] **AC5**: Works on all breakpoints (mobile: 2 visible, tablet: 4, desktop: 6+)
- [ ] **AC6**: Images are curated/static for MVP (8-12 high-quality examples)
- [ ] **AC7**: Strip is visually integrated with the landing page aesthetic (glass morphism, gradients)
- [ ] **AC8**: Accessible: pause button for motion-sensitive users (prefers-reduced-motion)
- [ ] **AC9**: Smooth fade masks on left/right edges to create depth

---

## Technical Design

### Component Architecture

```
app/page.tsx
└── LivingStrip (new component)
    ├── Server Component wrapper (SEO)
    └── LivingStripClient (client component)
        ├── Marquee container with CSS animation
        ├── Image items (curated static data)
        └── Hover/pause interaction handlers
```

### Files to Create

| File | Purpose |
|------|---------|
| `components/landing/living-strip.tsx` | Main component (server wrapper + client) |
| `public/strip/` | Curated image assets (8-12 images) |

### Files to Modify

| File | Change |
|------|--------|
| `app/page.tsx` | Add LivingStrip after HeroSection |
| `app/globals.css` | Add marquee animation keyframes |

### Image Curation Strategy

For MVP, use 8-12 hand-picked images from the public feed that showcase:
- Variety of styles (portrait, landscape, abstract, cinematic)
- Different AI models (GPT-Image, Seedream, Veo stills)
- High visual impact (crisp, colorful, emotionally resonant)
- Mix of aspect ratios for visual rhythm

Store as optimized WebP in `public/strip/` at ~400px width for bandwidth efficiency.

---

## Implementation Plan

### Phase 1: Core Component (MVP)
1. [x] Create curated image set (8-12 images) — reusing `/public/community/` assets
2. [x] Implement `LivingStrip` component with CSS marquee
3. [x] Add to landing page below Hero
4. [x] Style with glass-effect and fade masks

### Phase 2: Interactivity
5. [x] Add hover pause/enlarge effect
6. [x] Add click-to-feed navigation
7. [x] Implement prefers-reduced-motion support

### Phase 3: Polish
8. [x] Responsive breakpoints (visible image count)
9. [x] Edge fade gradients
10. [ ] Loading skeleton for hydration (optional enhancement)

---

## Styling Approach (per styling-ui skill)

### Tokens Used
- **Background**: `bg-black/40` with `glass-effect-home`
- **Border**: `border-white/10`
- **Text**: `text-foreground/90` for any labels
- **Animation**: New `animate-marquee` utility

### Animation Definition
```css
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

Duplicate the image set to create seamless loop (content repeats twice, scrolls halfway = appears infinite).

### Responsive Behavior
| Breakpoint | Visible Images | Strip Height |
|------------|----------------|--------------|
| Mobile     | 2-3            | 120px        |
| `sm`       | 3-4            | 140px        |
| `md`       | 4-5            | 160px        |
| `lg`       | 6+             | 180px        |
| `3xl`+     | 8+             | 200px        |

### Pseudo-code Structure
```tsx
export function LivingStrip() {
  return (
    <section className="relative py-4 overflow-hidden">
      {/* Left fade mask */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      
      {/* Right fade mask */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Marquee track */}
      <div className="flex animate-marquee hover:[animation-play-state:paused]">
        {[...images, ...images].map((img, i) => (
          <Link href="/feed/public" key={i} className="shrink-0 px-2">
            <div className="relative h-32 w-48 rounded-lg overflow-hidden group">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

---

## Success Metrics

- **Engagement**: Click-through rate from strip to `/feed/public`
- **Perception**: User feedback on "liveliness" of landing page
- **Performance**: No perceptible LCP impact (images lazy-loaded below fold)

---

## Future Enhancements (Post-MVP)

- **Dynamic feed**: Fetch latest 12 public images server-side with ISR (revalidate: 300)
- **Interactive lightbox**: Click to preview, second click to feed
- **Parallax**: Slight 3D tilt on scroll for depth
- **Creator avatars**: Small avatar overlays on images

---

## References

- [Landing Page](app/page.tsx)
- [Hero Section](components/landing/hero-section.tsx)
- [Community Section](components/landing/community-section.tsx) — similar pattern
- [Styling Guide](.agent/skills/styling-ui/SKILL.md)
