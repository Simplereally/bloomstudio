---
name: generating-images
description: |
  Generates images using Pollinations API. Validates model constraints and dimensions.
  Use for: image generation logic, model selection, constraint validation.
  DO NOT use for: video generation (use generating-videos), UI styling (use styling-ui).
---

# Generating Images

Generates images via Pollinations API. All model config lives in `lib/config/models.ts`.

## Source of Truth

- **Model Registry**: `lib/config/models.ts` — READ THIS FIRST
- **Generation Processor**: `convex/singleGenerationProcessor.ts`
- **URL Building**: `convex/lib/pollinations.ts`
- **Resolution Tiers**: `lib/config/resolution-tiers.ts`
- **Standard Resolutions**: `lib/config/standard-resolutions.ts`

## Current Image Models

See `lib/config/models.ts` for current image models.

## Workflow: Generate Image

```markdown
- [ ] 1. Read `lib/config/models.ts` to confirm model exists and `type === "image"`
- [ ] 2. Validate dimensions:
       - `width % step === 0`
       - `height % step === 0`
       - `width * height <= maxPixels`
       - `width <= maxDimension && height <= maxDimension`
- [ ] 3. If model `supportsNegativePrompt === false`, do NOT send negative prompt param
- [ ] 4. Call `startGeneration` mutation in `convex/singleGeneration.ts`
- [ ] 5. Verify generation completes or report error
```

## Dimension Validation

```typescript
// Example validation logic
function validateDimensions(model: ModelDefinition, width: number, height: number): boolean {
  const { constraints } = model;
  const pixels = width * height;
  
  return (
    width % constraints.step === 0 &&
    height % constraints.step === 0 &&
    pixels <= constraints.maxPixels &&
    width <= constraints.maxDimension &&
    height <= constraints.maxDimension &&
    width >= constraints.minDimension &&
    height >= constraints.minDimension
  );
}
```

## Error Handling

| HTTP Code | Behavior |
|-----------|----------|
| 200 | Success |
| 400 | Fail immediately — invalid params |
| 429 | Retry with backoff (rate limit) |
| 5xx | Retry with backoff (server error) |

Reference: `convex/lib/retry.ts` for retry logic.

## Guardrails

- **Never guess model IDs.** Always read `MODEL_REGISTRY` from `lib/config/models.ts`.
- **Never send unsupported params.** Check `supportsNegativePrompt` before including it.
- **If validation fails**, return clear error message. Don't attempt generation.
- **If model not found**, list available image models and ask user to choose.

## Testing

Reference files:
- `lib/config/models.test.ts` — Model validation tests
- `convex/lib/pollinations.test.ts` — API integration tests

Run with: `bun run test lib/config/models.test.ts`

## Output Format

```markdown
## Summary
Generated [model] image at [width]x[height].

## Validation
- Model: `flux` ✅
- Dimensions: 768x768 ✅ (step=8, max=768)
- Pixels: 589,824 ≤ 589,824 ✅

## Result
- Generation ID: `abc123`
- Status: completed ✅

## Errors (if any)
- [Error details]
```
