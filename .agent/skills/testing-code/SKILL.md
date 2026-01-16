---
name: testing-code
description: |
  Tests code using Vitest and React Testing Library.
  Use for: unit tests, component tests, regression tests, bug fix verification.
  DO NOT use for: E2E tests (not set up), visual testing.
---

# Testing Code

Testing overview. **Use the specific skills below for actual tasks.**

## Skill Routing

| Task | Use Skill |
|------|-----------|
| Test React component | `testing-components` |
| Test pure function/utility | `testing-functions` |

## Commands

```bash
bun run test           # Run all tests once
bun run test:watch     # Watch mode
bun run test [pattern] # Run matching files
```

## File Location

| Source | Test |
|--------|------|
| `components/foo.tsx` | `components/foo.test.tsx` |
| `lib/utils.ts` | `lib/utils.test.ts` |
| `convex/lib/x.ts` | `convex/lib/x.test.ts` |

## Test Structure

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Feature", () => {
  it("does something", () => {
    expect(result).toBe(expected);
  });
});
```

## Key Mocks

| Dependency | Mock Pattern |
|------------|--------------|
| `next/navigation` | `useRouter`, `usePathname` |
| `convex/react` | `useQuery`, `useMutation` |
| `@clerk/nextjs` | `useUser`, `useAuth` |
| `next/image` | Replace with `<img>` |

## Guardrails

- **Test behavior**, not implementation
- **Use accessible queries** — `getByRole` over `getByTestId`
- **Mock at boundaries** — hooks, not internals
- **If tests fail for unrelated reasons**, report and stop
