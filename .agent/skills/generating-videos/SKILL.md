---
name: generating-videos
description: |
  Generates videos using Pollinations API. Validates duration, audio, and interpolation capabilities.
  Use for: video generation logic, model selection, duration constraints.
  DO NOT use for: image generation (use generating-images), thumbnailing (handled automatically).
---

# Generating Videos

Generates videos via Pollinations API. All model config lives in `lib/config/models.ts`.

## Source of Truth

- **Model Registry**: `lib/config/models.ts` — READ THIS FIRST
- **Generation Processor**: `convex/singleGenerationProcessor.ts`
- **Thumbnail Extraction**: `convex/lib/videoThumbnail.ts`

## Current Video Models

See `lib/config/models.ts` for current video models.

## Model Capabilities

```typescript
// From lib/config/models.ts
interface VideoModel {
  supportsAudio?: boolean;           // Can generate video with audio (Veo only)
  supportsInterpolation?: boolean;   // Supports first/last frame images (Veo only)
  durationConstraints: {
    min: number;                     // Minimum seconds
    max: number;                     // Maximum seconds
    fixedOptions?: number[];         // If set, only these values allowed
    defaultDuration: number;         // Default if not specified
  };
}
```

## Workflow: Generate Video

```markdown
- [ ] 1. Read `lib/config/models.ts` to confirm model exists and `type === "video"`
- [ ] 2. Validate duration:
       - `duration >= durationConstraints.min`
       - `duration <= durationConstraints.max`
       - If `fixedOptions` exists, `duration` must be in list
- [ ] 3. If `supportsAudio === false`, do NOT send `audio` param
- [ ] 4. If `supportsInterpolation === false`, do NOT send `lastFrameImage` param
- [ ] 5. Call `startGeneration` mutation in `convex/singleGeneration.ts`
- [ ] 6. Processor auto-generates thumbnail via `videoThumbnail.ts`
```

## Duration Validation

```typescript
function validateDuration(model: ModelDefinition, duration: number): boolean {
  const { durationConstraints } = model;
  if (!durationConstraints) return false;
  
  // Check range
  if (duration < durationConstraints.min || duration > durationConstraints.max) {
    return false;
  }
  
  // Check fixed options if applicable
  if (durationConstraints.fixedOptions) {
    return durationConstraints.fixedOptions.includes(duration);
  }
  
  return true;
}
```

## Decision Tree

```
Model selected?
├─ veo → supports audio & interpolation
│  ├─ User wants audio? → Include audio=true
│  └─ User has reference images? → Include firstFrameImage, lastFrameImage
├─ seedance-pro → no audio, no interpolation
│  └─ Duration: 2-10s (any value)
└─ seedance → no audio, no interpolation
   └─ Duration: 2-10s (any value)
```

## Guardrails

- **Never guess model IDs.** Always read `MODEL_REGISTRY` from `lib/config/models.ts`.
- **Never send unsupported params.** Check `supportsAudio` before including `audio`.
- **Veo requires fixed durations.** Only 4, 6, or 8 seconds allowed.
- **Thumbnail is automatic.** Do not manually call thumbnail generation.
- **If duration invalid**, return error with valid range/options.

## Testing

Extend `convex/lib/pollinations.test.ts`:
- Verify `duration` only sent for video models
- Verify `audio` only sent when `supportsAudio === true`
- Mock ffmpeg when testing thumbnail extraction

Run with: `bun run test convex/lib/pollinations.test.ts`

## Output Format

```markdown
## Summary
Generated [model] video, [duration]s.

## Validation
- Model: `veo` ✅
- Duration: 6s ✅ (fixed options: 4, 6, 8)
- Audio: requested ✅ (supported)
- Interpolation: not requested

## Result
- Generation ID: `xyz789`
- Status: completed ✅
- Thumbnail: generated ✅

## Errors (if any)
- [Error details]
```
