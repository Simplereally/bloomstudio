
# Story 02: Solutions Landing Pages

## Objective
Implement dynamic landing pages for specific use cases ("Solutions") to capture long-tail SEO traffic. These pages should reuse the high-quality main landing page layout but with contextualized content.

## Implementation Details

### 1. Dynamic Routing (`app/solutions/[slug]/page.tsx`)
- Create a dynamic route handler to catch all solution slugs.
- **GenerateStaticParams**: Implement SSG for all defined solutions in `seo-config.ts` to ensure fast load times and proper indexing.

### 2. Contextual Page Layout
- **Reuse Components**: Utilize existing Landing Page components:
  - `HeroSection`
  - `ShowcaseSection`
  - `FeaturesSection`
  - `ModelsSection`
  - `ValuePropSection`
  - `CtaSection`
- **Dynamic Content Injection**:
  - **Hero**: Inject `heroSuffix` and `description` to customize the H1 and subtext. "Create stunning [suffix] with AI".
  - **Metadata**: Generate dynamic `title` and `description` meta tags: "Free [Title] | Bloom Studio".
- **Canonical URLs**: Set canonical tags to self-reference the specific solution page.

### 3. Conversion Optimization
- Ensure the "Get Started" buttons redirect to the main app flow (signup/studio).
- The page acts as a "doorway" that provides value (context) and then funnels users to the core product.
