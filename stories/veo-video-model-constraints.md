# Story: Veo Video Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** High  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Veo** video generation model. As a video model, Veo has different constraints than image models.

## Background

Veo is Google's video generation model:
- Generates video content from text prompts
- Limited aspect ratio options (optimized for video)
- Supports duration settings
- May support audio generation

Per the existing schema, video models support only:
- 16:9 (Landscape video)
- 9:16 (Portrait/vertical video)

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define Veo-specific aspect ratio presets
- [ ] **Limited to video-optimized ratios only:**

| Aspect Ratio | Resolution | Notes |
|--------------|------------|-------|
| 16:9 | Standard | Landscape video (default) |
| 9:16 | Standard | Vertical/portrait video |

- [ ] **Remove/Hide:** 1:1, 4:3, 3:4, 21:9, Custom (not optimized for video)

### 2. Dimension Controls

- [ ] **DISABLE** dimension slider/controls for video models
- [ ] Display: "Video resolution is determined by aspect ratio"
- [ ] Show duration selector instead of dimension controls

### 3. Video-Specific Controls

- [ ] Add duration selector:
  - **Min:** 2 seconds
  - **Max:** 10 seconds
  - **Step:** 1 second
  - **Default:** 5 seconds
- [ ] Add audio toggle (Veo supports audio generation)

### 4. Validation Logic

```typescript
const VEO_CONSTRAINTS = {
  type: 'video',
  fixedDimensions: true,
  allowCustomDimensions: false,
  supportedRatios: ['16:9', '9:16'],
  defaultRatio: '16:9',
  duration: {
    min: 2,
    max: 10,
    default: 5,
    step: 1,
  },
  supportsAudio: true,
}

function validateVeoParams(params: VideoParams): ValidationResult {
  if (!VEO_CONSTRAINTS.supportedRatios.includes(params.aspectRatio)) {
    return {
      valid: false,
      error: `Veo only supports ${VEO_CONSTRAINTS.supportedRatios.join(' or ')} aspect ratios`,
    }
  }
  
  if (params.duration < VEO_CONSTRAINTS.duration.min || 
      params.duration > VEO_CONSTRAINTS.duration.max) {
    return {
      valid: false,
      error: `Duration must be between ${VEO_CONSTRAINTS.duration.min} and ${VEO_CONSTRAINTS.duration.max} seconds`,
    }
  }
  
  return { valid: true }
}
```

### 5. UI Behavior

- [ ] When Veo model is selected:
  - Show **only** 16:9 and 9:16 aspect ratio cards
  - **Hide** dimension slider/controls
  - **Show** duration selector
  - **Show** audio toggle
  - Display "Video Mode" indicator
  - Show video preview placeholder

### 6. Default Values

- **Default Aspect:** 16:9 (landscape video)
- **Default Duration:** 5 seconds
- **Audio:** Off by default

### 7. Model Switching Behavior

When switching TO Veo:
- [ ] Map aspect ratio to nearest supported (16:9 or 9:16)
- [ ] Hide dimension controls
- [ ] Show video-specific controls
- [ ] Reset to video defaults

When switching FROM Veo:
- [ ] Hide video-specific controls
- [ ] Show image dimension controls
- [ ] Restore image mode UI

## Technical Notes

> [!IMPORTANT]
> Video models have completely different UI requirements. The generation interface should switch between image mode and video mode.

- Veo is a video generation model
- Uses `aspectRatio` parameter instead of width/height
- Supports duration and audio parameters
- Output is video file, not image

## Files to Modify

- `lib/config/model-constraints.ts` - **Add Veo constraints**
- `lib/image-models.ts` (or create separate video-models config)
- `components/studio/controls/duration-control.tsx` (new component)
- `components/studio/controls/audio-toggle.tsx` (new component)
- `components/studio/studio-client-shell.tsx` (mode switching)
- `hooks/use-studio-client-shell.ts` - Already has model change handling

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Extend `ModelConstraints` Type

First, extend the type in `types/pollinations.ts`:

```typescript
export interface ModelConstraints {
  // ... existing fields ...
  
  // New video-specific fields:
  type?: "image" | "video"
  duration?: {
    min: number
    max: number
    default: number
    step: number
  }
  supportsAudio?: boolean
}
```

### Add to `lib/config/model-constraints.ts`:

```typescript
export const VEO_CONSTRAINTS: ModelConstraints = {
  maxPixels: Infinity, // Not pixel-based
  minDimension: 0,
  maxDimension: 0, // Not applicable
  step: 1,
  defaultDimensions: { width: 1920, height: 1080 }, // HD default
  dimensionsEnabled: false, // ⚠️ KEY: Hides dimension controls
  type: "video",
  duration: {
    min: 2,
    max: 10,
    default: 5,
    step: 1,
  },
  supportsAudio: true,
} as const

export const VEO_ASPECT_RATIOS: readonly AspectRatioOption[] = [
  { label: "Landscape", value: "16:9", width: 1920, height: 1080, icon: "monitor", category: "landscape" },
  { label: "Portrait", value: "9:16", width: 1080, height: 1920, icon: "smartphone", category: "portrait" },
] as const // Only 2 options for video
```

### What's Already Working

- ✅ `dimensionsEnabled: false` hides dimension controls
- ✅ `getModelAspectRatios()` returns limited ratios
- ✅ `handleModelChange` resets to defaults

### New Work Required

- ❌ **DurationControl** component (new)
- ❌ **AudioToggle** component (new)  
- ❌ Mode detection (`constraints.type === "video"`)
- ❌ Conditional UI rendering for video mode

---

## Testing

- [ ] Verify only 16:9 and 9:16 are available
- [ ] Verify dimension controls are hidden
- [ ] Verify duration selector appears and works
- [ ] Verify audio toggle works
- [ ] Verify switching modes hides/shows correct controls
