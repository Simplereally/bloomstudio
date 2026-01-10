# SEO + FCP Implementation Plan (No-Compromise Visuals)

Date: 2026-01-09

## Goals

- Keep the homepage visually premium (WebGL, motion, carousel, floating imagery).
- Improve first-page-load performance (especially FCP/LCP and JS execution).
- Ensure indexing is intentional (public marketing pages indexable; authed app pages not).
- Stay idiomatic for Next.js App Router + Clerk.

## Current Snapshot (Key Observations)

- Root metadata is defined globally in `app/layout.tsx` (title/description/OG/Twitter/robots/canonical).
- `app/sitemap.ts` currently includes `/sign-in` and `/sign-up`.
- `app/robots.ts` disallows `/studio/` and `/api/`.
- Homepage visual system uses:
  - WebGL background via dynamic import (`ssr: false`).
  - Framer Motion for floating imagery.
  - Embla carousel + autoplay.
  - A scroll reveal mechanism that can hide content until client JS runs.
  - `Leva` is currently imported on the landing path.

## Route Indexing Policy (Best Practice)

### 1) `/studio` (authed-only app)

**Decision**: Keep it out of search.

- Keep `robots.txt` disallow for `/studio/`.
- Also add page-level `noindex` (robots meta) for defense-in-depth.
- Ensure unauthenticated users are redirected to sign-in with a `redirect_url=/studio`.

Why:
- Disallow in robots is advisory and doesn’t guarantee removal if URLs are discovered.
- `noindex` is the more reliable directive for preventing indexing if crawled.

### 2) `/sign-in` and `/sign-up` (public but “thin”)

**Decision**: Accessible, but not promoted for indexing.

- Remove `/sign-in` and `/sign-up` from `app/sitemap.ts`.
- Add page-level `noindex, follow` (or `noindex, nofollow`) for these routes.

Why:
- Auth pages are typically not intended to rank; they’re low-content and can be perceived as low value.
- They will remain reachable via internal links/buttons and direct navigation.
- Keeping them out of the sitemap reduces crawl budget waste and keeps the sitemap focused on canonical marketing inventory.

Notes for Clerk:
- Clerk’s sign-in/up UI is inherently client-driven. That’s fine for conversion UX, but it’s rarely the content you want indexed.

## Homepage Performance Plan (Keep Beauty, Reduce Initial JS)

The strategy is progressive enhancement: ship a beautiful static baseline in HTML/CSS first, then “upgrade” to richer motion/WebGL after initial paint.

### A) Make above-the-fold content visible without JS

**Problem**: Reveal-on-scroll patterns that default to hidden can delay perceived paint.

Plan:
- Change reveal behavior so the server-rendered baseline is visible by default.
- Apply motion only after hydration (e.g., add a `data-enhanced` attribute on `html`/`body` during/after hydration and gate animation styles behind it).

Acceptance criteria:
- With JS disabled, all marketing content remains visible and readable.

### B) Replace high-cost motion libraries with CSS where possible

**Target**: Floating gallery + basic reveal/float effects.

Plan options:

1) **Preferred**: Re-implement floating and reveal animations using CSS keyframes + intersection-triggered class toggles (small custom client hook). This removes Framer Motion from the critical path.
2) **If Framer Motion is non-negotiable**: render a static, non-animated baseline first; dynamically import the Framer Motion-enhanced version after idle (or after the first user interaction) and swap it in.

Key principle:
- The initial HTML should contain the images and layout in a static, pretty state.
- Motion is an enhancement, not a prerequisite for layout.

### C) Defer WebGL + Dev Tools

**WebGL**

Plan:
- Keep `ssr: false` for the WebGL canvas.
- Mount WebGL only after:
  - `requestIdleCallback`, or
  - a short timeout after first paint, or
  - the first user interaction.
- Respect user/device signals:
  - `prefers-reduced-motion` → disable WebGL and fall back to a static background.
  - low-end devices (heuristics) → delay or disable.

**Leva**

Plan:
- Ensure Leva is never included in the production bundle for the landing page.
- Gate it behind a dev-only dynamic import or environment check.

### D) Carousel strategy (Keep it, but don’t pay upfront)

Plan options:

1) **CSS-first carousel**: use horizontal scroll + scroll-snap for baseline; upgrade to Embla carousel after hydration if needed.
2) **Dynamic Embla**: ship a static layout first; import Embla + autoplay only when the carousel is within viewport.

### E) Reduce client-component surface area

Plan:
- Audit the landing components and convert everything that doesn’t truly need hooks/events to Server Components.
- Create small “islands” for:
  - the header auth state,
  - optional motion enhancements,
  - WebGL mount logic,
  - carousel enhancement.

Outcome:
- Less JS to parse/execute on initial load.
- Better caching and streaming behavior.

## Implementation Steps (Concrete Work Items)

### 1) Indexing + Crawl Hygiene

- Update `app/sitemap.ts` to include only canonical, indexable marketing pages.
- Add metadata robots directives for:
  - `/sign-in` routes
  - `/sign-up` routes
  - `/studio` route(s)
- Verify `/robots.txt` and `/sitemap.xml` match the intended inventory.

### 2) Landing Page Progressive Enhancement

- Update reveal logic so content is visible by default.
- Replace Framer Motion floating animations with CSS equivalents, or defer Framer Motion.
- Convert eligible landing sections to Server Components.

### 3) WebGL Deferral

- Move WebGL mount behind idle/interaction.
- Add reduced-motion fallback.
- Ensure Leva is dev-only.

### 4) Carousel Deferral

- Implement CSS-first baseline.
- Add viewport-based enhancement to Embla.

## Measurement & Verification

### Local

- Lighthouse (mobile emulation) on `/` before/after.
- Track:
  - FCP
  - LCP
  - CLS
  - INP
  - Total Blocking Time (diagnostic)
  - JS transferred and JS execution time

### Production

- Use Real User Monitoring (RUM) to confirm improvements on real devices.

## Performance Budgets (Targets)

- LCP (mobile p75): < 2.5s
- INP (mobile p75): < 200ms
- CLS (p75): < 0.1
- Homepage initial JS: reduce materially vs. baseline (goal: remove major libraries from the critical path).

## Rollout Strategy

- Implement behind a short-lived feature flag if you want safe A/B comparison.
- Ship in this order:
  1) Leva dev-only + reveal visible-by-default
  2) Carousel deferral
  3) Floating gallery CSS swap / motion deferral
  4) WebGL mount deferral + reduced-motion fallback

