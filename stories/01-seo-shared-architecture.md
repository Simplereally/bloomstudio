
# Story 01: SEO Shared Architecture & Configuration

## Objective
Establish the foundational architecture for SEO pages, including a centralized configuration for content and a shared footer component that improves internal linking.

## Implementation Details

### 1. Centralized SEO Configuration (`lib/seo-config.ts`)
Create a single source of truth for all SEO-related content to ensure consistency and easy updates.
- **Data Structure**: Array of `Solution` objects.
- **Fields**: 
  - `title`: Full title (e.g., "AI Image Generator")
  - `shortTitle`: Short version for UI (e.g., "Images")
  - `slug`: URL slug (e.g., "ai-image-generator")
  - `description`: Meta description and hero text.
  - `heroSuffix`: Dynamic suffix for hero headings.
- **Resources**: Array of "About" links (Pricing, FAQ, Support, Contact).

### 2. Shared Footer Component (`components/layout/footer.tsx`)
Develop a comprehensive footer to be used across all public-facing pages.
- **Design**: 4-column layout (Brand, Solutions, About, CTA).
- **Solutions Column**: Dynamically populated from `SOLUTIONS` config.
- **About Column**: Dynamically populated from `RESOURCES` config.
- **Styling**: Matches the "Bloom Studio" aesthetic (dark mode, glassmorphism).
- **Functionality**: Uses `Next/Link` for client-side navigation.

### 3. Integration
- Ensure the footer is exported and ready for use in `page.tsx` and other routes.
- Verify type safety for all configuration objects.
