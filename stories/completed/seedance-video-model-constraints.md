# Story: Seedance Video Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** High  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Seedance** video generation model. Similar to Veo, Seedance has video-specific constraints.

## Background

Seedance is a video generation model focused on:
- Dance/motion video generation
- Styled video content
- Animation-style outputs

Per the existing schema, video models support:
- 16:9 (Landscape video)
- 9:16 (Portrait/vertical video)

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define Seedance-specific aspect ratio presets
- [ ] **Limited to video-optimized ratios:**

| Aspect Ratio | Resolution | Notes |
|--------------|------------|-------|
| 16:9 | Standard | Landscape video |
| 9:16 | Standard | Vertical/portrait video (default for dance) |

- [ ] **Remove/Hide:** 1:1, 4:3, 3:4, 21:9, Custom

### 2. Dimension Controls

- [ ] **DISABLE** dimension slider/controls
- [ ] Display: "Video resolution is determined by aspect ratio"
- [ ] Show duration selector

### 3. Video-Specific Controls

- [ ] Add duration selector:
  - **Min:** 2 seconds
  - **Max:** 10 seconds
  - **Step:** 1 second
  - **Default:** 5 seconds
- [ ] Audio may not be supported (verify with API)

### 4. Validation Logic

```typescript
const SEEDANCE_CONSTRAINTS = {
  type: 'video',
  fixedDimensions: true,
  allowCustomDimensions: false,
  supportedRatios: ['16:9', '9:16'],
  defaultRatio: '9:16', // Portrait default for dance content
  duration: {
    min: 2,
    max: 10,
    default: 5,
    step: 1,
  },
  supportsAudio: false, // Verify with API
}
```

### 5. UI Behavior

- [ ] When Seedance model is selected:
  - Show **only** 16:9 and 9:16 aspect ratio cards
  - **Hide** dimension slider/controls
  - **Show** duration selector
  - Display "Video Mode" indicator
  - Show dance/motion style hints

### 6. Default Values

- **Default Aspect:** 9:16 (portrait, optimized for dance/motion)
- **Default Duration:** 5 seconds

### 7. Model Switching Behavior

Same as Veo:
- [ ] Map to nearest supported aspect ratio
- [ ] Switch to video mode UI
- [ ] Show appropriate controls

## Technical Notes

- Seedance optimized for motion/dance content
- Portrait (9:16) may be better default for dance
- Verify audio support with API

## Files to Modify

- `lib/config/model-constraints.ts` - **Add Seedance constraints**
- `components/studio/controls/duration-control.tsx` (reuse from Veo)
- `components/studio/studio-client-shell.tsx`
- `hooks/use-studio-client-shell.ts` - Already integrated

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Add to `lib/config/model-constraints.ts`:

```typescript
export const SEEDANCE_CONSTRAINTS: ModelConstraints = {
  maxPixels: Infinity,
  minDimension: 0,
  maxDimension: 0,
  step: 1,
  defaultDimensions: { width: 1080, height: 1920 }, // Portrait default
  dimensionsEnabled: false, // Hides dimension controls
  type: "video",
  duration: {
    min: 2,
    max: 10,
    default: 5,
    step: 1,
  },
  supportsAudio: false,
} as const

export const SEEDANCE_ASPECT_RATIOS: readonly AspectRatioOption[] = [
  { label: "Landscape", value: "16:9", width: 1920, height: 1080, icon: "monitor", category: "landscape" },
  { label: "Portrait", value: "9:16", width: 1080, height: 1920, icon: "smartphone", category: "portrait" },
] as const
```

### Video Model Pattern

```typescript
function isVideoModel(modelId: string): boolean {
  const videoModels = ["veo", "seedance", "seedance-pro"]
  return videoModels.some((m) => modelId.toLowerCase().includes(m))
}
```

### Reusable from Veo Story

- `DurationControl` component
- Video mode detection logic
- UI mode switching

---

## Testing

- [ ] Verify only 16:9 and 9:16 are available
- [ ] Verify dimension controls are hidden
- [ ] Verify duration selector works
- [ ] Verify 9:16 is default for dance optimization
