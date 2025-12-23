# Story 007: Error Handling & Test Updates

## Overview
Implement comprehensive error handling for the new API and update all tests to match the migrated codebase.

## Priority: High
## Estimated Effort: 4 hours
## Dependencies: Stories 001-006

---

## Background

The new `gen.pollinations.ai` API has structured error responses with specific codes:
- `BAD_REQUEST` (400): Validation errors with field-level details
- `UNAUTHORIZED` (401): Missing or invalid API key
- `INTERNAL_ERROR` (500): Server-side failures

---

## Implementation Tasks

### 1. Error Boundary Component

Create `components/error-boundary.tsx`:
- React Error Boundary for generation failures
- Display user-friendly error messages
- Retry functionality

### 2. Toast Notifications

Update error handling to use Sonner toasts:
- Different toast types for error codes
- Rate limit exceeded warnings
- Retry suggestions for transient errors

### 3. Error Display Component

Create `components/image-generator/generation-error.tsx`:
- Display error details
- Show field-level validation errors
- Include retry button

---

## Error Code Mapping

| API Code | User Message |
|----------|--------------|
| BAD_REQUEST | "Invalid generation parameters" |
| UNAUTHORIZED | "Authentication required" |
| INTERNAL_ERROR | "Server error, please retry" |
| GENERATION_FAILED | "Generation failed" |

---

## Test Updates Required

### Unit Tests to Update

1. `lib/pollinations-api.test.ts`
   - Update URL assertions for new base URL
   - Add tests for new parameters (quality, transparent, guidance_scale)

2. `lib/api/image-api.test.ts`
   - Update mock responses
   - Test PollinationsApiError handling

3. `hooks/queries/use-generate-image.test.ts`
   - Update error type assertions
   - Test new parameters in generation

4. `lib/schemas/pollinations.schema.test.ts` (NEW)
   - Zod schema validation tests

### Test Commands

```bash
# Run all tests
bun test

# Run specific test file
bun test lib/pollinations-api.test.ts

# Run with coverage
bun test:coverage
```

---

## Acceptance Criteria

- [ ] PollinationsApiError class handles all error codes
- [ ] Error boundary catches rendering failures
- [ ] Toast notifications for all error types
- [ ] Field-level validation errors displayed
- [ ] All existing tests updated and passing
- [ ] New schema tests added
- [ ] 80%+ test coverage maintained

---

## Related Stories
- All previous stories
