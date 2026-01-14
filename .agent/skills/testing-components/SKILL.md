---
name: testing-components
description: |
  Tests React components with Vitest and React Testing Library.
  Input: Component to test.
  Output: Test file with render, interaction, and assertion tests.
---

# Testing Components

Creates tests for React components focusing on user behavior, not implementation.

## Preconditions

- Component exists and is functional
- Testing Library is available (`@testing-library/react`)

## Algorithm

```markdown
1. Create test file:
   - [ ] Create `[component].test.tsx` next to component
   - [ ] Import component and testing utilities

2. Mock dependencies:
   - [ ] Mock Next.js navigation if used
   - [ ] Mock Convex hooks if used
   - [ ] Mock Clerk auth if used

3. Write tests:
   - [ ] Test initial render
   - [ ] Test user interactions
   - [ ] Test error/loading states

4. Run and verify:
   - [ ] Run `bun run test [file]`
   - [ ] All tests pass
```

## Template: Basic Component Test

```typescript
// components/ui/button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Click</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });
});
```

## Mocking Patterns

### Next.js Navigation

```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/studio",
  useSearchParams: () => new URLSearchParams("model=flux"),
}));
```

### Convex Hooks

```typescript
import { useQuery, useMutation } from "convex/react";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
  useConvex: vi.fn(),
}));

// In test:
(useQuery as vi.Mock).mockReturnValue([
  { _id: "1", name: "Test Image" },
  { _id: "2", name: "Another Image" },
]);
```

### Clerk Auth

```typescript
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { id: "user_123", firstName: "Test" },
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: "user_123",
  }),
}));
```

### Next/Image

```typescript
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));
```

## Query Selector Priority

Use in this order (most accessible first):

| Priority | Selector | Example |
|----------|----------|---------|
| 1 | `getByRole` | `getByRole("button", { name: /submit/i })` |
| 2 | `getByLabelText` | `getByLabelText(/email/i)` |
| 3 | `getByPlaceholderText` | `getByPlaceholderText(/search/i)` |
| 4 | `getByText` | `getByText(/loading/i)` |
| 5 | `getByTestId` | `getByTestId("custom-element")` (last resort) |

## Async Testing

```typescript
import { render, screen, waitFor } from "@testing-library/react";

it("shows data after loading", async () => {
  render(<AsyncComponent />);
  
  // Wait for element to appear
  expect(await screen.findByText(/loaded/i)).toBeInTheDocument();
  
  // Or use waitFor for custom assertions
  await waitFor(() => {
    expect(screen.getByRole("list")).toHaveAttribute("data-loaded", "true");
  });
});
```

## User Event (Preferred over fireEvent)

```typescript
import userEvent from "@testing-library/user-event";

it("types in input", async () => {
  const user = userEvent.setup();
  render(<SearchInput />);
  
  const input = screen.getByRole("textbox");
  await user.type(input, "hello world");
  
  expect(input).toHaveValue("hello world");
});
```

## Guardrails

- **Test behavior, not implementation** — don't test internal state
- **Use accessible queries** — prefer `getByRole` over `getByTestId`
- **Mock at boundaries** — mock Convex hooks, not db internals
- **No arbitrary waits** — use `findBy*` or `waitFor`
- **If tests fail for unrelated reasons**, report and stop

## Output Format

```markdown
## Summary
Added tests for `[ComponentName]`.

## Test Cases
- [x] renders correctly
- [x] handles click event
- [x] shows loading state
- [x] displays error message

## Mocks Used
- `next/navigation` (useRouter)
- `convex/react` (useQuery)

## Verification
- `bun run test [file]` passed ✅
- [N] tests, [M] assertions
```
