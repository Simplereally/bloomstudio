
# Story 04: Deployment & Indexing Configuration

## Objective
Ensure all new pages are discoverable by search engines and properly indexed.

## Implementation Details

### 1. Sitemap Generation (`app/sitemap.ts`)
- **Dynamic Solutions**: Iterate over `SOLUTIONS` from `seo-config.ts` to generate URLs (`/solutions/blueprints`, etc.).
- **Static Pages**: hardcode the list of static routes (`/pricing`, `/contact`, `/faq`, `/support`).
- **Properties**: Set `lastModified`, `changeFrequency` ("weekly"), and `priority` (0.8 for solutions).

### 2. Robots.txt (`app/robots.ts`)
- Allow indexing for all public routes.
- Point to the dynamically generated `sitemap.xml`.

### 3. Final Verification
- Build check: Ensure `generateStaticParams` runs without errors.
- Metadata check: Verify unique titles and descriptions for all generated pages.
