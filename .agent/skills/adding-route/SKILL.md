---
name: adding-route
description: |
  Creates a new page/route in Next.js App Router with all boilerplate.
  Input: Route path (e.g., "/dashboard") and page purpose.
  Output: page.tsx, layout.tsx (if needed), loading.tsx, error.tsx.
---

# Adding a Route

Creates a new App Router page with proper structure and loading/error states.

## Preconditions

- Confirm the route doesn't already exist in `app/`
- User has provided: route path and page purpose/description

## Algorithm

```markdown
1. Create page file:
   - [ ] Create `app/[route]/page.tsx` as Server Component
   - [ ] Add SEO: `export const metadata = { title, description }`
   - [ ] Add semantic structure: `<main>`, `<h1>`, sections

2. Create loading state:
   - [ ] Create `app/[route]/loading.tsx`
   - [ ] Use skeleton with `animate-pulse bg-muted/50`

3. Create error boundary:
   - [ ] Create `app/[route]/error.tsx` as Client Component ('use client')
   - [ ] Include reset button

4. Create layout (if needed):
   - [ ] Only if route needs custom wrapper/providers
   - [ ] Create `app/[route]/layout.tsx`

5. Verify:
   - [ ] Run `bun run build` — report errors
   - [ ] Navigate to route in dev mode
```

## Template: page.tsx

```tsx
// app/[route]/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '[Page Title] | Bloom Studio',
  description: '[Page description for SEO]',
};

export default function [RouteName]Page() {
  return (
    <main className="container py-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-brand">
        [Page Title]
      </h1>
      <section>
        {/* Page content */}
      </section>
    </main>
  );
}
```

## Template: loading.tsx

```tsx
// app/[route]/loading.tsx
export default function Loading() {
  return (
    <div className="container py-8 space-y-6">
      <div className="h-10 w-48 animate-pulse rounded bg-muted/50" />
      <div className="h-64 animate-pulse rounded bg-muted/50" />
    </div>
  );
}
```

## Template: error.tsx

```tsx
// app/[route]/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

## Existing Routes (Reference)

| Route | Path |
|-------|------|
| Landing | `app/page.tsx` |
| Studio | `app/studio/page.tsx` |
| History | `app/history/page.tsx` |
| Feed | `app/feed/page.tsx` |
| Favorites | `app/favorites/page.tsx` |
| Settings | `app/settings/page.tsx` |
| Pricing | `app/pricing/page.tsx` |
| Profile | `app/profile/page.tsx` |

## Guardrails

- **Do NOT add `'use client'`** to page.tsx unless absolutely required
- **If route already exists**, stop and ask user for clarification
- **If build fails**, report error and stop

## Output Format

```markdown
## Summary
Created route `/[path]` with [purpose].

## Files Created
- `app/[route]/page.tsx`
- `app/[route]/loading.tsx`
- `app/[route]/error.tsx`

## Verification
- `bun run build` passed ✅
```
