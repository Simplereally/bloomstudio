---
name: creating-client-component
description: |
  Creates interactive React Client Components with hooks and event handlers.
  Input: Component name, purpose, required interactivity.
  Output: Client component file with proper structure and tests.
---

# Creating a Client Component

Builds React Client Components for interactive UI. Only use when hooks/events are required.

## Preconditions

- Confirm interactivity is needed (hooks, events, browser APIs)
- If no interactivity needed, use Server Component instead

## Decision: Client or Server?

```
Need any of these?
├─ useState, useEffect, useRef → Client
├─ onClick, onChange, onSubmit → Client
├─ useRouter, usePathname → Client
├─ useQuery, useMutation (Convex) → Client
├─ Browser APIs (localStorage, window) → Client
└─ None of above → Server Component (no 'use client')
```

## Algorithm

```markdown
1. Create component file:
   - [ ] Create `components/[feature]/[name].tsx`
   - [ ] Add `'use client'` directive at top
   - [ ] Define typed props interface

2. Structure component:
   - [ ] Import `cn` from `@/lib/utils` for class merging
   - [ ] Use semantic tokens for styling
   - [ ] Add `className` prop for overrides

3. Add interactivity:
   - [ ] Implement hooks (useState, etc.)
   - [ ] Wire event handlers
   - [ ] Handle loading/error states

4. Create test:
   - [ ] Create `[name].test.tsx` alongside
   - [ ] Test user interactions, not implementation

5. Verify:
   - [ ] Run `bun run test [file]`
   - [ ] Check TypeScript: `bun run build`
```

## Template

```tsx
// components/[feature]/[name].tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  initialValue?: string;
  onSubmit?: (value: string) => void;
  className?: string;
}

export function MyComponent({
  initialValue = '',
  onSubmit,
  className,
}: MyComponentProps) {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      onSubmit?.(value);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="px-3 py-2 border rounded bg-input"
      />
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Submit'}
      </Button>
    </div>
  );
}
```

## With Convex

```tsx
'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function DataComponent() {
  const data = useQuery(api.myTable.list);
  const create = useMutation(api.myTable.create);

  if (!data) return <div className="animate-pulse" />;

  return (
    <div>
      {data.map(item => <div key={item._id}>{item.name}</div>)}
      <button onClick={() => create({ name: 'New' })}>Add</button>
    </div>
  );
}
```

## File Locations

| Type | Location |
|------|----------|
| Feature components | `components/[feature]/[name].tsx` |
| Shared/generic | `components/[name].tsx` |
| Route-specific | `app/[route]/_components/[name].tsx` |

## Guardrails

- **Never** use `'use client'` unless actually needed
- **Never** call `fetch()` directly — use Convex or Server Actions
- **Never** mirror Convex data to local state
- **Always** include `className` prop for override flexibility
- **Always** use `cn()` for class merging

## Output Format

```markdown
## Summary
Created client component `[Name]` for [purpose].

## Files Created
- `components/[feature]/[name].tsx`
- `components/[feature]/[name].test.tsx`

## Verification
- `bun run test [file]` passed ✅
- No TypeScript errors ✅

## Props
- `initialValue?: string` — Default value
- `onSubmit?: (value: string) => void` — Callback
```
