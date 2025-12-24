# Story: Seedance Pro Video Model Dimension Constraints

> **Epic:** Model-Specific UI Behavior  
> **Priority:** High  
> **Status:** Draft

## Overview

Implement model-specific dimension and aspect ratio handling for the **Seedance Pro** video generation model. This is the professional tier of Seedance with enhanced video capabilities.

## Background

Seedance Pro offers:
- Higher quality video generation
- Enhanced motion/dance synthesis
- Professional-tier processing
- Same aspect ratio constraints as base Seedance

## Acceptance Criteria

### 1. Aspect Ratio Cards

- [ ] Define Seedance Pro-specific aspect ratio presets
- [ ] **Limited to video-optimized ratios:**

| Aspect Ratio | Resolution | Notes |
|--------------|------------|-------|
| 16:9 | Standard HD | Landscape video |
| 9:16 | Standard HD | Vertical/portrait video (default) |

- [ ] **Remove/Hide:** 1:1, 4:3, 3:4, 21:9, Custom

### 2. Dimension Controls

- [ ] **DISABLE** dimension slider/controls
- [ ] Display: "Seedance Pro uses optimized HD resolutions"
- [ ] Show duration selector

### 3. Video-Specific Controls

- [ ] Add duration selector:
  - **Min:** 2 seconds
  - **Max:** 10 seconds
  - **Step:** 1 second
  - **Default:** 5 seconds

### 4. Validation Logic

```typescript
const SEEDANCE_PRO_CONSTRAINTS = {
  type: 'video',
  tier: 'pro',
  fixedDimensions: true,
  allowCustomDimensions: false,
  supportedRatios: ['16:9', '9:16'],
  defaultRatio: '9:16', // Portrait default for dance
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

- [ ] When Seedance Pro model is selected:
  - Show **only** 16:9 and 9:16 aspect ratio cards
  - **Hide** dimension slider/controls
  - **Show** duration selector
  - Display "Pro" badge indicator
  - Display "Video Mode" indicator

### 6. Default Values

- **Default Aspect:** 9:16 (portrait, optimized for dance/motion)
- **Default Duration:** 5 seconds

## Technical Notes

- Pro tier video model
- Display "Pro" badge
- Same constraints as base Seedance
- Higher quality output

## Files to Modify

- `lib/config/model-constraints.ts` - **Add Seedance Pro constraints (or reuse Seedance)**
- `components/studio/controls/duration-control.tsx` (reuse from Veo)
- `components/studio/studio-client-shell.tsx`
- `hooks/use-studio-client-shell.ts` - Already integrated

---

## Existing Infrastructure

> **✅ Implemented in Flux Model Constraints story**

### Reuse Seedance Constraints

```typescript
// Seedance Pro shares constraints with base Seedance
function isSeedanceModel(modelId: string): boolean {
  return modelId.toLowerCase().includes("seedance")
}

// getModelConstraints() returns same SEEDANCE_CONSTRAINTS for both tiers
```

### What's Inherited

- ✅ `dimensionsEnabled: false` (hides sliders)
- ✅ Limited aspect ratios (16:9, 9:16)
- ✅ Video mode detection via `type: "video"`

### Pro Badge Handling

- Badge logic handled in `ModelSelector` component
- Constraint system doesn't differentiate tiers

---

## Testing

- [ ] Verify only 16:9 and 9:16 are available
- [ ] Verify dimension controls are hidden
- [ ] Verify "Pro" badge is displayed
- [ ] Verify duration selector works
