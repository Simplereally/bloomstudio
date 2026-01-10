# Next.js 16 SEO + Performance Investigation Playbook (2025)

> Goal: inspect the codebase (dependencies, versions, architecture), then audit **every public-facing page** (landing, about, pricing, etc.) so the site does one job exceptionally well:
> 1) **Acquire users** (SEO + CTR + relevance), 2) **Keep them there** (UX + clarity + trust), 3) **Stay fast** (Core Web Vitals + low JS + good caching).

This document is the exact step-by-step process I would follow.

---

## 0) Define success (so we don’t “optimize” blindly)

### 0.1 Outcomes (business)
- **Primary**: organic sessions → qualified signups / demo requests / purchases
- **Secondary**: organic CTR, conversion rate, brand searches, returning visitors
- **Guardrails**: bounce rate, engaged time, funnel drop-off, support tickets from confusion

### 0.2 SEO + performance targets (2025 baseline)
Core Web Vitals targets (field data):  
- **LCP < 2.5s**, **INP < 200ms**, **CLS < 0.1** :contentReference[oaicite:0]{index=0}  
Treat these as “must pass,” not “nice to have”.

Also align with Google’s “page experience” guidance: don’t chase one metric in isolation—optimize overall experience. :contentReference[oaicite:1]{index=1}

### 0.3 Scope
- **In-scope pages**: all indexable routes (/, /pricing, /about, /contact, /blog/*, /docs/*, etc.)
- **Out-of-scope** (usually): authenticated app, internal admin, staging
- **Environments**: production + staging (same infrastructure, same CDN headers)

### 0.4 Deliverables I will produce
1) **Dependency + architecture inventory** (what we’re running, how it renders/caches)
2) **Public-page inventory** (URL map + intent + indexability)
3) **Page scorecards** (SEO + UX + performance per page)
4) **Technical SEO report** (robots/sitemaps/canonicals/schema/indexing risks)
5) **Performance report** (CWV root causes + fixes + budgets)
6) **Prioritized backlog** (impact × effort, with acceptance criteria)
7) **Validation plan** (Lighthouse CI + regression checks + monitoring)

---

## 1) Codebase intake & environment setup

### 1.1 Get local running + reproducible builds
- Install the exact Node/package manager versions:
  - Check `.nvmrc`, `.node-version`, `package.json#engines`, CI config
- Clean install:
  - `rm -rf node_modules .next`
  - `pnpm i` / `npm ci` / `yarn --frozen-lockfile`
- Run dev + prod locally:
  - `next dev`
  - `next build && next start`

### 1.2 Confirm runtime versions (must be explicit)
From `package.json` + lockfile:
- `next`, `react`, `react-dom`
- critical infra libs: `next-sitemap`, `next-intl`, analytics, CMS SDKs, UI kits, auth, MDX, etc.

> If the repo claims “Next.js 16”, validate it explicitly and check for migration flags.

Why this matters: Next.js 16 introduces a new caching model (“Cache Components”), Turbopack as default bundler, and other architecture changes that can materially affect SEO/perf. :contentReference[oaicite:2]{index=2}

### 1.3 Capture deployment + CDN realities
- Hosting platform (Vercel, Cloudflare, AWS, etc.)
- Edge/runtime usage
- CDN behavior for HTML, RSC payloads, images
- Response headers in prod:
  - `cache-control`, `etag`, `vary`, `content-encoding`, `x-vercel-cache` (if Vercel), etc.

**Output**: “Runtime facts sheet” (what users/bots actually receive)

---

## 2) Architecture & rendering audit (Next.js-specific)

### 2.1 Identify router & directory structure
- App Router (`/app`) vs Pages Router (`/pages`) vs mixed
- Route groups, dynamic segments, middleware/proxy usage

### 2.2 Rendering mode per route (SEO-critical)
For each public route, classify:
- Static (SSG)
- Server-rendered (SSR)
- Partial/streamed (Suspense boundaries)
- Client-heavy (bad for perf/SEO if misused)

In Next.js 16, “Cache Components” can prerender a **static shell** and stream dynamic parts; it’s opt-in via config. :contentReference[oaicite:3]{index=3}  
This affects how fast pages feel *and* how stable your HTML is for bots + social scrapers.

### 2.3 Data fetching & caching behavior
Inventory:
- Server fetches (REST/GraphQL/CMS)
- Cache directives / revalidation strategy
- Any per-request personalization leaking into public pages (danger for caching + SEO)

If using Next 16 Cache Components:
- Confirm `cacheComponents: true` (or absence) and audit every `use cache` boundary / Suspense boundary placement. :contentReference[oaicite:4]{index=4}

**Output**: “Rendering & caching map” (route → render mode → cache strategy → risks)

---

## 3) Public-facing URL inventory (the master checklist)

### 3.1 Enumerate all public routes
Create a canonical list from:
- filesystem routes (`app/**/page.tsx`)
- `next build` route output summary
- sitemap output (if present)
- internal links crawl (headless crawl)

Create a spreadsheet with:
- URL
- Page type (Landing / Pricing / About / Blog / Docs / Contact / Compare / Integration)
- Primary conversion goal
- Primary search intent (transactional / informational / navigational)
- Status (index / noindex)
- Canonical target
- Render mode (from §2)

### 3.2 Detect “shadow pages”
Common leaks:
- duplicate routes (with and without trailing slash)
- query-param duplicates
- localized variants
- tag/category pages
- marketing experiments

**Output**: URL map with owners + goals

---

## 4) Technical SEO audit (indexing, metadata, schema)

### 4.1 Robots + index controls
- Validate `robots.txt` exists and is correct
  - In Next.js App Router, implement via `app/robots.txt` or `app/robots.ts` and ensure it references your sitemap. :contentReference[oaicite:5]{index=5}
- Check for accidental blocks:
  - `/` blocked
  - JS/CSS blocked (can harm rendering)
  - staging accidentally indexable

### 4.2 Sitemaps
- Ensure sitemap exists and includes **only canonical, indexable** URLs
  - In Next.js, use `app/sitemap.xml` (static) or `app/sitemap.ts` (generated). :contentReference[oaicite:6]{index=6}
- Follow Google sitemap rules:
  - use **absolute URLs**, place at site root when possible, keep `<lastmod>` accurate, and don’t rely on `<priority>/<changefreq>` (Google ignores them). :contentReference[oaicite:7]{index=7}

### 4.3 Canonicals & duplication control
- Every indexable page must emit the correct `<link rel="canonical">`
- For JS-rendered pages: canonical must be clear in **HTML source**, and JS shouldn’t rewrite it. :contentReference[oaicite:8]{index=8}
- Define canonical strategy for:
  - pagination
  - filters/sorts
  - campaign params
  - locale variants (hreflang, if applicable)

### 4.4 Titles & meta descriptions (CTR + relevance)
- Titles must be unique, descriptive, and match on-page intent
- Google may rewrite title links using multiple sources; follow their title-link best practices. :contentReference[oaicite:9]{index=9}
- Meta descriptions aren’t a direct rank lever, but strongly influence CTR; ensure each important page has one aligned to intent.

### 4.5 Next.js metadata implementation (App Router)
Preferred approach:
- Use `export const metadata` for static pages
- Use `generateMetadata` for dynamic routes (blog, docs)
  - This is server-resolved and designed for SEO/shareability. :contentReference[oaicite:10]{index=10}
- Understand streaming metadata tradeoffs:
  - Works for bots that execute JS (Googlebot), but HTML-limited scrapers may require blocking behavior for correct OG tags. :contentReference[oaicite:11]{index=11}

### 4.6 Social cards (OG/Twitter) per route
- Ensure every shareable page has:
  - title/description
  - OG image
  - Twitter card data
- Use Next.js route-segment file conventions for images:
  - `opengraph-image.*`, `twitter-image.*` (with size constraints enforced at build time). :contentReference[oaicite:12]{index=12}

### 4.7 Structured data (schema)
- Add JSON-LD where it maps to real visible content (Organization, Product, FAQ, Article, BreadcrumbList, etc.)
- Follow Google’s structured data guidelines:
  - JSON-LD recommended
  - must represent visible content
  - avoid misleading markup
  - don’t block marked-up pages via robots/noindex :contentReference[oaicite:13]{index=13}

### 4.8 Mobile-first indexing readiness
- Google uses the **mobile version** for indexing and ranking (mobile-first). :contentReference[oaicite:14]{index=14}
Validate:
- same primary content on mobile & desktop
- same metadata + structured data
- no “mobile hides the important stuff” patterns

**Output**: Technical SEO issue list + fixes + tests

---

## 5) Performance & Core Web Vitals investigation (field-first)

### 5.1 Measure with real-user data first (field)
- Google Search Console CWV report
- RUM (if present): INP breakdown, long tasks, slow interactions
- Segment by:
  - device (mobile vs desktop)
  - country/region
  - top landing pages

Targets are the CWV thresholds in §0.2. :contentReference[oaicite:15]{index=15}

### 5.2 Lab analysis (repeatable)
For each major page template:
- Lighthouse (mobile throttling)
- WebPageTest (if available)
- Bundle analysis

Capture:
- LCP element
- main-thread work
- JS execution time
- blocking scripts
- layout shift sources

### 5.3 Next.js performance checklist (App Router / 16)
**Rendering & data**
- Prefer Server Components (reduce client JS)
- Minimize `"use client"` surface area
- Push Suspense boundaries *close to dynamic bits* to maximize prerendered shell (esp. with Cache Components). :contentReference[oaicite:16]{index=16}

**Metadata**
- Keep metadata generation fast; avoid waterfall fetches in `generateMetadata` (or cache them). :contentReference[oaicite:17]{index=17}

**Images**
- Use optimized images everywhere; set correct dimensions; avoid CLS from late-loading media.
- Ensure `sizes` is correct for responsive images (common hidden LCP killer).

**Fonts**
- Use Next.js font optimization; minimize font variants; avoid blocking loads.

**Third-party scripts**
- Audit all trackers/widgets:
  - Remove duplicates
  - Defer where possible
  - Replace heavy widgets with lightweight alternatives
  - Use strict loading strategies (`afterInteractive`, `lazyOnload`) where safe

**Caching & CDN**
- Ensure static assets are immutable cached
- Ensure HTML/RSC caching aligns with “public marketing site” expectations (avoid accidental per-request rendering)

**Output**: “CWV root cause map” + concrete fixes with expected impact

---

## 6) Page-by-page public audit (SEO + UX + conversion)

This is where we review **every** public page with a consistent rubric.

### 6.1 Page scorecard template (copy/paste)
For each URL, record:

**A) Search intent & message**
- Primary query cluster + intent match
- Above-the-fold value prop clarity (5 seconds test)
- Who is it for? What pain does it solve? Why now?

**B) On-page SEO**
- Title/H1 alignment
- Meta description (CTR)
- Headings (H2/H3 support the intent)
- Internal links: from home, nav, related pages
- Image alt text (meaningful)
- Canonical + index status + schema present

**C) Trust & persuasion**
- Proof: testimonials, logos, case studies, metrics
- Objection handling (security, pricing clarity, onboarding time)
- Risk reversal (trial, refund, cancel anytime)
- FAQ quality (real objections)

**D) Conversion**
- One primary CTA, one secondary CTA (no CTA soup)
- Form friction (fields, inline validation)
- Micro-conversions (newsletter, demo video, calculator, sample)

**E) Performance**
- LCP element identified and optimized
- JS bundle size sanity
- Third-party scripts impact
- CLS sources eliminated

**F) Accessibility**
- Keyboard nav
- Contrast
- Focus states
- Semantic landmarks

**Output per page**: 5–15 actionable recommendations, labeled:
- Quick win (≤1 day)
- Medium (≤1 week)
- Project (multi-week)

### 6.2 What “great” looks like for common pages

#### Landing / Home
- One clear positioning statement + supporting subheader
- Immediate social proof
- Fast path to “what it does” (demo, screenshot, video *lightweight*)
- Internal links to key intents (“pricing”, “use cases”, “integrations”, “docs”)

#### Pricing
- Transparent tiers
- “Which plan is for me?”
- Comparison table
- FAQ about billing, cancellation, security
- Strong CTA + low-friction contact path

#### About
- Credibility story (why we exist)
- Team/company legitimacy
- Trust (policies, address, press, case studies)

#### Feature / Use-case pages
- Map to one intent per page (avoid “everything everywhere”)
- Practical outcomes + examples
- Comparison vs alternatives if relevant (careful, factual)

#### Blog / Docs
- Strong internal linking to product pages
- Clear taxonomy
- Author/date where appropriate
- Schema (Article) and fast rendering

---

## 7) Backlog creation & prioritization (so fixes ship)

### 7.1 Triage framework
For each issue:
- **Impact**: SEO traffic potential, conversion lift, CWV improvement
- **Effort**: S/M/L
- **Risk**: regression likelihood

Create a 2–4 week plan:
- Week 1: technical SEO correctness + CWV blockers
- Week 2: top landing pages (highest traffic)
- Week 3–4: content + IA improvements, secondary templates

### 7.2 Acceptance criteria (examples)
- “Pricing page LCP improves to <2.5s mobile (field)”
- “All indexable pages have canonical, metadata, OG image, and appear in sitemap”
- “No public page ships >X KB gzipped JS on first load” (set your budget)

---

## 8) Validation, QA, and ongoing monitoring

### 8.1 Regression checks
- Lighthouse CI on PRs (mobile config)
- Bundle size budgets (fail build if exceeded)
- Crawl tests for:
  - broken links
  - missing canonicals
  - accidental noindex
  - duplicate titles/descriptions

### 8.2 Monitoring
- Search Console (coverage + CWV)
- Rank tracking for primary queries
- RUM dashboards for INP + LCP
- Error monitoring + traces (consider OTel if available in stack)

---

## Appendix A — Next.js 16 SEO implementation checklist (App Router)

### Metadata
- ✅ Use `metadata` or `generateMetadata` (server-only) :contentReference[oaicite:18]{index=18}
- ✅ Ensure canonical via metadata `alternates`
- ✅ Ensure `metadataBase` so OG URLs are absolute (recommended practice)

### robots.txt & sitemap.xml
- ✅ `app/robots.txt` or `app/robots.ts` :contentReference[oaicite:19]{index=19}
- ✅ `app/sitemap.xml` or `app/sitemap.ts` :contentReference[oaicite:20]{index=20}
- ✅ absolute URLs + accurate lastmod :contentReference[oaicite:21]{index=21}

### OG / Twitter
- ✅ per-route `opengraph-image` / `twitter-image` :contentReference[oaicite:22]{index=22}

### Cache Components (if enabled)
- ✅ Validate config + boundaries + Suspense placement :contentReference[oaicite:23]{index=23}

---

## Appendix B — Investigation “Day 1 → Day 5” schedule (typical)

**Day 1**
- Repo setup, dependency audit, confirm Next.js version & router
- Build output + route inventory draft

**Day 2**
- Technical SEO audit: robots/sitemaps/canonicals/metadata/schema
- Fix list draft (high-risk indexing issues first)

**Day 3**
- CWV profiling: top landing pages + key templates
- Identify top 5 bottlenecks (LCP/INP/CLS)

**Day 4**
- Page-by-page UX/SEO scorecards for all public pages
- Rewrite recommendations (titles/sections/CTAs) where needed

**Day 5**
- Prioritized backlog + acceptance criteria
- Validation plan (CI checks + monitoring)