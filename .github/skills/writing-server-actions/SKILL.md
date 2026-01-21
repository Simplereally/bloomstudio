---
name: writing-server-actions
description: |
  Creates Next.js Server Actions for form mutations and server-side operations.
  Input: Action purpose and input schema.
  Output: Server action file with validation and error handling.
---

# Writing Server Actions

Creates Next.js Server Actions for mutations from forms or client code.

## Preconditions

- Action involves data mutation (create, update, delete)
- Data validation is required (use Zod)

## When to Use

| Scenario | Use |
|----------|-----|
| Form submission | Server Action |
| Calling Convex from server | Server Action + `fetchMutation` |
| External API call from server | Server Action |
| Real-time client data | `useMutation` (Convex) instead |

## Algorithm

```markdown
1. Create action file:
   - [ ] Create `app/actions/[name].ts`
   - [ ] Add `'use server'` directive at top

2. Define schema:
   - [ ] Use Zod for input validation
   - [ ] Handle both FormData and direct args

3. Implement handler:
   - [ ] Parse and validate input
   - [ ] Check auth if needed
   - [ ] Perform mutation (Convex/external)
   - [ ] Return typed result

4. Connect to form:
   - [ ] Use `action={serverAction}` on form
   - [ ] Or call via `startTransition`

5. Verify:
   - [ ] Test with form submission
   - [ ] Check error handling
```

## Template: Basic Action

```ts
// app/actions/save-profile.ts
'use server';

import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500).optional(),
});

export type SaveProfileResult = 
  | { success: true; message: string }
  | { success: false; error: string };

export async function saveProfile(formData: FormData): Promise<SaveProfileResult> {
  // 1. Check auth
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const parsed = schema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // 3. Perform mutation
  try {
    // Call Convex or database here
    return { success: true, message: 'Profile saved' };
  } catch (error) {
    return { success: false, error: 'Failed to save profile' };
  }
}
```

## Template: With Convex

```ts
// app/actions/create-prompt.ts
'use server';

import { z } from 'zod';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { auth } from '@clerk/nextjs/server';

const schema = z.object({
  prompt: z.string().min(1).max(2000),
  title: z.string().min(1).max(100),
});

export async function createPrompt(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const parsed = schema.safeParse({
    prompt: formData.get('prompt'),
    title: formData.get('title'),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const id = await fetchMutation(api.promptLibrary.create, {
    prompt: parsed.data.prompt,
    title: parsed.data.title,
  });

  return { success: true, id };
}
```

## Client Usage

### In Form

```tsx
// components/profile-form.tsx
'use client';

import { useActionState } from 'react';
import { saveProfile } from '@/app/actions/save-profile';

export function ProfileForm() {
  const [state, formAction, isPending] = useActionState(saveProfile, null);

  return (
    <form action={formAction}>
      <input name="name" required />
      {state?.error && <p className="text-destructive">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### Programmatic

```tsx
'use client';

import { useTransition } from 'react';
import { createPrompt } from '@/app/actions/create-prompt';

export function SaveButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('prompt', 'My prompt');
      formData.set('title', 'My title');
      await createPrompt(formData);
    });
  };

  return <button onClick={handleClick}>Save</button>;
}
```

## Guardrails

- **Always validate** input with Zod before processing
- **Always check auth** for user-specific actions
- **Never expose raw errors** to client — sanitize messages
- **Return typed results** — not void or any
- **If Convex needed**, use `fetchMutation` not direct db access

## Output Format

```markdown
## Summary
Created server action `[name]` for [purpose].

## Files Created
- `app/actions/[name].ts`

## Schema
- `name: string` (required, min 2)
- `bio: string` (optional, max 500)

## Returns
- `{ success: true, message: string }` on success
- `{ success: false, error: string }` on failure

## Usage
- Form: `<form action={serverAction}>`
- Programmatic: `startTransition(() => action(formData))`
```
