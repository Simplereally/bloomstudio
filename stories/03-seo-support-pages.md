
# Story 03: Support & Information Pages

## Objective
Create essential business pages to establish legitimacy, trust, and provide user support. These pages also contribute to the site's authority for SEO.

## Implementation Details

### 1. Contact Page (`app/contact/page.tsx`)
- **Layout**: Clean, focused layout with a contact form or direct links.
- **Content**:
  - Email support link (`mailto:support@bloomstudio.fun`).
  - Discord community link.
- **Design**: Glassmorphic cards for different contact methods.

### 2. FAQ Page (`app/faq/page.tsx`)
- **Component**: Reuse or create an `FaqSection` component.
- **Content**: Address common objections and questions (Pricing, Usage, Rights).
- **Structure**: standard Accordion UI for readability.

### 3. Support Page (`app/support/page.tsx`)
- **Hub Page**: A central landing for support connecting users to FAQ and Contact.
- **Design**: Large, clear navigation cards.
- **Goal**: deflect support tickets by guiding users to self-help (FAQ) first.

### 4. Integration
- Add these pages to the `RESOURCES` list in `lib/seo-config.ts`.
- Ensure they all use the shared `Footer`.
