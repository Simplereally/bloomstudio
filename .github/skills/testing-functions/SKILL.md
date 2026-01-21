---
name: testing-functions
description: |
  Tests pure functions, utilities, and logic with Vitest.
  Input: Function/module to test.
  Output: Test file with unit tests for all cases.
---

# Testing Functions

Creates unit tests for pure functions, utilities, and business logic.

## Preconditions

- Function/module exists
- Function is testable (ideally pure — same input → same output)

## Algorithm

```markdown
1. Create test file:
   - [ ] Create `[filename].test.ts` next to source
   - [ ] Import function(s) to test

2. Identify test cases:
   - [ ] Happy path (normal inputs)
   - [ ] Edge cases (empty, null, boundaries)
   - [ ] Error cases (invalid inputs)

3. Write tests:
   - [ ] Use descriptive `it()` names
   - [ ] One assertion per test (usually)
   - [ ] Group related tests in `describe()`

4. Run and verify:
   - [ ] Run `bun run test [file]`
```

## Template: Basic Function Test

```typescript
// lib/utils/format.test.ts
import { describe, it, expect } from "vitest";
import { formatBytes, formatDuration, truncate } from "./format";

describe("formatBytes", () => {
  it("formats bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  it("handles large values", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});

describe("truncate", () => {
  it("returns string unchanged if under limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates with ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
  });

  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
  });
});
```

## Template: Validation Logic

```typescript
// lib/config/models.test.ts
import { describe, it, expect } from "vitest";
import { MODEL_REGISTRY, getModel, getModelConstraints } from "./models";

describe("MODEL_REGISTRY", () => {
  it("contains expected image models", () => {
    expect(MODEL_REGISTRY.flux).toBeDefined();
    expect(MODEL_REGISTRY.flux.type).toBe("image");
  });

  it("contains expected video models", () => {
    expect(MODEL_REGISTRY.veo).toBeDefined();
    expect(MODEL_REGISTRY.veo.type).toBe("video");
  });

  it("all models have required fields", () => {
    Object.values(MODEL_REGISTRY).forEach((model) => {
      expect(model.id).toBeDefined();
      expect(model.displayName).toBeDefined();
      expect(model.type).toMatch(/^(image|video)$/);
      expect(model.constraints).toBeDefined();
    });
  });
});

describe("getModel", () => {
  it("returns model by ID", () => {
    const model = getModel("flux");
    expect(model?.displayName).toBe("Flux Schnell");
  });

  it("returns undefined for unknown model", () => {
    expect(getModel("unknown")).toBeUndefined();
  });

  it("is case-insensitive", () => {
    expect(getModel("FLUX")).toEqual(getModel("flux"));
  });
});
```

## Template: Async Function

```typescript
// lib/api/client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWithRetry } from "./client";

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns data on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    });

    const result = await fetchWithRetry("/api/test");
    expect(result).toEqual({ data: "test" });
  });

  it("retries on 5xx errors", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: () => ({ data: "test" }) });

    const result = await fetchWithRetry("/api/test");
    
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: "test" });
  });

  it("throws on 4xx errors without retry", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });

    await expect(fetchWithRetry("/api/test")).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
```

## Existing Test Files (Reference)

| File | Tests |
|------|-------|
| `lib/config/models.test.ts` | Model registry validation |
| `lib/config/resolution-tiers.test.ts` | Resolution calculations |
| `lib/config/standard-resolutions.test.ts` | Resolution presets |
| `convex/lib/pollinations.test.ts` | API URL building |
| `convex/lib/retry.test.ts` | Retry logic |
| `convex/lib/r2.test.ts` | Storage helpers |
| `convex/rateLimits.test.ts` | Rate limiting |

## Test Patterns

### Table-Driven Tests

```typescript
it.each([
  [768, 768, true],    // square within limit
  [1024, 768, true],   // landscape within limit
  [2048, 2048, false], // exceeds max pixels
])("validates dimensions (%i x %i) = %s", (width, height, expected) => {
  expect(isValidDimension(width, height)).toBe(expected);
});
```

### Error Testing

```typescript
it("throws on invalid input", () => {
  expect(() => parseConfig(null)).toThrow("Config is required");
});

// Async errors
it("rejects with error message", async () => {
  await expect(fetchData("invalid")).rejects.toThrow(/not found/i);
});
```

### Snapshot Testing

```typescript
it("generates correct config", () => {
  const config = buildConfig({ model: "flux", width: 768 });
  expect(config).toMatchSnapshot();
});
```

## Guardrails

- **Test pure logic** — no DOM, no React
- **Isolated tests** — each test independent
- **Mock external deps** — fetch, timers, env vars
- **No implementation details** — test inputs/outputs
- **If tests fail for unrelated reasons**, report and stop

## Output Format

```markdown
## Summary
Added tests for `[module/function]`.

## Test Cases
- [x] handles normal input
- [x] handles edge case: empty
- [x] handles edge case: max value
- [x] throws on invalid input

## Coverage
- Functions tested: `formatBytes`, `truncate`
- Edge cases covered: empty, null, boundaries

## Verification
- `bun run test [file]` passed ✅
- [N] tests, [M] assertions
```
