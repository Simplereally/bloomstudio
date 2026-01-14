---
name: preloading-convex-data
description: |
  Preloads Convex data in Server Components for SSR with client-side reactivity.
  Input: Query to preload and component that consumes it.
  Output: Server Component with preloadQuery + Client Component with usePreloadedQuery.
---

# Preloading Convex Data

Combines SSR performance with Convex real-time reactivity using `preloadQuery`.

## When to Use

| Scenario | Pattern |
|----------|---------|
| Page needs SEO + real-time updates | `preloadQuery` (this skill) |
| Client-only reactive data | `useQuery` directly |
| Static SSR, no reactivity | `fetchQuery` |
| Server mutation | `fetchMutation` |

## Algorithm

```markdown
1. Server Component (page):
   - [ ] Import `preloadQuery` from `convex/nextjs`
   - [ ] Import `api` from `@/convex/_generated/api`
   - [ ] Call `await preloadQuery(api.table.query, args)`
   - [ ] Pass preloaded data to Client Component

2. Client Component:
   - [ ] Add `'use client'` directive
   - [ ] Import `usePreloadedQuery` from `convex/react`
   - [ ] Import `Preloaded` type from `convex/react`
   - [ ] Define prop type with `Preloaded<typeof api.query>`
   - [ ] Call `usePreloadedQuery(preloadedData)`

3. Verify:
   - [ ] Check SSR: view source should have data
   - [ ] Check reactivity: data updates in real-time
```

## Template: Server Component (Page)

```tsx
// app/history/page.tsx
import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { HistoryClient } from '@/components/gallery/history-client';

export const metadata = {
  title: 'History | Pixelstream',
};

export default async function HistoryPage() {
  const preloadedImages = await preloadQuery(
    api.generatedImages.listUserImages,
    { limit: 50 }
  );

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your History</h1>
      <HistoryClient preloadedImages={preloadedImages} />
    </main>
  );
}
```

## Template: Client Component

```tsx
// components/gallery/history-client.tsx
'use client';

import { usePreloadedQuery } from 'convex/react';
import type { Preloaded } from 'convex/react';
import type { api } from '@/convex/_generated/api';

interface HistoryClientProps {
  preloadedImages: Preloaded<typeof api.generatedImages.listUserImages>;
}

export function HistoryClient({ preloadedImages }: HistoryClientProps) {
  // Hydrates SSR data, then subscribes to real-time updates
  const images = usePreloadedQuery(preloadedImages);

  if (!images || images.length === 0) {
    return <p className="text-muted-foreground">No images yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((image) => (
        <div key={image._id} className="aspect-square bg-muted rounded">
          {/* Render image */}
        </div>
      ))}
    </div>
  );
}
```

## Common Queries (Reference)

| Query | Args | Returns |
|-------|------|---------|
| `api.generatedImages.listUserImages` | `{ limit }` | User's images |
| `api.generatedImages.getPublicFeed` | `{ limit }` | Public feed |
| `api.favorites.list` | `{}` | User's favorites |
| `api.promptLibrary.list` | `{}` | Saved prompts |
| `api.users.getCurrent` | `{}` | Current user |

## Important: Type Safety

```tsx
// The type must match exactly
import type { Preloaded } from 'convex/react';
import type { api } from '@/convex/_generated/api';

// Correct type annotation:
type Props = {
  preloaded: Preloaded<typeof api.generatedImages.listUserImages>;
};

// NOT this (will error):
type Props = {
  preloaded: any; // ❌ Never use any
};
```

## Guardrails

- **Never call `useQuery`** in client component when preloaded data is passed
- **Never use `any`** for preloaded types — always use `Preloaded<typeof api.query>`
- **Avoid multiple `preloadQuery`** calls on same page — consolidate or redesign
- **If query returns null**, handle loading state in client component
- **If SSR fails**, the page will error — add error.tsx boundary

## Anti-Pattern: Don't Do This

```tsx
// ❌ WRONG: Mirroring Convex data to local state
'use client';

export function BadComponent({ preloadedImages }) {
  const images = usePreloadedQuery(preloadedImages);
  const [localImages, setLocalImages] = useState(images); // ❌ Don't mirror!
  
  // ...
}
```

```tsx
// ✅ CORRECT: Use Convex data directly
'use client';

export function GoodComponent({ preloadedImages }) {
  const images = usePreloadedQuery(preloadedImages); // ✅ Source of truth
  
  return <div>{images.map(...)}</div>;
}
```

## Output Format

```markdown
## Summary
Added preloading for `[query]` on `[route]`.

## Files Modified/Created
- `app/[route]/page.tsx` — Added preloadQuery
- `components/[name].tsx` — Created client consumer

## Data Flow
1. Server: `preloadQuery(api.x.y, args)`
2. Client: `usePreloadedQuery(preloaded)`
3. Reactivity: Real-time updates work ✅

## Verification
- SSR works (view source has data) ✅
- Real-time updates work ✅
```
